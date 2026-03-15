package com.tempusvicta.app.storage

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(entities = [SyncJournalEntry::class], version = 2)
abstract class TwinDatabase : RoomDatabase() {
    abstract fun syncDao(): SyncDao

    companion object {
        @Volatile
        private var INSTANCE: TwinDatabase? = null

        // MIGRATION 1 -> 2: Transition from Phase 1.0 to Phase 1.7
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                // In Phase 1.0 we may have had a simpler schema. 
                // This ensures we don't wipe existing journal entries if version 1 existed.
                // If the table didn't exist, Room handles creation via onCreate.
            }
        }

        fun getInstance(context: Context): TwinDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    TwinDatabase::class.java,
                    "twin_database"
                )
                .addMigrations(MIGRATION_1_2)
                // .fallbackToDestructiveMigration() // REMOVED in Phase 1.7 for trust/persistence
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
