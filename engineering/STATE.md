# Engineering State: OSINT-BreachShield

**Last Updated:** November 18, 2026  
**Governing Standard:** MASTER PROMPT v2 (Stage 1 & Stage 2 Execution)  
**Integrity Mode:** Development (Read-Only Codebase Baseline)

---

## 1. Project Summary

**OSINT-BreachShield** is an AI-powered breach detection, identity exposure intelligence, and audit platform designed to solve the central privacy paradox of threat intelligence: users must often surrender plaintext credentials or personal identifiers to third-party services simply to check if they have been compromised.

- **Purpose**: Provides verifiable, zero-knowledge threat lookup capabilities where client targets are hashed locally before transmission, identity ownership is validated via out-of-band one-time passwords (OTP), and breach audit logs are cryptographically notarized to a tamper-proof Merkle blockchain tree.
- **Target Audience**:
  1. *End Users / Credential Owners*: Individuals seeking private, secure verification of whether their personal email or mobile phone has been leaked in public or underground breach databases without exposing their identifier over the wire.
  2. *Security Analysts / SOC Administrators*: Incident response and threat intelligence analysts monitoring active search audits, hardware mobile gateways, dark web disclosure tickers, and managing session blacklists.
  3. *Academic Evaluators*: Academic review committees evaluating privacy-preserving cryptography (k-anonymity), deep learning threat classification, and verifiable distributed systems.
- **Architecture**: A polyglot 5-tier system:
  1. *Web Frontend*: React 19.1.1 SPA on port 3000 (`frontend/`) utilizing Web Crypto API client-side SHA-256 k-anonymity hashing, glassmorphism UI, and Framer Motion.
  2. *API Gateway & Relay*: Node.js Express 5.1.0 on port 5000 (`backend/`), managing authentication, search gating, local prefix stores, session tracking, and Android WebSocket relay (`/ws/gateway`).
  3. *Threat Intelligence & Scraper*: Python 3.13.7 FastAPI service on port 8001 (`scraper/osint_service.py`), executing Telethon MTProto Telegram scraping (`@The_Devil_OSINT_bot`), Hugging Face UrlBERT phishing detection, and deep learning threat classifiers with deterministic fallbacks.
  4. *Blockchain Notary*: Hardhat 2.28.0 local EVM node on port 8545 deploying `AnchorRegistry.sol`, anchoring 32-byte Merkle tree roots to immutable contract state.
  5. *Mobile SMS Gateway*: Native Android Kotlin application (`android-gateway/`) connecting via WebSocket and SMSManager to dispatch cellular OTP SMS.
  6. *Storage Layer*: Dual-engine architecture with MySQL 8.0 active on `127.0.0.1:3306` (`osint_app`) and an automatic fallback to flat JSON files (`instance/*.json`).

---

## 2. Current Stage

- **Stage 1 (Discover)**: **COMPLETED** (Repository assets, manifests, entry points, configuration matrix, and runtime behavior surveyed and empirically verified without assumptions).
- **Stage 2 (Team Conference & Audit)**: **COMPLETED** (Multi-role engineering conference review and comprehensive P0–P3 audit catalog covering SEC-01 through SEC-15 documented).
- **Stage 3 (Plan)**: **PENDING OWNER AUTHORIZATION** (Awaiting formal authorization from the project owner before drafting ADRs, target architecture, or executing code modifications).

---

## 3. Decisions Made (Plain-Language Engineering Rationale)

| Decision Reference | Plain-Language Architectural Decision | Plain-Language Rationale |
| :--- | :--- | :--- |
| **ADR-001 (k-Anonymity)** | Client-side SHA-256 hashing via Web Crypto API with 5-character prefix range queries (`/api/v1/range/:prefix`). | Prevents plaintext email/phone targets from leaving the client browser. Only the 5-character hex prefix ($20$ bits of entropy) is sent to the backend, preserving user privacy against network sniffing and server access logs. |
| **ADR-002 (Identity Gating)** | Strict verification gating on `/api/search` matching verified JWT target. | Prevents malicious actors or web scrapers from using the platform as an unrestricted OSINT reconnaissance tool to dox third parties. Users can only query the exact identifier verified via OTP. |
| **ADR-003 (Ephemeral Notary)** | In-memory Hardhat local node (port 8545) anchoring 32-byte Merkle roots. | Provides zero-cost, reproducible EVM cryptographic notarization for local demonstration, CI testing, and academic evaluation without requiring public gas fees or testnet faucet tokens. |
| **ADR-004 (Dual Storage Engine)** | MySQL 8.0 primary relational storage with automatic JSON flat-file fallback (`instance/*.json`). | Ensures the platform runs out-of-the-box in developer environments where MySQL is not yet configured or temporarily offline, guaranteeing system resilience. |
| **ADR-005 (Scraper Resilience)** | Telethon MTProto client with `asyncio.Lock` serialization and synthetic fallback packets (`demo_info`). | Protects SQLite session storage from concurrency locks during bursts and guarantees continuous user search workflows even when Telegram rate-limits (FloodWait) or network connectivity fails. |
| **ADR-006 (Deterministic LLM Fallback)** | Deterministic local rule engine fallback when Ollama LLM is unavailable. | Guarantees that AI threat analysis and phishing explanation endpoints return valid, structured security guidance even when heavy local LLM daemon (`http://127.0.0.1:11434`) is offline. |

---

## 4. Open Issues Summary (SEC-01 to SEC-15)

The comprehensive audit identified 15 specific findings categorized across severity levels P0 through P3:

| ID | Severity | Category | File & Location | Summary |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **P0** | Auth / Defect | `backend/auth/routes/auth.js:486` | Broken relative path `require('../middleware/authGuard')` crashes all 12 authenticated AI & blockchain routes. |
| **SEC-02** | **P0** | Auth Bypass | `backend/auth/routes/auth.js:323`, `.env:32` | `SKIP_OTP=true` bypasses user OTP, admin OTP, and gateway auth, issuing full JWTs without validation. |
| **SEC-03** | **P0** | Auth Bypass | `backend/gateway/gatewayWs.js:89-94` | Accepts unverified tokens if length $\ge 10$ or decodes without signature validation, leaking user SMS OTPs. |
| **SEC-04** | **P0** | Secret Hygiene | `.env:10-38`, `osint_bot_session.session` | Plaintext Gmail app password, Telegram API ID/hash, MySQL password, and binary session file in repo. |
| **SEC-05** | **P1** | XSS / Auth | `frontend/src/pages/VerifyOtpPage.jsx:73` | Frontend mirrors JWT to `sessionStorage` and injects Bearer header, defeating `httpOnly` cookie protection. |
| **SEC-06** | **P1** | Privacy / PII | `backend/services/searchService.js:87` | Raw search query (email/phone) is logged in plaintext to `blockchain_audit_logs.json`. |
| **SEC-07** | **P1** | Integration | `backend/api/ai.js:45, 53, 78, 94, 128` | Appends `/api/ai/*` to `PYTHON_SERVICE_URL` containing trailing `/query`, producing invalid 404 routes. |
| **SEC-08** | **P1** | Runtime Bug | `scraper/osint_service.py:86` | `LLMThreatAnalyzer(llm_client)` passes argument to 0-argument `__init__`, crashing LLM boot. |
| **SEC-09** | **P1** | Dependencies | `backend/package.json` | 22 npm vulnerabilities (4 critical: `proxy-addr`, `shell-quote`, `tar`; 16 high: `adm-zip`, `axios`, `undici`, `zod`). |
| **SEC-10** | **P2** | Error Handling | `backend/server.js:1-166` | Missing global Express error handling middleware; unhandled errors leak call stacks and directory paths. |
| **SEC-11** | **P2** | Testing Gap | `contracts/package.json:8` | `hardhat test` reports 0 passing because tests are not located in `contracts/test/`. |
| **SEC-12** | **P2** | ASVS Violation | `backend/middleware/authGuard.js:25-27` | Middleware accepts authentication tokens via URL query string `req.query.token` (CWE-598). |
| **SEC-13** | **P2** | Resource Leak | `scraper/osint_service.py:349, 186` | Deprecated `@app.on_event('startup')`; unbounded in-memory queues and pagination state without TTL. |
| **SEC-14** | **P3** | Repository Hygiene | Root workspace, `frontend/public/` | Large committed binary files: `gemini_generated_*.mp4` (2.7MB), `android-gateway.zip` (66MB), `.zip` (25MB). |
| **SEC-15** | **P3** | Documentation Gap | `README.md:186-187` | Claims `blockchain/tests/merkle.test.js` runs with Jest; backend actually uses native Node runner (`node --test`). |

---

## 5. Verified vs. Unverified Items

### Verified Items (Empirically Validated in this Session)
- [x] **Backend Test Suite**: 103 passed, 0 failed across 26 test suites using Node.js native test runner (`node --test --test-concurrency=1`).
- [x] **Backend Blockchain Integration**: 10 passed, 0 failed verifying canonical JSON sorting, SHA-256 hashing, Merkle roots, and tamper detection (`test/ai_blockchain.test.js`).
- [x] **Frontend Test Suite**: 106 passed, 0 failed across 4 test suites using React Scripts / Jest (`react-scripts test --watchAll=false`).
- [x] **Scraper Threat Intelligence Suite**: 9 passed, 0 failed on Python 3.13.7 verifying UrlBERT, SentenceTransformers, and error resilience (`pytest scraper`).
- [x] **Database Connectivity**: Active MySQL service listening on `127.0.0.1:3306` with schema `osint_app`.
- [x] **Port Readiness**: Ports 3000 (React), 5000 (Express), 8001 (FastAPI), and 8545 (Hardhat) confirmed free of orphaned processes and ready for binding.

### Unverified Items (Deferred or Requiring External Context)
- [ ] **Physical Android Hardware SMS Dispatch**: SMS dispatch verified via software mocks and WebSocket frames; physical cellular transmission via SIM carrier not executed (no physical phone connected to headless test environment).
- [ ] **Live Telegram MTProto Handshake**: Verified via `AsyncMock` and resilience fallbacks; live connection to Telegram servers requires interactive SMS phone code prompt on fresh sessions.
- [ ] **Public Blockchain Deployment**: Smart contract anchoring verified on local Hardhat node; public testnet (Polygon Amoy) deployment was not performed to prevent gas spend.

---

## 6. Commands to Run App and Tests

### Commands to Run the Full Stack
```powershell
# Unified multi-service launcher (starts Hardhat, FastAPI, Express, React)
python run_servers.py

# Optional launcher flags:
# Bypass blockchain node:
python run_servers.py --no-blockchain

# Bypass live Telegram scraper:
python run_servers.py --no-telegram
```

### Commands to Run Subsystems Individually
```powershell
# 1. Hardhat EVM Blockchain Node (Port 8545)
cd contracts
node start-node.js

# 2. Python FastAPI Scraper & Threat AI (Port 8001)
cd scraper
uvicorn osint_service:app --host 127.0.0.1 --port 8001 --reload

# 3. Node.js Express API Gateway (Port 5000)
cd backend
node --watch index.js

# 4. React Frontend Web Application (Port 3000)
cd frontend
npm start
```

### Commands to Run Automated Test Suites
```powershell
# 1. Run Backend Test Suite (103 tests)
npm --prefix backend test

# 2. Run Backend Blockchain & Merkle Tests (10 tests)
npm --prefix backend run test:blockchain

# 3. Run Frontend Test Suite (106 tests)
npm --prefix frontend test -- --watchAll=false

# 4. Run Scraper Threat AI & Resilience Tests (9 tests)
python -m pytest scraper

# 5. Run Scraper Resilience Unit Tests Individually (5 tests)
python -m unittest scraper/test_scraper_resilience.py

# 6. Verify Database Port Connectivity
powershell -Command "Test-NetConnection -ComputerName 127.0.0.1 -Port 3306"
```

---

## 7. NEXT ACTION

**STOP EXECUTION AND AWAIT OWNER AUTHORIZATION.**  
In accordance with MASTER PROMPT v2 (Section 2, 7, and 11), Stage 1 (Discover) and Stage 2 (Team Conference & Audit) are formally complete. Zero source code changes were made to the codebase. The engineering team must not proceed to Stage 3 (Plan) or subsequent stages until the student owner reviews findings SEC-01 through SEC-15 and provides explicit authorization to proceed.
