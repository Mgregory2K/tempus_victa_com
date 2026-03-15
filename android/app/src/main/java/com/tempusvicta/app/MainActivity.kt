package com.tempusvicta.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import com.getcapacitor.BridgeActivity
import com.tempusvicta.app.storage.SecureStorage
import com.tempusvicta.app.storage.SyncJournalEntry
import com.tempusvicta.app.storage.TwinDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

class MainActivity : BridgeActivity() {
    private val scope = CoroutineScope(Dispatchers.IO)
    private lateinit var secureStorage: SecureStorage

    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(TwinNativePlugin::class.java)
        super.onCreate(savedInstanceState)
        secureStorage = SecureStorage(this)
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        if (intent == null) return
        
        when (intent.action) {
            Intent.ACTION_SEND -> {
                handleSendIntent(intent)
            }
            Intent.ACTION_SEND_MULTIPLE -> {
                handleSendMultipleIntent(intent)
            }
        }
    }

    private fun handleSendIntent(intent: Intent) {
        val type = intent.type ?: return
        
        if (type.startsWith("text/")) {
            val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
            val subject = intent.getStringExtra(Intent.EXTRA_SUBJECT) ?: ""
            if (sharedText != null) {
                captureToJournal("text", sharedText, subject)
            }
        } else {
            val streamUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            if (streamUri != null) {
                captureToJournal("file", streamUri.toString(), type)
            }
        }
    }

    private fun handleSendMultipleIntent(intent: Intent) {
        val type = intent.type ?: return
        val streamUris = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
        
        streamUris?.forEach { uri ->
            captureToJournal("file", uri.toString(), type)
        }
    }

    private fun captureToJournal(type: String, content: String, metadata: String) {
        scope.launch {
            try {
                val db = TwinDatabase.getInstance(applicationContext)
                val deviceId = secureStorage.getSecret("device_id") ?: "unknown_android"
                
                val payload = JSONObject().apply {
                    put("content", content)
                    put("source_metadata", metadata)
                    put("captured_at", System.currentTimeMillis())
                }.toString()

                val entry = SyncJournalEntry(
                    objectId = "cap_${System.currentTimeMillis()}_${(0..999).random()}",
                    type = "CAPTURE_$type",
                    action = "CREATE",
                    deviceId = deviceId,
                    checksum = "0", // Future: SHA-256 of payload
                    payload = payload
                )
                db.syncDao().insert(entry)
                Log.d("MainActivity", "Successfully captured $type to journal")
            } catch (e: Exception) {
                Log.e("MainActivity", "Failed to capture to journal", e)
            }
        }
    }
}
