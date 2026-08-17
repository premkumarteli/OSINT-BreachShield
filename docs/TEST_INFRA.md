# E2E Test Infra: OSINT BreachShield

## Test Philosophy
- Opaque-box, requirement-driven testing covering the full multi-platform architecture.
- Multi-tier validation methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.

## Feature Inventory & Test Coverage Matrix
| # | Feature | Source | Tier 1 (Feature Coverage) | Tier 2 (Boundaries & Corners) | Tier 3 (Cross-Feature) | Tier 4 (Real-World Scenarios) |
|---|---------|--------|:-------------------------:|:-----------------------------:|:----------------------:|:-----------------------------:|
| 1 | OTP Dispatch & Rate Limiting | ORIGINAL_REQUEST §R1 | 5 cases | 5 cases | ✓ | ✓ |
| 2 | Guarded Search Pipeline (403 Enforcement) | ORIGINAL_REQUEST §R1 | 5 cases | 5 cases | ✓ | ✓ |
| 3 | WebSocket Protocol & Heartbeat | ORIGINAL_REQUEST §R2 | 5 cases | 5 cases | ✓ | ✓ |
| 4 | Telethon Scraper & Fallback Resilience | ORIGINAL_REQUEST §R3 | 5 cases | 5 cases | ✓ | ✓ |
| 5 | Web Dashboard UI Flow & Tokens | ORIGINAL_REQUEST §R1 | 5 cases | 5 cases | ✓ | ✓ |
| 6 | Android SMS Dispatch & Keystore Safety | ORIGINAL_REQUEST §R2 | 5 cases | 5 cases | ✓ | ✓ |

## Test Architecture
- **Backend Test Runner**: Node.js native test runner via `npm --prefix services/api-gateway test` executing:
  - `services/api-gateway/test/auth_search.test.js` (Tier 1-4 functional tests)
  - `services/api-gateway/test/challenger_backend.test.js` (Adversarial challenge test suite)
- **Frontend Test Runner**: Jest / React Testing Library via `npm --prefix apps/web-dashboard test -- --watchAll=false` executing:
  - `apps/web-dashboard/src/App.test.js` (Component & interaction test suite)
  - `apps/web-dashboard/src/AdversarialFrontend.test.js` (Adversarial frontend tests)
- **Android Build & Compile Verification**: Gradle wrapper via `cd apps/android-gateway && ./gradlew assembleDebug` (or `gradlew.bat assembleDebug`).
- **Security & Secret Integrity**: Git ignore checks against sensitive file patterns (`.env`, `*.session`, `*.db`, `*.keystore`, `*.jks`).

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Expected Behavior |
|---|----------|--------------------|-------------------|
| 1 | Legitimate User End-to-End Search | F1, F2, F4, F5 | User requests OTP for valid email -> verifies 6-digit OTP -> obtains JWT session -> executes `/api/search` -> receives breach timeline and exposure score. |
| 2 | Direct Unauthenticated Search Exploit Attempt | F2 | Attacker executes `POST /api/search` with forged / missing Bearer token -> API gateway immediately rejects with HTTP 403 Forbidden. |
| 3 | SMS Gateway Device Offline / Disconnect Handover | F1, F3, F6 | User requests SMS OTP while Android gateway device drops connection -> Node.js queues pending SMS job without crash -> Device reconnects with backoff / polls `/api/gateway/pending/:deviceId` -> SMS dispatched. |
| 4 | Telegram Network Rate Limit / Disconnect Handover | F4 | Telethon encounters upstream rate limit or disconnect -> Scraper service non-blockingly returns fallback `demo_info` without stalling Express event loop. |
| 5 | Rapid OTP Brute-Force & Spam Flood | F1 | Attacker sends rapid OTP requests or attempts >5 wrong OTP guesses -> System triggers 30s cooldown (HTTP 429) and brute-force lockout (HTTP 429). |

## Acceptance Criteria Thresholds
- `npm --prefix services/api-gateway test`: 0 failures across all test suites.
- `npm --prefix apps/web-dashboard test -- --watchAll=false`: 0 failures across all test suites.
- `cd apps/android-gateway && ./gradlew assembleDebug`: 0 compilation errors.
- `/api/search` without OTP token returns HTTP 403 Forbidden.
- Sensitive credentials (`.env`, `*.session`, `*.db`, `*.keystore`) ignored by `.gitignore`.
- Forensic auditor clean verdict on all code changes.
