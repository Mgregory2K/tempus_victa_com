# Twin+ Android: Phase 1.6 - Validation and Hardening

## 1. Goal
Transition from "Feature Development" to "Production Hardening." Ensure the Native Authority is absolute, the Sync Engine is reliable, and the UI provides clear health visibility. **No more architecture churn.**

## 2. Instructions for Android Studio / Kotlin

### A. Full Share-Intake Matrix (`MainActivity.kt`)
- **Cover All Bases**: Ensure `handleIntent` correctly processes:
    - `ACTION_SEND` (Single item)
    - `ACTION_SEND_MULTIPLE` (Multiple images/files)
    - **MIME Support**: `text/plain`, `text/*`, `image/*`, and generic `application/*` for PDFs/Docs.
- **Lifecycle Resilience**: Verify intake works on:
    - **Cold Start**: App is dead; user shares from another app.
    - **Warm Start**: App is in background; user shares.
    - **Running**: App is in foreground; user shares.
- **Immediate Write**: Data must be written to Room *before* any Capacitor/Web logic executes.

### B. Real WorkManager Scheduling (`TwinNativePlugin.kt`)
- **Unique Periodic Sync**: 
    - Use `enqueueUniquePeriodicWork` with `ExistingPeriodicWorkPolicy.KEEP`.
    - Interval: 4 Hours.
    - Constraint: `NetworkType.CONNECTED`.
- **Expedited One-Time Sync**:
    - Use `OneTimeWorkRequestBuilder`.
    - Set `setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)`.
    - Triggered by the UI for "manual sync" or "urgent save."
- **Backoff**: Implement Exponential Backoff (1 min initial) for failed syncs.

### C. Device Identity Stability
- Verify `device_id` in `SecureStorage`:
    - It must be generated **once** (check if null before creating).
    - It must survive force-closes and device reboots.
    - It must be the `deviceId` field in every `SyncJournalEntry`.

### D. Safe Room Migrations (`TwinDatabase.kt`)
- **Remove `fallbackToDestructiveMigration()`**.
- Create an explicit `Migration(1, 2)` (or current version) to add new columns or tables.
- **NEVER** wipe user data (journal, captures, memory pack) once Phase 1.6 begins.

## 3. Instructions for Web Layer (`src/core`)

### A. Native Authority Lock
- **Hydration Gate**: The `ClientShell.tsx` or `Kernel.init()` must wait for `TwinNative.getInitialState()` before allowing the UI to render "Empty" states.
- **Kill localStorage**: On Android, `localStorage` must never be the target for `append()` or `merge()` calls. Use the Native Bridge exclusively.

### B. Observable Health UI
- Expose the following from the Kernel/Native bridge to the React components:
    - `syncStatus.pendingCount`: How many items are waiting to go up.
    - `syncStatus.conflictCount`: How many items need manual resolution.
    - `syncStatus.lastSync`: Human-readable timestamp of the last success.
    - `syncStatus.isSyncing`: Boolean for "Syncing now..." spinner.

## 4. Success Criteria (The "DNA" Test)
1. **Airplane Mode**: Share a URL from Chrome. Force-close app. Reopen. Item must be visible and marked "Pending."
2. **Reconnect**: Turn on Wi-Fi. Wait or Trigger Sync. Item must transition to "Synced" and appear on the server.
3. **Identity**: Delete app cache (but not data) and verify `device_id` remains the same.
