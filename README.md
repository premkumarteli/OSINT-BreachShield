# OSINT BreachShield

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-2.14-FFDB1C?logo=hardhat&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)

**AI-Powered OSINT Breach Detection & Blockchain Audit Platform**
*Email OTP Auth | k-Anonymity Privacy | HIBP Breach Search | ML Phishing Detection | Merkle-Chain Audit Trail*

</div>

---

## Architecture

```text
React Frontend (Port 3000)
    |
    | HTTP REST + JWT Bearer Tokens
    v
Node.js/Express Backend (Port 5000)
    |-- authGuard (OTP + JWT + RBAC)
    |-- searchService (HIBP API + Risk Engine)
    |-- auditLogger (Canonical JSON + SHA-256)
    |-- merkleBatcher (Merkle Tree + Queue)
    |-- anchorClient (Hardhat + AnchorRegistry.sol)
    |
    | HTTP POST /api/ai/*
    v
Python FastAPI (Port 8001)
    |-- Phishing Classifier (HuggingFace)
    |-- Entity Correlator (SentenceTransformer)
    |-- Telegram Monitor (Telethon)
```

---

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| Email OTP Auth | Working | 6-digit OTP with 5min expiry, bcrypt hashing, rate limiting |
| JWT + RBAC | Working | User/admin roles, httpOnly cookies, 24h token expiry |
| k-Anonymity Search | Working | Client-side SHA-256 hashing, 5-char prefix range queries |
| HIBP Breach Search | Working | Have I Been Pwned API integration with retry logic |
| Risk Scoring | Working | Multi-factor explainable risk engine (0-100) |
| Phishing Detection | Working | HuggingFace transformer, 89% accuracy |
| Entity Correlation | Working | SentenceTransformer cosine similarity |
| Blockchain Audit | Working | Local Hardhat, Merkle tree, AnchorRegistry.sol |
| Merkle Batching | Working | Queue with dead letter, retry, auto-recovery |
| Telegram Monitor | Working | Real-time channel monitoring via Telethon |
| Dark Web Monitor | Working | Watchlist + SSE alert stream |

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/premkumarteli/OSINT-BreachShield.git
cd OSINT-breach-Finder-main

# 2. Install dependencies
cd backend && npm install
cd ../scraper && pip install -r requirements.txt
cd ../frontend && npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values (JWT_SECRET, EMAIL_USER, etc.)

# 4. Start everything
python run_servers.py
```

Services start at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Python: http://localhost:8001
- Hardhat: http://127.0.0.1:8545

---

## Project Structure

```
OSINT-breach-Finder-main/
|-- frontend/          # React 18 SPA
|   |-- src/
|       |-- App.js            # Main app with 3-page flow
|       |-- pages/            # SearchPage, VerifyOtpPage, ResultsPage
|       |-- components/       # AIIntelligenceCards, BreachTimeline, DarkWebTicker
|       |-- lib/
|           |-- api.js        # Axios client with JWT interceptor
|           |-- kAnonymity.js # Client-side SHA-256 + range queries
|
|-- backend/           # Node.js/Express
|   |-- server.js             # Main entry, auto-deploys contract on startup
|   |-- auth/
|   |   |-- routes/auth.js    # OTP, JWT, /me, /set-password routes
|   |   |-- db.js             # MySQL pool helper
|   |-- api/
|   |   |-- search.js         # Breach search proxy
|   |   |-- ai.js             # Threat analysis + audit routes
|   |   |-- ingest.js         # k-Anonymity range + catalog lookup
|   |   |-- report.js         # HTML report download
|   |   |-- darkweb.js        # Watchlist + SSE stream
|   |   |-- admin.js          # Admin control panel
|   |-- blockchain/
|   |   |-- contracts/AnchorRegistry.sol  # Solidity 0.8.20
|   |   |-- scripts/deploy.js            # Contract deployment
|   |   |-- ensureContract.js            # Auto-deploy on startup
|   |   |-- anchorClient.js              # Ethers.js v6 client
|   |   |-- merkleBatcher.js             # Queue + Merkle tree
|   |   |-- auditLogger.js               # Event hashing + enqueue
|   |   |-- verificationService.js       # On-chain verification
|   |   |-- auditHasher.js               # Canonical JSON + SHA-256
|   |-- middleware/authGuard.js          # verifyOtpToken + requireAdminToken
|   |-- analytics/riskEngine.js          # Explainable risk scoring
|
|-- scraper/           # Python FastAPI
|   |-- osint_service.py       # FastAPI app
|   |-- ai/
|       |-- phishing_classifier.py   # HuggingFace model
|       |-- entity_correlator.py     # SentenceTransformer
|       |-- threat_analyzer.py       # Orchestrator
|
|-- data/
|   |-- catalog/       # Breach catalog (JSON)
|   |-- processed/     # ML model artifacts
|
|-- instance/          # Runtime data (gitignored)
|   |-- merkle_queue.json
|   |-- merkle_history.json
|   |-- email_otps.json
```

---

## How It Works

### Search Flow
```
1. User enters email
2. Client hashes email with SHA-256 (never sent raw)
3. First 5 chars sent to /api/v1/range/:prefix (k-anonymity)
4. Full hash matched client-side for privacy
5. HIBP API queried for breach data
6. Risk score calculated (multi-factor)
7. Audit event logged with canonical JSON hash
8. Hash added to Merkle tree
9. Merkle root anchored to blockchain
```

### Blockchain Flow
```
Audit Event -> Canonical JSON -> SHA-256 Hash -> Merkle Tree
    -> Merkle Root -> AnchorRegistry.sol -> Hardhat Chain
```

---

## ML Models

| Model | Accuracy | Status | Notes |
|-------|----------|--------|-------|
| Phishing Classifier | 89% | Deployed | HuggingFace transformers |
| XGBoost Severity | 89.2% | Trained | Not deployed (feature gap) |
| CNN (Char-level) | 66.2% | Trained | Below production threshold |
| BiLSTM (RNN) | 44.6% | Trained | Below baseline (47.1%) |
| Transformer | 48.4% | Trained | Below baseline |

---

## Tests

```bash
# Backend (94 tests)
cd backend && npx jest

# Merkle/Blockchain (17 tests)
cd backend && npx jest blockchain/tests/merkle.test.js

# Frontend (26 tests)
cd frontend && npx react-scripts test --watchAll=false
```

---

## Security Notes

- JWT_SECRET: 128-char crypto-random hex
- Passwords: bcrypt with salt rounds 10
- OTP: 6-digit, 5-minute expiry, max 5 attempts
- k-Anonymity: Raw email never leaves browser
- Audit trail: SHA-256 + Merkle tree + blockchain anchoring

---

## Team

| Name | USN | Role |
|------|-----|------|
| Arvind D H | 1AY24IS400 | Backend & Blockchain |
| Girishkumar N M | 1AY24IS404 | ML & Python Services |
| Manoj | 1AY24IS406 | Android Gateway |
| Premkumar Teli | 1AY24IS407 | Frontend & Integration |

**Guide:** Prof. Sushma T.M, Dept. of ISE, Acharya Institute of Technology

---

## License

MIT
