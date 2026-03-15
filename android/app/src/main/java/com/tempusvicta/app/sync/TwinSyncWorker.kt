package com.tempusvicta.app.sync

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.tempusvicta.app.storage.TwinDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class TwinSyncWorker(appContext: Context, params: WorkerParameters) :
    CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val db = TwinDatabase.getInstance(applicationContext)
        val pending = db.syncDao().getPending()

        if (pending.isEmpty()) {
            Log.d("TwinSyncWorker", "No pending entries to sync.")
            return@withContext Result.success()
        }

        Log.d("TwinSyncWorker", "Syncing ${pending.size} entries...")

        try {
            // TODO: Implementation of the actual network sync
            // 1. Authenticate using stored tokens
            // 2. Push pending journal entries to /api/twin/sync
            // 3. Receive updates/conflicts
            // 4. Update Room DB status
            
            // Simulating success for now:
            pending.forEach { 
                db.syncDao().updateStatus(it.id, 1) 
            }

            Result.success()
        } catch (e: Exception) {
            Log.e("TwinSyncWorker", "Sync failed", e)
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
}
