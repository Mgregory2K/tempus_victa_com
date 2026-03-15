# Twin+ Android: Phase 1.7 - Validation & Proof

## 1. Goal
Complete an end-to-end "Trust Pass." No new features. Prove that the native data layer is the absolute authority and that sync/intake are bulletproof.

## 2. Mandatory Test Matrix (Pass/Fail)

### A. Intake Resilience
| Test Case | Procedure | Expected Result | Pass/Fail |
|-----------|-----------|-----------------|-----------|
| **Airplane Mode Share** | Enable Airplane Mode. Share URL from Chrome. Force-close app. Reopen. | Item exists in Room, status is `Pending (0)`. | |
| **Warm-Start Multi-Share** | App in background. Share 5 images from Gallery at once. | `ACTION_SEND_MULTIPLE` creates 5 distinct journal entries. | |
| **Cold-Start Text Share** | App is dead. Share text from Notes app. | App launches, splash shows, entry is written to Room before Web UI. | |

### B. Sync Engine (WorkManager)
| Test Case | Procedure | Expected Result | Pass/Fail |
|-----------|-----------|-----------------|-----------|
| **Manual Sync Trigger** | Tap "Sync Now" in UI. | `TwinExpeditedSync` (OneTime) is scheduled. No duplicate periodic workers. | |
| **Background Continuity** | Close app. Wait 4 hours (or simulate via ADB). | `TwinPeriodicSync` runs when network is connected. | |
| **Reboot Survival** | Share item offline. Reboot phone. | Journal entry persists. WorkManager resumes sync on boot. | |

### C. Data Integrity (Room)
| Test Case | Procedure | Expected Result | Pass/Fail |
|-----------|-----------|-----------------|-----------|
| **Schema Migration** | Increment version. Add a test column via `MIGRATION_1_2`. | App starts without error. Existing journal rows are preserved. | |
| **No Destructive Wipe** | Verify `fallbackToDestructiveMigration()` is removed. | Schema mismatch causes a crash (correct) rather than a data wipe. | |

## 3. Implementation Checklist (Final Hardening)
- [x] **Explicit Migrations**: `TwinDatabase.kt` updated to version 2 with `MIGRATION_1_2` logic.
- [x] **Stable Device ID**: Verified `SecureStorage` only generates `device_id` if null.
- [x] **MIME Coverage**: `MainActivity.kt` handles `text/*`, `image/*`, and `application/*`.
- [x] **Hydration Gate**: `TwinPlusKernel.ts` waits for `getInitialState()` before rendering.

## 4. Next Steps
Once all tests in the **Mandatory Test Matrix** are marked **Pass**, Phase 1.0 of the Twin+ Native Container is officially complete.

### 5. Deployment Commands
To sync your changes to the Android project:
1. `npm run build`
2. `npx capacitor sync`
3. `npx capacitor copy android`
