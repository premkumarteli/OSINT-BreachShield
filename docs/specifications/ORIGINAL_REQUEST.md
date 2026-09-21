# Original User Request

## Initial Request — 2026-08-17T18:59:33+05:30

Comprehensive end-to-end debugging, adversarial test auditing, and full-stack hardening across the entire OSINT BreachShield multi-platform monorepo (React Frontend, Node.js API & WebSocket Gateway, Python Scraper Service, and Android Kotlin SMS Gateway).

Working directory: c:\Users\prem\OSINT-breach-Finder-main
Integrity mode: development

## Requirements

### R1. Full-Stack End-to-End Test & Build Verification
- Verify all services (`apps/web-dashboard`, `services/api-gateway`, `services/python-scraper`, and `apps/android-gateway`) compile, build, and start cleanly with 0 errors.
- Validate the OTP-gated search pipeline: `POST /api/auth/send-otp` (Email & Phone) -> 6-digit OTP verification -> `POST /api/search` intelligence lookup.

### R2. Android Gateway & WebSocket Protocol Hardening
- Audit and test WebSocket communication between `services/api-gateway` (`/ws/gateway`) and `apps/android-gateway` (`WebSocketManager.kt`).
- Ensure auto-reconnect backoff, heartbeat ping/pong, and carrier-safe SMS dispatch work reliably without runtime exceptions.

### R3. Python OSINT Telethon Scraper Resilience
- Verify error handling when Telegram sessions or upstream search hubs encounter rate limits or network dropouts.
- Ensure fallback intelligence data is returned gracefully to the Node.js API gateway without blocking the event loop.

### R4. Automated Test Suite Expansion & Validation
- Execute and expand backend integration tests (`services/api-gateway/test`) and frontend component tests (`apps/web-dashboard/src`).
- Ensure `npm test` passes 100% cleanly across all modules.

## Acceptance Criteria

### Build & Unit Health
- [ ] `npm --prefix services/api-gateway test` executes and passes with 0 test failures.
- [ ] `npm --prefix apps/web-dashboard test -- --watchAll=false` passes with 0 test failures.
- [ ] `cd apps/android-gateway && gradlew assembleDebug` compiles with 0 errors.

### Security & Protocol Verification
- [ ] Direct `/api/search` requests without a verified OTP session return HTTP `403 Forbidden`.
- [ ] WebSocket gateway gracefully handles device disconnections and queues pending SMS jobs without crashing the Node.js event loop.
- [ ] All sensitive credentials (`.env`, `.session`, `*.db`) remain ignored by `.gitignore`.
