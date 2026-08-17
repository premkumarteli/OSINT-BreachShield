# Project: OSINT BreachShield OTP-First Refactoring

## Architecture
OSINT BreachShield is refactored into a strict OTP-first breach lookup platform (HaveIBeenPwned-style) where search access is strictly gated by email OTP verification. All legacy user account, registration, login, and dashboard workflows are completely purged.

```
[ Frontend (React SPA) ]
  ├── Page 1: "/" (SearchPage.jsx) ─────────────► POST /api/auth/send-otp { email }
  ├── Page 2: "/verify-otp" (VerifyOtpPage.jsx) ─► POST /api/auth/verify-otp { email, otp }
  │                                                └─ Receives JWT token & HTTP-only cookie
  └── Page 3: "/results" (ResultsPage.jsx) ──────► POST /api/search { query: email } (Gated)
                                                   └─ Auto-fetches Exposure Score, Timeline, Terminal

[ Backend (Express Server :5000) ]
  ├── /api/auth/send-otp: Generates 6-digit OTP, hashes with bcrypt, stores with 5m expiry
  ├── /api/auth/verify-otp: Validates 6-digit code (<5 attempts), marks verified, signs JWT token
  └── /api/search: Guarded by OTP middleware — returns 403 Forbidden ("Email verification required") if unverified
```

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---|---|---|---|:---:|
| 1 | Pure Email OTP Generation | `POST /api/auth/send-otp` accepts `{ email }` without username/account prerequisites, enforces 30s cooldown | M1 | ORIGINAL_REQUEST §R2 | DONE |
| 2 | 6-Digit OTP Verification & JWT Issuance | `POST /api/auth/verify-otp` validates code (<5 attempts, 5m expiry), sets cookie and returns JWT session token | M1 | ORIGINAL_REQUEST §R2 | DONE |
| 3 | Strict `/api/search` 403 Guarding | Guard `/api/search` to reject unverified requests with HTTP 403 `{ "error": "Email verification required" }` | M1 | ORIGINAL_REQUEST §R2 | DONE |
| 4 | Backend Legacy Auth & Route Purge | Remove `POST /register`, `/set-password`, `/login`, `GET /me`, `POST /logout`, and legacy `users` table | M2 | ORIGINAL_REQUEST §R3 | DONE |
| 5 | Frontend Legacy Components & Routes Purge | Delete `Login.jsx`, `AuthForm.jsx`, `AuthLayout.jsx`, `UserMenu.jsx` and purge `/login`, `/signup`, `/register`, `/dashboard` routes | M3 | ORIGINAL_REQUEST §R3 | DONE |
| 6 | Page 1: Search & OTP Dispatch (`/`) | Hero UI, email format validation, "Generate OTP" button calling `send-otp`, redirect to `/verify-otp` | M4 | ORIGINAL_REQUEST §R1 | DONE |
| 7 | Page 2: 6-Digit OTP Verification (`/verify-otp`) | Display email, 6-digit numeric input, countdown timer (300s), resend button (30s cooldown), redirect to `/results` | M4 | ORIGINAL_REQUEST §R1 | DONE |
| 8 | Page 3: Results, Score Meter & Timeline (`/results`) | Auto-mount `POST /api/search`, render Exposure Score meter (0-100), BreachTimeline, Terminal raw view, download report, redirect unverified | M4 | ORIGINAL_REQUEST §R1 | DONE |
| 9 | Opaque-Box E2E Testing Suite (Tiers 1-4) | Automated tests covering 3-page flow, security 403 guards, rate-limiting, error handling, and route purge | E2E | ORIGINAL_REQUEST §Acceptance Criteria | DONE |
| 10 | Tier 5 Adversarial Coverage Hardening | Edge cases, malformed tokens, rapid requests, state persistence on refresh | M5 | Project Pattern | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|:---:|
| M1 | Backend OTP Auth & Search Gating | Refactor `send-otp`, `verify-otp`, and guard `/api/search` with 403 middleware | None | DONE |
| M2 | Backend Legacy Route Purge | Remove legacy account endpoints (`/login`, `/register`, etc.) and clean `schema.sql` | M1 | DONE |
| M3 | Frontend Legacy Component Purge | Delete unused legacy auth components and update router/CSS | None | DONE |
| M4 | Frontend 3-Page Flow Implementation | Build `SearchPage.jsx`, `VerifyOtpPage.jsx`, `ResultsPage.jsx`, update `AppRouter.jsx` | M3 | DONE |
| M5 | E2E Integration, 100% Test Pass & Tier 5 Hardening | Execute full test suite, fix regressions, harden edge cases | M1, M2, M4, E2E | DONE |

## Interface Contracts
### Client ↔ `POST /api/auth/send-otp`
- Request: `{ "email": "user@example.com" }`
- Response 200: `{ "success": true, "message": "OTP sent successfully", "expiresInMinutes": 5 }`
- Response 400: `{ "success": false, "error": "Valid email address is required" }`
- Response 429: `{ "success": false, "error": "Please wait X seconds before requesting a new OTP." }`

### Client ↔ `POST /api/auth/verify-otp`
- Request: `{ "email": "user@example.com", "otp": "123456" }`
- Response 200: `{ "success": true, "token": "<JWT_TOKEN>", "email": "user@example.com", "message": "Email verified successfully" }` + sets HTTP-only `otp_token` cookie
- Response 400: `{ "success": false, "error": "Invalid or expired OTP", "attemptsRemaining": 4 }`
- Response 429: `{ "success": false, "error": "Maximum verification attempts exceeded. Please request a new OTP." }`

### Client ↔ `POST /api/search`
- Request Headers: `Authorization: Bearer <JWT_TOKEN>` OR cookie `otp_token`
- Request Body: `{ "query": "user@example.com", "searchType": "Email" }`
- Response 403 (Unverified / Missing): `{ "error": "Email verification required" }`
- Response 200 (Verified): `{ "success": true, "data": { "packets": [...], "pagination": {...}, "analytics": { "exposure": {...}, "timeline": [...] } } }`

## Code Layout
- `osint-backend/index.js` — Main server entry, middleware, guarded `/api/search` and utility routes.
- `osint-backend/auth/routes/auth.js` — Pure OTP endpoints (`send-otp`, `verify-otp`, `verifyOtpToken` middleware).
- `osint-backend/test/` — Backend automated integration & adversarial tests (`auth_search.test.js`, `challenger_backend.test.js`).
- `osint-frontend/src/AppRouter.jsx` — 3-route SPA router (`/`, `/verify-otp`, `/results`, `*` -> `/`).
- `osint-frontend/src/pages/SearchPage.jsx` — Page 1: Email query input and OTP dispatch.
- `osint-frontend/src/pages/VerifyOtpPage.jsx` — Page 2: 6-digit OTP entry, timer, resend cooldown.
- `osint-frontend/src/pages/ResultsPage.jsx` — Page 3: Auto-search mount, Exposure meter, BreachTimeline, report download.
- `osint-frontend/src/components/BreachTimeline.jsx` — Reusable chronological breach visualizer.
- `osint-frontend/src/App.test.js`, `osint-frontend/src/AdversarialFrontend.test.js` — Frontend integration & adversarial test suites.
