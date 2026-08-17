# TEST_READY: OSINT BreachShield Automated Test Suite

## Executive Summary
The automated test suite for OSINT BreachShield has been authored, verified, and integrated across all four tiers (Tiers 1–4). The suite uses Node.js native `node:test` and `node:assert/strict` with zero external test runners for backend integration testing, and Jest with React Testing Library and CommonJS axios mocking for frontend testing.

---

## Test Inventory & Coverage Breakdown

### Tier 1: Core Flow & Baseline Security
| Test ID | Test Description | Target Endpoint / Module | Status |
|---|---|---|:---:|
| `T1.1` | OTP Generation: `POST /api/auth/send-otp` returns 200 and dispatches 6-digit code | `POST /api/auth/send-otp` | PASS |
| `T1.2` | OTP Verification & Token Issuance: `POST /api/auth/verify-otp` validates code and signs JWT token | `POST /api/auth/verify-otp` | PASS |
| `T1.3` | Verified Search Access: `POST /api/search` with verified `Bearer` token returns 200 and analytics | `POST /api/search` | PASS |
| `T1.4` | Unverified Search 403 Guard: Direct `POST /api/search` without verification token returns 403 Forbidden | `POST /api/search` | PASS |
| `T1.5` | Legacy Route Purge: All legacy endpoints (`/register`, `/login`, `/me`, `/api/auth/register`, etc.) return 404 | Express Router | PASS |

### Tier 2: Boundaries, Validations & Rate Limiting
| Test ID | Test Description | Target Endpoint / Module | Status |
|---|---|---|:---:|
| `T2.1` | Invalid & Tampered Tokens: `POST /api/search` with forged or `verified=false` token returns 403 | `verifyOtpToken` middleware | PASS |
| `T2.2` | Malformed Email Validation: Non-email inputs to `send-otp` and `verify-otp` return 400 Bad Request | `POST /api/auth/send-otp`, `/verify-otp` | PASS |
| `T2.3` | Invalid OTP Length / Format: Non-6-digit codes to `verify-otp` return 400 Bad Request | `POST /api/auth/verify-otp` | PASS |
| `T2.4` | Verification Attempt Counter: Incorrect OTP decrements remaining attempts and returns count | `POST /api/auth/verify-otp` | PASS |
| `T2.5` | 5-Attempt Lockout: 5 consecutive failed verification attempts lock out and return 429 | `POST /api/auth/verify-otp` | PASS |
| `T2.6` | Expired / Non-Existent OTP: Verification of non-existent or expired code returns 400 | `POST /api/auth/verify-otp` | PASS |
| `T2.7` | 30-Second Resend Cooldown: Rapid consecutive `send-otp` calls return 429 Too Many Requests | `POST /api/auth/send-otp` | PASS |

### Tier 3: State Invalidation, Token Binding & Download
| Test ID | Test Description | Target Endpoint / Module | Status |
|---|---|---|:---:|
| `T3.1` | State Invalidation: Requesting a new OTP supersedes and invalidates previously active OTP | `POST /api/auth/send-otp` | PASS |
| `T3.2` | Cookie-Based Auth: `POST /api/search` accepts verification token via `otp_token` cookie | `POST /api/search` | PASS |
| `T3.3` | Standalone HTML Report Generation: `POST /api/download` returns formatted HTML attachment | `POST /api/download` | PASS |

### Tier 4: Real-World Scenarios & Risk Analytics Engine
| Test ID | Test Description | Target Endpoint / Module | Status |
|---|---|---|:---:|
| `T4.1` | Clean Email Risk Scoring: 0 leaks / empty text computes Score 0, Risk Level `LOW`, Color `#00ff66` | `analytics/riskEngine.js` | PASS |
| `T4.2` | High-Risk Leaked Email Scoring: Compounded credentials/IDs compute Score >= 75, `CRITICAL`, `#ff003c` | `analytics/riskEngine.js` | PASS |
| `T4.3` | Chronological Timeline Parsing: Multi-year breach sources are parsed into ascending chronological order | `analytics/timelineParser.js` | PASS |
| `T4.4` | Dev Console Fallback: Operates seamlessly in development mode without SMTP credentials | `auth/routes/auth.js` | PASS |

---

## How to Run the Tests

### 1. Run Backend Test Suite (Tiers 1–4)
```powershell
cd osint-backend
npm test
```
*Equivalent command:* `node --test test/auth_search.test.js`

### 2. Run Frontend Test Suite
```powershell
cd osint-frontend
npm test -- --watchAll=false
```

### 3. Run Full Integration Test Suite (Root)
```powershell
npm test
```

---

## Verification Results
- **Backend Tests**: 19 passed, 0 failed, 0 skipped (Duration: ~3.0s)
- **Frontend Tests**: 1 passed, 0 failed (Duration: ~5.7s)
- **ESM / Axios Compatibility**: Configured via `osint-frontend/src/__mocks__/axios.js`.
