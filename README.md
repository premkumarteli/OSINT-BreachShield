# 🛡️ OSINT BreachShield

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![Android](https://img.shields.io/badge/Android-Kotlin%20%7C%20Compose-3DDC84?logo=android&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-OkHttp%20%7C%20ws-010101?logo=socketdotio&logoColor=white)

**Next-Generation OSINT Intelligence & Breach Detection Platform**  
*Gated OTP-First Verification • Android Physical SIM Relay • Real-Time Dark Web Scraper*

</div>

---

## 🏛️ System Architecture

```text
                               ┌────────────────────────────────┐
                               │   User Browser (React 18)      │
                               │   http://localhost:3000        │
                               └───────────────┬────────────────┘
                                               │
                                      HTTP / REST (JSON)
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │   Core API Gateway (Node.js)   │
                               │   http://localhost:5000        │
                               └──────┬──────────────────┬──────┘
                                      │                  │
               WebSocket (/ws/gateway)│                  │HTTP (Port 8001)
                                      ▼                  ▼
     ┌──────────────────────────────────┐      ┌──────────────────────────────┐
     │ 📱 Android SMS Gateway App       │      │ 🐍 Python OSINT Scraper      │
     │ Native Kotlin / Jetpack Compose  │      │ FastAPI + Telethon Engine    │
     │ Relays OTP SMS via Physical SIM  │      │ Queries Deep & Dark Web Hubs │
     └──────────────────────────────────┘      └──────────────────────────────┘
```

---

## 📂 Repository Structure

```text
OSINT-BreachShield/
│
├── frontend/                      # React 18 Web UI (Search, OTP Auth, Threat Level Gauge)
├── backend/                       # Node.js Express Server, WebSocket Gateway & Breach Analytics
├── scraper/                       # Python FastAPI Scraper & Telethon Threat Feed Engine
├── android-gateway/               # Native Android Kotlin App (SMS OTP Hardware Relay)
│
├── data/                          # Breach catalogs, partition stores & session records
├── docs/                          # Architecture diagrams, testing guides & presentations
├── scripts/                       # Deployment, automation & maintenance scripts
│
├── run_servers.py                 # 🚀 Unified 1-command development launcher
├── package.json                   # Root monorepo task runner
└── README.md                      # Project documentation
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0+
- **Python**: 3.10+
- **Android Studio** (Optional, for building the Android Gateway app)

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Launch All Services (1 Command)
```bash
python run_servers.py
```

This single command starts:
- 🐍 **Python FastAPI OSINT Service** $\rightarrow$ `http://localhost:8001`
- 🟢 **Node.js Express Backend & WebSocket** $\rightarrow$ `http://localhost:5000`
- ⚛️ **React Frontend Dashboard** $\rightarrow$ `http://localhost:3000`

---

## 📱 Android SMS Gateway Setup

The **BreachShield Gateway** Android app turns any physical Android phone into a secure, hardware-isolated SMS OTP relay:

1. Open `android-gateway` in **Android Studio**.
2. Connect your Android phone via USB or Wireless ADB.
3. Build and install (`gradlew assembleDebug`).
4. On first launch:
   - Enter your Server URL (e.g. `http://192.168.1.100:5000` or local network IP).
   - Enter your Gateway Name & Registration Token.
   - Tap **Register Gateway**.
5. The device connects via WebSocket (`ws://<IP>:5000/ws/gateway`) and enters **`🟢 ONLINE`** mode with a 24/7 background foreground service.

---

## 🔐 Security & OTP-First Architecture

* **Strict Gating**: No direct database access or breach intelligence searches can be triggered without verifying an active 6-digit OTP session.
* **Dual Dispatch Channels**:
  * **Email Targets**: Dispatched securely over TLS via Gmail SMTP.
  * **Phone Targets**: Dispatched in real-time over WebSocket to the registered Android SIM Gateway.
* **Brute-Force & Rate-Limit Shield**:
  * 60-second cooldown between OTP requests.
  * 5-minute cryptographic expiration with `bcrypt` hash verification.
  * 5-attempt limit per verification window.

---

## 📄 License
Distributed under the **MIT License**.
