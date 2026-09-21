# Project: OSINT BreachShield

## Architecture
OSINT BreachShield is a multi-platform breach intelligence and real-time alert system comprising:
1. **Frontend Web Dashboard (`apps/web-dashboard`)**: React 19 single-page application with step-based authentication (Email/Phone OTP), live typewriter terminal, exposure risk gauge, and incident timeline.
2. **Backend API Gateway (`services/api-gateway`)**: Express 5 REST & WebSocket server managing OTP authentication (bcrypt, 30s rate limiting, 5-attempt brute-force lockout, 1h JWT session tokens), `/api/search` proxying with 403 security enforcement, and `/ws/gateway` real-time SMS dispatch channel.
3. **OSINT Scraper Engine (`services/python-scraper`)**: FastAPI service utilizing Telethon MTProto client with `asyncio.Lock` serialization (8s timeout) and rich fallback intelligence generation (`demo_info`) during disconnects/rate limits.
4. **Android SMS Gateway (`apps/android-gateway`)**: Android Native Kotlin background application maintaining WebSocket connection with exponential backoff, 30s heartbeat ping/pong, fallback polling, and carrier-safe SMS transmission (`SmsManagerWrapper`).

```
[Web Dashboard] --(HTTP/Bearer JWT)--> [API Gateway] --(HTTP/JSON)--> [Python Scraper]
                                              ^
                                    (WebSocket /ws/gateway)
                                              v
                                   [Android SMS Gateway]
```

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | OTP Generation & Rate Limiting | 6-digit OTP generation, bcrypt hashing, 30s cooldown, 5-attempt lockout, multi-channel dispatch (SMTP / Android Gateway) | M1 | ORIGINAL_REQUEST §R1 | VERIFIED |
| 2 | Guarded Search Pipeline | Strict 403 Forbidden enforcement on `/api/search` without verified OTP JWT token | M1 | ORIGINAL_REQUEST §R1, Security Criteria | VERIFIED |
| 3 | Backend Test Harmonization | Harmonize assertion strings in `test/challenger_backend.test.js` with `auth.js` and update `package.json` test script | M1 | ORIGINAL_REQUEST §R4 | VERIFIED |
| 4 | Python Scraper Entrypoint Fix | Relocate `if __name__ == '__main__': uvicorn.run(...)` to file end after `@app.post('/download')` | M2 | Survey finding | VERIFIED |
| 5 | Telethon Resilience & Fallback | Handle Telegram rate limits, disconnects, and paywalls with non-blocking fallback `demo_info` | M2 | ORIGINAL_REQUEST §R3 | VERIFIED |
| 6 | Android WebSocket Reconnect Backoff | Implement exponential backoff with jitter for `/ws/gateway` reconnection in `WebSocketManager.kt` | M3 | ORIGINAL_REQUEST §R2 | VERIFIED |
| 7 | Android Carrier-Safe SMS Dispatch | Verify `SmsManagerWrapper` multi-part division, error catching, and transient partial wake-lock | M3 | ORIGINAL_REQUEST §R2 | VERIFIED |
| 8 | Keystore & Credential Hygiene | Update `.gitignore` with `*.jks`, `*.keystore`, `*.key`, `*.pepk`, `*.p12` alongside existing `.env`, `*.session`, `*.db` | M3 | ORIGINAL_REQUEST §R2, Security Criteria | VERIFIED |
| 9 | Web Dashboard Test & Build Health | Verify 100% clean passes for `npm test -- --watchAll=false` and `npm run build` with zero failures | M4 | ORIGINAL_REQUEST §R1, R4 | VERIFIED |
| 10 | Multi-Platform E2E Verification | Execute complete end-to-end test suite (api-gateway tests, web-dashboard tests, android assembleDebug, security checks) | M5 | ORIGINAL_REQUEST §R1-R4, Acceptance Criteria | VERIFIED |
| 11 | Adversarial Hardening & Audit | Conduct adversarial challenge testing and forensic integrity audit across all monorepo modules | M5 | Orchestration Requirements | VERIFIED |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | API Gateway Security & Test Harmonization | Harmonize `test/challenger_backend.test.js`, enforce 403 on `/api/search`, update `package.json` test script | none | DONE |
| M2 | Python Scraper Resilience & Entrypoint Integrity | Fix `osint_service.py` entrypoint position, verify non-blocking fallback data generation | none | DONE |
| M3 | Android Gateway Hardening & Keystore Hygiene | Implement exponential backoff in `WebSocketManager.kt`, add keystore rules to `.gitignore`, verify Gradle build | none | DONE |
| M4 | Frontend Web Dashboard Hardening & Tests | Run & verify component/adversarial test suites and production build in `apps/web-dashboard` | none | DONE |
| M5 | Dual-Track E2E Integration & Adversarial Verification | Full multi-tier test execution, adversarial stress testing, and forensic integrity audit | M1, M2, M3, M4 | DONE |

## Interface Contracts
### Web Dashboard ↔ API Gateway
- **Send OTP**: `POST /api/auth/send-otp` -> Request: `{ "email": string }` or `{ "phone": string }` -> Response: `{ "success": true, "message": string }` (HTTP 200) | `{ "error": string }` (HTTP 400/429)
- **Verify OTP**: `POST /api/auth/verify-otp` -> Request: `{ "target": string, "otp": string }` -> Response: `{ "success": true, "token": string, "message": string }` (HTTP 200) + sets `otp_token` cookie | `{ "error": string }` (HTTP 400/401/429)
- **Search**: `POST /api/search` -> Headers: `Authorization: Bearer <token>` or Cookie: `otp_token` -> Request: `{ "target": string, "query_type": "email"|"phone"|"username" }` -> Response: `{ "success": true, "data": { "total_breaches": number, "exposure_score": number, "breaches": [...] } }` (HTTP 200) | `{ "error": "Verification required" }` (HTTP 403)

### API Gateway ↔ Python Scraper
- **Query Scraper**: `POST http://127.0.0.1:8001/query` -> Request: `{ "query": string, "search_type": string }` -> Response: `{ "status": "success", "query": string, "results": [...] }` (HTTP 200)

### API Gateway ↔ Android SMS Gateway
- **WebSocket Upgrade**: `/ws/gateway`
- **Handshake Auth**: Android sends `{ "type": "AUTH", "deviceId": string, "token": string }` -> Server responds `{ "type": "AUTH_SUCCESS" }`
- **Heartbeat**: Android sends `"ping"` -> Server responds `"pong"` (every 30s)
- **SMS Dispatch**: Server sends `{ "action": "send_sms", "type": "SEND_SMS", "requestId": string, "phone": string, "phoneNumber": string, "message": string }`
- **Status Acknowledgment**: Android sends WebSocket `{ "type": "SMS_STATUS", "requestId": string, "status": "DELIVERED"|"FAILED", "error": string? }` and HTTP `POST /api/gateway/status`
- **Offline Polling Fallback**: `GET /api/gateway/pending/:deviceId`

## Code Layout
- `apps/web-dashboard/`: React 19 Frontend Web Application
  - `src/App.js`: Main state machine (Input -> OTP -> Results)
  - `src/AppRouter.jsx`: Browser router configuration
  - `src/lib/api.js`: Axios client with Bearer auth interceptor
  - `src/App.test.js` & `src/AdversarialFrontend.test.js`: Frontend unit & adversarial tests
- `services/api-gateway/`: Node.js Express API & WebSocket Server
  - `index.js`: Main server entrypoint, middleware, `/api/search` route
  - `auth/routes/auth.js`: OTP generation, verification, JWT issuing, `verifyOtpToken` middleware
  - `gateway/gatewayWs.js`: WebSocket server handling `/ws/gateway` connections
  - `controllers/gatewayController.js`: Device management, pending SMS queues, status updates
  - `test/auth_search.test.js`: Core unit & integration tests
  - `test/challenger_backend.test.js`: Adversarial challenge test suite
- `services/python-scraper/`: Python FastAPI & Telethon Scraper
  - `osint_service.py`: Telegram scraper service with MTProto locking and fallback generation
- `apps/android-gateway/`: Android Native Kotlin SMS Gateway Application
  - `app/src/main/java/com/osint/breachshield/gateway/data/ws/WebSocketManager.kt`: WebSocket client with backoff and heartbeats
  - `app/src/main/java/com/osint/breachshield/gateway/sms/SmsManagerWrapper.kt`: Telephony SMS dispatcher
  - `app/src/main/java/com/osint/breachshield/gateway/service/GatewayForegroundService.kt`: Persistent background foreground service
