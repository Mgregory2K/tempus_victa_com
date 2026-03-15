package com.tempusvicta.app.storage

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.*

@Entity(tableName = "sync_journal")
data class SyncJournalEntry(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val objectId: String,       // The ID of the specific memory/event
    val type: String,           // EVENT, PREF, FACT, BLOB
    val action: String,         // CREATE, UPDATE, DELETE
    val timestamp: Long = System.currentTimeMillis(),
    val deviceId: String,
    val checksum: String,       // SHA-256 of payload for conflict detection
    val payload: String,        // JSON Blob
    val status: Int = 0         // 0: Pending, 1: Synced, 2: Conflict
)
