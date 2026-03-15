# Twin+ Android: Phase 1.5 - Native Authority Completion

## 1. Goal
Promote the Android Native layer from a "sidekick" to the **Primary Authority**. The Web UI (Next.js) must treat the Native Bridge as its source of truth for hydration and persistence.

## 2. Instructions for Android Studio / Kotlin

### A. Update `TwinNativePlugin.kt`
- **Hydration**: Ensure `getInitialState()` returns the current `deviceId`, the latest `memoryPack` JSON, and the queue of `pendingCaptures`.
- **Identity**: Generate and store a persistent `device_id` in `SecureStorage` (using `UUID.randomUUID()`). **Do not use hardware IDs.**
- **Sync Trigger**: Implement a bridge to `WorkManager` that uses `ExistingPeriodicWorkPolicy.KEEP` for background sync and `OneTimeWorkRequest` for expedited user-triggered syncs.

### B. Update `SyncDao.kt`
- Add methods to query `pendingCount` and `getConflicts()`.
- Add `getLatestForObject(objectId)` to prevent redundant capture entries.

### C. Update `TwinDatabase.kt`
- Increment version to `2`.
- Enable `fallbackToDestructiveMigration()` for this phase to allow schema changes in the Sync Journal.

### D. MainActivity Handling
- Ensure `handleIntent` supports `ACTION_SEND` and `ACTION_SEND_MULTIPLE`.
- Implement MIME type routing: 
    - `text/plain` & `text/*` -> Text Capture.
    - `image/*` -> Image Capture.
    - Others -> File Ingestion.
- **Critical**: Write shared data to Room *immediately* on intent receipt, regardless of whether the WebView is loaded.

## 3. Instructions for Web Layer (`src/core`)

### A. `twin_plus_kernel.ts`
- On `init()`, call `TwinNative.getInitialState()` first.
- If native, disable `localStorage` writes and route all `observe()` calls to `TwinNative.enqueueCapture`.
- Use the native `deviceId` for all system events.

### B. `twin_event_ledger.ts`
- Refactor to a repository pattern: `LedgerRepository`.
- Implementation switches based on `Capacitor.isNativePlatform()`.
- Native implementation calls `TwinNative.loadMemoryPack()` and `TwinNative.saveMemoryPack()`.

## 4. Sync Engine Logic
- **Periodic Sync**: Every 4 hours (WorkManager constrained to `NetworkType.CONNECTED`).
- **Expedited Sync**: Triggered on significant user action or manual pull-to-refresh.
- **Conflict Resolution**:
    1. If `local.checksum == server.checksum` -> No-op.
    2. If `server.version > local.version` AND `local` is not pending -> Accept server.
    3. If both changed -> Mark `status = 2` (Conflict) in Room and alert the Web UI.
