# E2E Test Infra: OSINT BreachShield

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation internals.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise + Real-World Workload Testing.

## Feature Inventory & Test Coverage
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|:---:|:---:|:---:|
| 1 | Email OTP Generation (`send-otp`) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 2 | 6-Digit Verification & JWT (`verify-otp`) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 3 | Strict `/api/search` 403 Guarding | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 4 | Backend Legacy Auth Purge | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 5 | Frontend Legacy Route Purge | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 6 | Page 1: Search & OTP Dispatch (`/`) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 7 | Page 2: OTP Verification UI (`/verify-otp`) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 8 | Page 3: Auto-Search Results UI (`/results`) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |

## Test Architecture
- **Backend Test Runner**: `node --test` executing `osint-backend/test/auth_search.test.js`
  - Zero dependencies, uses native `node:test` and `node:assert`.
  - Spins up test Express instance, verifies HTTP status codes (200, 400, 403, 429), token validity, cookie parsing, cooldowns, and lockout thresholds.
- **Frontend Test Runner**: `npm test -- --watchAll=false` executing React component and router integration tests.
- **Integration Test Runner**: `npm test` at workspace root verifying both frontend and backend suites.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|---|---|---|
| 1 | Clean Email (No Breaches Found) | Page 1 -> Page 2 -> Page 3 -> 0 breaches -> Exposure 0 (Green) | Medium |
| 2 | High-Risk Leaked Email | Page 1 -> Page 2 -> Page 3 -> Exposure >= 75 (Red) + Timeline entries | High |
| 3 | OTP Expiry & Resend Flow | Page 1 -> Page 2 -> Expiry -> Resend OTP -> Success -> Page 3 | High |
| 4 | Direct Unverified Intrusion Attempt | Direct curl/Postman to `/api/search` -> 403 Forbidden | Medium |
| 5 | Downstream Service Outage Resiliency | Page 3 handles Python scraper downtime gracefully with clean UI banner | Medium |

## Coverage Thresholds
- Tier 1: Feature Coverage (>=5 per feature)
- Tier 2: Boundary & Corner Cases (>=5 per feature)
- Tier 3: Cross-Feature Combinations
- Tier 4: Real-World Scenarios
