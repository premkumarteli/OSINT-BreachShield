# BreachShield Project Logbook

## Purpose
This logbook records the technical evolution and day-wise engineering diary of **BreachShield: AI Powered OSINT Breach Detection & Dark Web Protection** as an academic major project (BIS786) for the Department of Information Science and Engineering, Acharya Institute of Technology.

It is written as an authentic engineering diary rather than a superficial checklist: what was designed, what was implemented, what real problems and bugs were encountered, what was learned, and how the multi-tier architecture matured over time.

The record is reconstructed from:
- Git commit history (66 verified commits across all subsystems)
- Monorepo source code across ackend/, rontend/, scraper/, and ndroid-gateway/
- Automated test suites (94 backend unit/integration/adversarial tests, 26 frontend component tests)
- Academic requirements, Phase 1 deliverables, and presentation blueprints

---

## Project Summary
**BreachShield** is an AI-powered, privacy-preserving OSINT breach intelligence and real-time alert platform. It enables individuals and organizations to verify whether sensitive credentials (emails, phone numbers, identity numbers) have been compromised in data leaks and dark web disclosures—**without disclosing the plaintext target identifier to third parties or intermediate servers**.

The system comprises four tightly integrated subsystems:
1. **Frontend Web Dashboard (rontend/)**: React 19 single-page application featuring a Cyberpunk HUD terminal, typewriter streaming output, real-time exposure risk gauge, client-side k-anonymity SHA-256 prefix hashing, and interactive incident reporting.
2. **Backend API Gateway (ackend/)**: Node.js Express 5 REST and WebSocket server managing dual-channel OTP authentication (bcrypt-hashed, 30s cooldown, 5-attempt lockout, 1h JWT session tokens), pluggable BreachSource aggregation registry, risk scoring engine, and audit logging.
3. **OSINT Scraper Engine (scraper/)**: Python FastAPI service utilizing Telethon MTProto client with syncio.Lock concurrency serialization, handling Telegram threat monitoring and resilient fallback intelligence generation.
4. **Android Gateway & Admin Control App (ndroid-gateway/)**: Native Android Kotlin application providing persistent WebSocket relay for carrier-safe SMS OTP transmission, exponential backoff reconnects, and an administrative control center with Liquid Glass UI.
5. **Blockchain Audit Trail & ML Threat Engine**: Solidity smart contract (AnchorRegistry.sol) deployed on a local Hardhat node with Merkle batching for tamper-evident audit logs, alongside XGBoost and deep learning models for breach severity classification.

`
+-------------------------------------------------------------------------------+
|                             BreachShield System                               |
+-------------------------------------------------------------------------------+
  [ React 19 Frontend ]  --(Client-side k-Anonymity / Bearer JWT)-->  [ Node.js API Gateway ]
          |                                                                   |
     (Web Crypto API)                                          +--------------+--------------+
  SHA-256 Prefix Hashing                                       |                             |
                                                   (HTTP / Pluggable)             (WebSocket /ws/gateway)
                                                               |                             |
                                                    [ Python Telethon Scraper ]    [ Android SMS Gateway ]
                                                    [ Local Breach Catalog    ]    [ Admin Control Mobile]
                                                    [ Hardhat AnchorRegistry  ]
`

---

## Evolution at a Glance

| Period | Milestone Focus | Key Outcomes & Deliverables |
| :--- | :--- | :--- |
| **Period 1**<br>*(20/07/2026 – 31/07/2026)* | **Foundations & Out-of-Band Auth** | • Initial 4-tier monorepo architecture (rontend, ackend, scraper, ndroid-gateway).<br>• Dual-channel OTP authentication (Gmail SMTP + Android SMS relay).<br>• MySQL 8.0 schema with JSON fallback store, bcrypt OTP hashing, and 30s rate limiting.<br>• React Cyberpunk HUD terminal UI scaffolded. |
| **Period 2**<br>*(01/08/2026 – 15/08/2026)* | **Privacy Protocol & Multi-Source OSINT** | • Client-side k-anonymity prefix hashing using Web Crypto API.<br>• Telethon MTProto Telegram scraper with syncio.Lock mutex serialization.<br>• Pluggable BreachSource registry querying local catalog, Telegram, and Hudson Rock simultaneously (Promise.allSettled).<br>• Android companion app with exponential backoff WebSocket and Liquid Glass UI. |
| **Period 3**<br>*(16/08/2026 – 04/09/2026)* | **AI Threat Scoring & Blockchain Anchoring** | • Machine learning breach severity classification: trained and evaluated 4 models (XGBoost 89.2%, CNN, RNN, Transformer) on 1,034 HIBP records.<br>• Merkle tree batching and Solidity smart contract (AnchorRegistry.sol) on local Hardhat blockchain with crash recovery.<br>• Full-stack security audit & 94 automated backend tests.<br>• Darkweb watchlist SSE stream & offline Ollama LLM integration. |

---

## Architecture Evolution

| Version | Core Stack | Key Innovations & Architectural Focus |
| :--- | :--- | :--- |
| **Version 1.0** | Node.js + Express + React | Basic search prototype with email OTP verification and local JSON breach storage. |
| **Version 1.5** | Node.js + FastAPI + Android Kotlin | Multi-platform monorepo; Android SMS gateway relay via WebSocket; Telethon scraper integration. |
| **Version 2.0** | Pluggable Adapters + k-Anonymity | Client-side SHA-256 prefix hashing; multi-source concurrent querying (Promise.allSettled); Admin Control Android app. |
| **Version 2.5** | XGBoost + Hardhat Blockchain | Real machine learning severity classifier (89.2% accuracy); Solidity AnchorRegistry contract; Merkle batching; 94 passing tests. |
| **Version 3.0** | Offline LLM + Darkweb Watchlist | Ollama LLM integration for contextual threat mitigation; real-time Server-Sent Events (SSE) darkweb monitoring stream. |

---

# Detailed Day-Wise Engineering Diary

## PHASE 1 – ARCHITECTURE & OUT-OF-BAND AUTH (20/07/2026 – 31/07/2026)

> **Phase Goal:** Establish multi-tier monorepo structure, build the dual-channel OTP verification engine (email + SMS relay), and prevent unauthorized access to breach lookup endpoints.

### 2026-07-20 to 2026-07-22 – Monorepo Architecture & Backend Scaffolding
- **Work completed:**
  - Designed the 4-tier monorepo structure separating presentation (rontend/), business logic & API gateway (ackend/), OSINT scraping (scraper/), and physical mobile relay (ndroid-gateway/).
  - Scaffolded Node.js Express 5 server with helmet, CORS, JSON body parser, and centralized error handling.
  - Designed database schema in MySQL 8.0 for users, sessions, and email_otps table with automatic JSON file fallback storage for offline development.
- **Problem or learning:**
  - Direct MySQL connection drops in developer environments required an auto-detecting abstraction layer that seamlessly falls back to local JSON storage without altering controller signatures.
- **Evidence:**
  - ackend/package.json, ackend/server.js, ackend/database/ connection pool logic.

### 2026-07-23 to 2026-07-25 – Email & SMS OTP Authentication Pipeline
- **Work completed:**
  - Implemented /api/auth/send-otp and /api/auth/verify-otp with bcrypt hashing for OTP storage.
  - Configured Nodemailer with Gmail SMTP transport for email OTP delivery.
  - Implemented 30-second resend cooldown timer and 5-attempt brute-force lockout window.
  - Generated cryptographically signed 1-hour JWT tokens containing target binding (erifiedTarget).
- **Problem or learning:**
  - Discovered that Gmail App Password copy-pastes often contain invisible whitespace, causing cryptic authentication failures. Implemented whitespace sanitization in Nodemailer transport configuration.
- **Evidence:**
  - ackend/auth/routes/auth.js, ackend/auth/services/otpService.js.

### 2026-07-26 to 2026-07-28 – Android SMS Gateway WebSocket Relay
- **Work completed:**
  - Implemented /ws/gateway endpoint in Express server using ws library to bridge physical Android smartphones.
  - Designed JSON handshake protocol: { type: 'AUTH', deviceId, token } followed by bi-directional heartbeat ping/pong.
  - Built pending SMS queue with memory storage and offline polling fallback (/api/gateway/pending/:deviceId).
- **Problem or learning:**
  - Indian mobile carriers enforce DLT spam filtering. Standard verification SMS templates were getting dropped silently. Formatted the message payload to follow approved transactional SMS syntax.
- **Evidence:**
  - ackend/gateway/gatewayWs.js, ackend/gateway/routes/gatewayRoutes.js.

### 2026-07-29 to 2026-07-31 – React Cyberpunk HUD Terminal & Route Gating
- **Work completed:**
  - Built React 19 single-page application with dark cyberpunk aesthetic, typewriter stream output, and responsive threat gauge.
  - Implemented strict route gating: direct queries to /api/search return 403 Forbidden unless authorized via verified OTP JWT header.
  - Prepared Milestone 1 deliverable review.
- **Problem or learning:**
  - Frontend axios interceptor was initially losing bearer tokens on page refresh. Implemented secure storage in sessionStorage with cookie synchronization.
- **Evidence:**
  - rontend/src/App.js, rontend/src/components/ExposureGauge.jsx, 	est/challenger_backend.test.js.

---

## PHASE 2 – PRIVACY PRESERVATION & MULTI-SOURCE OSINT (01/08/2026 – 15/08/2026)

> **Phase Goal:** Implement zero-knowledge client-side k-anonymity hashing, integrate live Telegram OSINT scraping with concurrency safety, and create a unified pluggable breach intelligence registry.

### 2026-08-01 to 2026-08-03 – Client-Side k-Anonymity Prefix Hashing
- **Work completed:**
  - Implemented privacy-preserving search protocol inspired by Cloudflare / HaveIBeenPwned.
  - Built client-side SHA-256 hashing using the browser's native window.crypto.subtle API.
  - The client transmits only the first 5 characters of the hash prefix (e.g. e3b0c) to the backend /api/k-anonymity/range/:prefix.
  - The server returns all candidate hash suffixes matching that prefix; full matching occurs exclusively in the user's browser memory.
- **Problem or learning:**
  - Plaintext email/phone numbers never touch the network unhashed, eliminating server-side leak liability.
- **Evidence:**
  - rontend/src/utils/kAnonymity.js, ackend/services/kAnonymityService.js.

### 2026-08-04 to 2026-08-07 – Telethon Telegram OSINT Scraper & Mutex Locking
- **Work completed:**
  - Built Python FastAPI microservice (scraper/osint_service.py) interfacing with Telegram via Telethon MTProto client.
  - Configured automated channel monitoring for public threat intelligence and breach dump notifications.
  - Implemented syncio.Lock serialization around the Telethon client instance with an 8-second timeout.
  - Built rich fallback intelligence generation (demo_info) when Telegram bot rate limits or FloodWait errors occur.
- **Problem or learning:**
  - Concurrent incoming requests caused the Telethon client to throw sqlite3.OperationalError: database is locked. Wrapping all MTProto calls in a centralized 	g_lock mutex resolved the race condition permanently.
- **Evidence:**
  - scraper/osint_service.py, scraper/requirements.txt.

### 2026-08-08 to 2026-08-11 – Pluggable BreachSource Adapter Registry
- **Work completed:**
  - Refactored disparate search methods into an extensible BreachSource object-oriented interface.
  - Built concrete source adapters:
    1. LocalBreachSource: Slices local 1,034+ record breach catalog with case-insensitive field matching.
    2. TelegramBreachSource: Dispatches queries to Python scraper service.
    3. HudsonRockSource: Queries infostealer database feeds.
  - Combined all adapters using Promise.allSettled in searchService.js so that an individual source failure or network timeout never blocks the aggregated response.
- **Problem or learning:**
  - Indian phone numbers are entered inconsistently (9 digits, 10 digits, or with +91). Implemented automatic canonicalization in the query preprocessor to ensure uniform cross-source hits.
- **Evidence:**
  - ackend/services/sources/, ackend/services/searchService.js.

### 2026-08-12 to 2026-08-15 – Android Admin Control Application & Backoff Protocol
- **Work completed:**
  - Developed native Android companion app in Kotlin (ndroid-gateway/) with Liquid Glass design language.
  - Implemented WebSocketManager.kt featuring exponential backoff with random jitter (1s to 30s) for robust reconnection over cellular networks.
  - Implemented persistent foreground service (GatewayForegroundService.kt) holding a transient partial wake-lock during SMS dispatch.
  - Built administrative control interface allowing remote operators to toggle SMS relays, inspect system health, and terminate active sessions.
- **Problem or learning:**
  - Disconnections during cellular handover between Wi-Fi and 4G/5G could cause message loss. Added a 5-second polling safety net (/api/gateway/pending/:deviceId) to recover unacknowledged dispatches.
- **Evidence:**
  - ndroid-gateway/app/src/main/java/com/osint/breachshield/gateway/.

---

## PHASE 3 – AI THREAT SCORING & BLOCKCHAIN ANCHORING (16/08/2026 – 04/09/2026)

> **Phase Goal:** Benchmarking machine learning models for breach severity scoring, implementing cryptographic Merkle tree batching and Solidity smart contract anchoring, and conducting full-stack security audits.

### 2026-08-16 to 2026-08-20 – Machine Learning Model Training & Benchmarking
- **Work completed:**
  - Sourced and curated a benchmark dataset of 1,034 verified data breaches from the HaveIBeenPwned catalog.
  - Extracted feature vectors across 7 dimensions: compromised account volume, credential sensitivity (passwords, PII, financial info), breach recency, and verification flags.
  - Built stratified 80/20 train/test evaluation pipeline across 4 model architectures:
    - **XGBoost (Gradient Boosted Trees)**: **89.2% Accuracy**, 0.89 F1-score.
    - **Convolutional Neural Network (1D-CNN)**: 66.2% Accuracy.
    - **Recurrent Neural Network (Bi-LSTM)**: 44.6% Accuracy.
    - **Transformer (Self-Attention)**: 48.4% Accuracy.
  - Selected XGBoost as the production classification engine due to superior performance on tabular tabular data with zero deep neural network weight-initialization variance.
- **Problem or learning:**
  - Deep learning architectures (CNN/RNN/Transformer) severely overfitted and underperformed on tabular breach metadata due to small dataset size and absence of dense sequential tokens. XGBoost provided deterministic, explainable, and production-ready decision splits.
- **Evidence:**
  - data/catalog/breaches.json, ML evaluation metrics in docs/PROJECT.md.

### 2026-08-21 to 2026-08-26 – Blockchain Audit Anchoring & Merkle Batcher
- **Work completed:**
  - Developed Solidity smart contract AnchorRegistry.sol containing nchorRoot(bytes32 rootHash) and erifyRoot(bytes32 rootHash).
  - Implemented merkleBatcher.js in backend:
    - Buffers incoming breach search audit logs into 20-event batches or 60-second time windows.
    - Computes SHA-256 leaf hashes and constructs a balanced cryptographic Merkle tree.
    - Dispatches the Merkle root hash on-chain using ethers.js.
  - Implemented dead-letter queue (DLQ) with up to 5 automated retries for unanchored batches.
  - Built server boot hook ensureContractDeployed() to automatically spin up and deploy contracts on local Hardhat blockchain (http://127.0.0.1:8545).
- **Problem or learning:**
  - Initial tests on Polygon Amoy public testnet encountered severe RPC provider rate limits and gas price spikes that stalled continuous integration runs. The architecture was rationally scoped to an automated local Hardhat node, guaranteeing zero-downtime, deterministic test execution.
  - Found a bug where server restarts would lose in-flight Merkle proofs. Fixed batch recovery serialization to persist generated proofs alongside the root hash.
- **Evidence:**
  - ackend/blockchain/AnchorRegistry.sol, ackend/blockchain/merkleBatcher.js, ackend/blockchain/verificationService.js.

### 2026-08-27 to 2026-08-31 – Full-Stack Security Audit & Adversarial Testing
- **Work completed:**
  - Conducted extensive penetration test across all API endpoints:
    - Replaced Math.random() with crypto.randomInt() in OTP generation.
    - Rotated JWT signing secret to 128-character cryptographically random hex.
    - Enforced administrative role checks on sensitive gateway endpoints.
    - Sanitized server logs to prevent plaintext OTP leakage.
  - Constructed comprehensive backend test suite comprising 94 tests:
    - Unit tests for auth, OTP cooldown, and bcrypt matching.
    - Integration tests for k-anonymity prefix ranges and search adapters.
    - Adversarial tests: algorithm tampering (lg=none), replay attacks, brute-force floods, and malformed payload injection.
  - Verified 100% clean passes for frontend tests (26/26) and production build.
- **Problem or learning:**
  - Identified that catch blocks in search endpoints were swallowing internal 500 errors and returning false 'clean scan' results. Restructured error propagation so system errors return clear HTTP 500 statuses while user targets with no breaches return legitimate clean status.
- **Evidence:**
  - ackend/test/, ackend/test/challenger_backend.test.js, rontend/src/App.test.js.

### 2026-09-01 to 2026-09-04 – Darkweb Watchlist & Offline LLM Intelligence
- **Work completed:**
  - Implemented /api/darkweb/stream using Server-Sent Events (SSE) for real-time threat feed broadcasting.
  - Integrated offline Ollama LLM threat intelligence connector for local contextual explanation of discovered leaks without sending data to public cloud APIs.
  - Compiled academic documentation, Phase 2 presentations, and verified synchronization between report rubrics and codebase implementation.
- **Problem or learning:**
  - Darkweb stream initially broadcast private user watchlist terms globally. Patched endpoint to isolate watchlist monitoring strictly to the authenticated user's session context.
- **Evidence:**
  - ackend/api/darkweb.js, ackend/api/ai.js, docs/academic/BreachShield_Phase2_Presentation.pptx.

---

## Metric & Verification Summary

| Subsystem | Metric / Test Suite | Verified Status |
| :--- | :--- | :--- |
| **Backend Gateway** | 94 Automated Tests (Integration + Adversarial) | **100% Passed (0 Failures)** |
| **Frontend Dashboard** | 26 Component Tests + Production Build | **100% Passed (0 Failures)** |
| **ML Severity Engine** | 1,034 Breaches (80/20 Split, 4 Architectures) | **XGBoost Selected (89.2% Accuracy)** |
| **Blockchain Anchoring** | Hardhat Local Node + 17 Merkle Batch Tests | **Verified Auto-Deploy & Recovery** |
| **Android Gateway** | Gradle Kotlin Compilation & WebSocket Sync | **Clean Compilation (0 Errors)** |
