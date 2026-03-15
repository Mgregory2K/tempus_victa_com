package com.tempusvicta.app

import androidx.work.*
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.tempusvicta.app.storage.SyncJournalEntry
import com.tempusvicta.app.storage.TwinDatabase
import com.tempusvicta.app.storage.SecureStorage
import com.tempusvicta.app.sync.TwinSyncWorker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.util.UUID
import java.util.concurrent.TimeUnit

@CapacitorPlugin(name = "TwinNative")
class TwinNativePlugin : Plugin() {
    private val scope = CoroutineScope(Dispatchers.IO)
    private lateinit var secureStorage: SecureStorage

    override fun load() {
        secureStorage = SecureStorage(context)
        ensureDeviceId()
        schedulePeriodicSync()
    }

    private fun ensureDeviceId() {
        if (secureStorage.getSecret("device_id") == null) {
            secureStorage.setSecret("device_id", UUID.randomUUID().toString())
        }
    }

    private fun schedulePeriodicSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = PeriodicWorkRequestBuilder<TwinSyncWorker>(4, TimeUnit.HOURS)
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "TwinPeriodicSync",
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )
    }

    @PluginMethod
    fun getInitialState(call: PluginCall) {
        scope.launch {
            val db = TwinDatabase.getInstance(context)
            val pending = db.syncDao().getPending()
            val conflicts = db.syncDao().getConflicts().size
            
            val memoryPackFile = File(context.filesDir, "twin_memory_pack.json")
            val memoryPackJson = if (memoryPackFile.exists()) memoryPackFile.readText() else "{}"
            
            val pendingArray = JSArray()
            pending.forEach { entry ->
                val obj = JSObject()
                obj.put("id", entry.id)
                obj.put("type", entry.type)
                obj.put("payload", entry.payload)
                pendingArray.put(obj)
            }

            val ret = JSObject()
            ret.put("memoryPack", memoryPackJson)
            ret.put("pendingCaptures", pendingArray)
            ret.put("deviceId", secureStorage.getSecret("device_id"))
            
            val syncStatus = JSObject()
            syncStatus.put("pendingCount", pending.size)
            syncStatus.put("conflictCount", conflicts)
            syncStatus.put("lastSync", secureStorage.getSecret("last_sync_time") ?: "NEVER")
            
            // Get current worker state
            val workInfos = WorkManager.getInstance(context).getWorkInfosForUniqueWork("TwinPeriodicSync").get()
            syncStatus.put("isSyncing", workInfos.firstOrNull()?.state == WorkInfo.State.RUNNING)
            
            ret.put("syncStatus", syncStatus)
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun triggerSync(call: PluginCall) {
        val expedited = call.getBoolean("expedited") ?: false
        
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = OneTimeWorkRequestBuilder<TwinSyncWorker>()
            .setConstraints(constraints)
            .apply {
                if (expedited) setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            }
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            "TwinExpeditedSync",
            ExistingWorkPolicy.REPLACE,
            syncRequest
        )
        call.resolve()
    }

    @PluginMethod
    fun getSyncStatus(call: PluginCall) {
        scope.launch {
            val db = TwinDatabase.getInstance(context)
            val pending = db.syncDao().getPendingCount()
            val conflicts = db.syncDao().getConflicts().size
            
            val ret = JSObject()
            ret.put("pendingCount", pending)
            ret.put("conflictCount", conflicts)
            ret.put("lastSync", secureStorage.getSecret("last_sync_time") ?: "NEVER")
            
            val workInfos = WorkManager.getInstance(context).getWorkInfosForUniqueWork("TwinExpeditedSync").get()
            val isSyncing = workInfos.firstOrNull()?.state == WorkInfo.State.RUNNING
            ret.put("isSyncing", isSyncing)
            
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun saveMemoryPack(call: PluginCall) {
        val json = call.getString("bundleJson") ?: return call.reject("No data")
        scope.launch {
            try {
                val file = File(context.filesDir, "twin_memory_pack.json")
                file.writeText(json)
                call.resolve()
            } catch (e: Exception) {
                call.reject(e.message)
            }
        }
    }

    @PluginMethod
    fun loadMemoryPack(call: PluginCall) {
        try {
            val file = File(context.filesDir, "twin_memory_pack.json")
            if (!file.exists()) {
                val ret = JSObject()
                ret.put("bundleJson", "{}")
                call.resolve(ret)
                return
            }
            val json = file.readText()
            val ret = JSObject()
            ret.put("bundleJson", json)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject(e.message)
        }
    }

    @PluginMethod
    fun enqueueCapture(call: PluginCall) {
        val type = call.getString("type") ?: "text"
        val content = call.getString("content") ?: return call.reject("No content")
        val metadata = call.getString("metadata") ?: "{}"

        scope.launch {
            val db = TwinDatabase.getInstance(context)
            val entry = SyncJournalEntry(
                objectId = "cap_${System.currentTimeMillis()}",
                type = "CAPTURE_$type",
                action = "CREATE",
                deviceId = secureStorage.getSecret("device_id") ?: "unknown",
                checksum = "0",
                payload = content
            )
            db.syncDao().insert(entry)
            
            val ret = JSObject()
            ret.put("entryId", entry.id)
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun setSecret(call: PluginCall) {
        val key = call.getString("key") ?: return call.reject("Key missing")
        val value = call.getString("value") ?: return call.reject("Value missing")
        secureStorage.setSecret(key, value)
        call.resolve()
    }

    @PluginMethod
    fun getSecret(call: PluginCall) {
        val key = call.getString("key") ?: return call.reject("Key missing")
        val value = secureStorage.getSecret(key)
        val ret = JSObject()
        ret.put("value", value)
        call.resolve(ret)
    }

    @PluginMethod
    fun getDeviceId(call: PluginCall) {
        val ret = JSObject()
        ret.put("id", secureStorage.getSecret("device_id"))
        call.resolve(ret)
    }
}
