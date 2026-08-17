# Original User Request

## Initial Request — 2026-08-17T00:26:50+05:30

Build a production-ready Android SMS Gateway application in Google Android Studio and integrate it with the BreachShield backend to relay OTP SMS messages via a physical Android device SIM card.

Working directory: C:\Users\prem\AndroidStudioProjects\Osint
Backend directory: C:\Users\prem\OSINT-breach-Finder-main\osint-backend
Integrity mode: development

## Requirements

### R1. Device Registration & Persistent Identity
- On first launch, generate and persist a UUID v4 Device ID (`BS-DEVICE-<uuid>`) in `EncryptedSharedPreferences`.
- Never regenerate the Device ID across restarts, app updates, or reboots.
- Provide a registration screen capturing `Server URL`, `Gateway Name`, and `Registration Token`.
- Submit registration to `POST /api/gateway/register` and securely store the returned JWT `gatewayToken` in `EncryptedSharedPreferences`.

### R2. Real-Time WebSocket Communication & Auto-Reconnect
- Connect to `ws://<SERVER>/api/gateway/ws` using OkHttp WebSocket with `Authorization: Bearer <gatewayToken>`.
- Implement automatic reconnection with exponential backoff: `1s`, `2s`, `5s`, `10s`, `30s`.
- Maintain a 30-second heartbeat ping containing `{ "type": "HEARTBEAT", "deviceId": "...", "battery": X, "signalStrength": Y, "simState": "READY" }`.

### R3. SMS Dispatch & Delivery Status Protocol
- Parse inbound `{ "type": "SEND_SMS", "requestId": "...", "phone": "...", "message": "..." }` commands and dispatch via `SmsManager` (supporting multi-part SMS).
- Capture transmission status using broadcast receivers and report back:
  - `{ "type": "SMS_SENT", "requestId": "..." }`
  - `{ "type": "SMS_DELIVERED", "requestId": "..." }`
  - `{ "type": "SMS_FAILED", "requestId": "...", "reason": "..." }`

### R4. 24/7 Foreground Service & Local Storage
- Run `GatewayForegroundService` with persistent notification showing connection state and pending queue count.
- Implement `RECEIVE_BOOT_COMPLETED` receiver to restart the service on device boot.
- Store `SmsLog` (id, requestId, phone, message, status, timestamp) and `ConnectionLog` in Room Database.
- Build a Jetpack Compose Dashboard showing live metrics (Connection, Battery %, Signal, Sent/Failed/Queue counts) and the last 100 SMS logs.

### R5. BreachShield Backend WebSocket Gateway Relay
- Implement `POST /api/gateway/register` in `osint-backend` to authenticate device registration and issue JWT `gatewayToken`.
- Implement `ws://localhost:5000/api/gateway/ws` in `osint-backend` to handle real-time communication with the Android device, manage device status, and route OTP SMS requests with automatic fallback to Gmail SMTP if the device is offline.

---

## Acceptance Criteria

### Android Application
- [ ] `gradlew assembleDebug` compiles with 0 errors.
- [ ] Device ID persists in `EncryptedSharedPreferences` and is never overwritten.
- [ ] Registration screen successfully posts to backend and saves `gatewayToken`.
- [ ] WebSocket client automatically reconnects on network drop with exponential backoff.
- [ ] Inbound `SEND_SMS` triggers `SmsManager` and returns `SMS_SENT` / `SMS_DELIVERED` status over WebSocket.
- [ ] `GatewayForegroundService` runs continuously with ongoing notification and 30-second heartbeat.
- [ ] Dashboard displays live telemetry and Room database SMS logs.

### Backend Integration
- [ ] `POST /api/gateway/register` issues valid JWT token for registered device ID.
- [ ] WebSocket server `/api/gateway/ws` accepts authenticated gateway connections.
- [ ] `POST /api/auth/send-otp` dispatches SMS command to connected Android device when phone number is targeted.
