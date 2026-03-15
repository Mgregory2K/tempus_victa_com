package com.tempusvicta.app.storage

import androidx.room.*

@Dao
interface SyncDao {
    @Query("SELECT * FROM sync_journal WHERE status = 0 ORDER BY timestamp ASC")
    suspend fun getPending(): List<SyncJournalEntry>

    @Query("SELECT * FROM sync_journal WHERE status = 2")
    suspend fun getConflicts(): List<SyncJournalEntry>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: SyncJournalEntry)

    @Update
    suspend fun update(entry: SyncJournalEntry)

    @Query("UPDATE sync_journal SET status = :status WHERE id = :id")
    suspend fun updateStatus(id: String, status: Int)

    @Query("SELECT * FROM sync_journal WHERE objectId = :objectId ORDER BY timestamp DESC LIMIT 1")
    suspend fun getLatestForObject(objectId: String): SyncJournalEntry?

    @Query("SELECT COUNT(*) FROM sync_journal WHERE status = 0")
    suspend fun getPendingCount(): Int

    @Query("DELETE FROM sync_journal WHERE status = 1 AND timestamp < :before")
    suspend fun cleanupSynced(before: Long)
}
