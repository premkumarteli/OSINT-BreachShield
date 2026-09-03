# 🛡️ OSINT BreachShield

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-2.14-EE4C2C?logo=pytorch&logoColor=white)
![Transformers](https://img.shields.io/badge/Transformers-HuggingFace-FFD21E)
![Android](https://img.shields.io/badge/Android-Kotlin%20%7C%20Compose-3DDC84?logo=android&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-OkHttp%20%7C%20ws-010101?logo=socketdotio&logoColor=white)

**Next-Generation AI-Powered OSINT Intelligence, Phishing Detection & Blockchain Audit Platform**  
*Gated OTP Verification • AI Phishing Classifier • CNN/RNN/Transformer Comparative Analysis • SentenceTransformer Correlation • Tamper-Evident Blockchain Audit Ledger*

</div>

---

## 🏛️ System Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         WEB & BREACH SEARCH SUBSYSTEM                            │
└──────────────────────────────────────────────────────────────────────────────────┘
   React 18 Frontend (Port 3000)
       │
       │ HTTP / REST (JWT Cookies & Bearer Tokens)
       ▼
   Node.js / Express Backend (Port 5000)
       ├── authGuard / verifyOtpToken (Middleware)
       ├── searchService.js & Multi-Source OSINT Registry
       ├── riskEngine.js (Explainable Multi-Factor Risk & Data Masking)
       ├── blockchain/ (Audit Hasher, Blockchain Client & Verification)
       └── MySQL Database (email_otps, gateway_devices, sms_jobs, ai_schema)
       │
       │ HTTP POST /query & /api/ai/*
       ▼
   Python FastAPI Microservice (Port 8001) [osint_service.py]
       ├── scraper/ai/ (URLFeatureExtractor, PhishingURLClassifier)
       ├── scraper/ai/ (CNNPhishingClassifier, RNNPhishingClassifier, TransformerPhishingClassifier)
       ├── scraper/ai/ (EntityCorrelator - SentenceTransformers all-MiniLM-L6-v2)
       └── Telethon MTProto Client (Serialized with asyncio.Lock)
```

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     ANDROID PHYSICAL-SIM SMS GATEWAY SUBSYSTEM                   │
└──────────────────────────────────────────────────────────────────────────────────┘
   Node.js Backend WebSocket Relay (ws://localhost:5000/ws/gateway)
       ▲
       │ WebSocket Connections + Heartbeat + JWT Device Token Auth
       ▼
   Android Gateway App (Kotlin / Jetpack Compose / OkHttp / Room)
       │
       │ Android Telephony API (SmsManagerWrapper)
       ▼
   Physical Android SIM Card ──► Cellular Network ──► Recipient Mobile Device (SMS OTP)
```

---

## 🤖 Implemented AI & Security Modules

### 1. AI Phishing URL Detection Pipeline (`scraper/ai/phishing_classifier.py`)
- **Extraction & Normalization**: Canonical URL parsing, TLD extraction, domain entropy, special character frequencies.
- **Model**: `nhellyercreek/url-phishing-classifier` with fallback to neural ensemble.
- **Output**: URL, classification (`SAFE`, `SUSPICIOUS`, `PHISHING`), confidence percentage, model version, and inference latency (ms).

### 2. CNN vs. RNN vs. Transformer Model Analysis (`scraper/ai/model_manager.py`)
- **Char-CNN (1D Conv)**: Character sequence feature map convolution.
- **BiLSTM (RNN)**: Bidirectional recurrent sequence modeling.
- **Transformer**: Self-attention mechanism for contextual feature learning.
- **Metrics Evaluated**: Accuracy, Precision, Recall, F1-Score, Confusion Matrix, Parameter Count, and Inference Latency.

### 3. Entity & Breach Semantic Correlation (`scraper/ai/entity_correlator.py`)
- **Structured Field Matching**: Cross-check email, phone, IP, username, and password hash matches.
- **Dense Embeddings**: `sentence-transformers/all-MiniLM-L6-v2` dense vectors.
- **Classification**: `RELATED` ($\ge 0.75$), `POSSIBLY_RELATED` ($0.50 - 0.74$), `UNRELATED` ($< 0.50$).

### 4. Multi-Source OSINT Registry (`backend/sources/`)
- `TelegramScraperSource.js`: Telethon MTProto scraper.
- `PhishingFeedSource.js`: Active public phishing database feed ingestion.
- `PublicBreachSource.js`: Partitioned k-anonymity breach catalog store.
- `ThreatIntelSource.js`: Public domain & threat indicator reputation feed.

### 5. Transparent Explainable Risk Engine (`backend/analytics/riskEngine.js`)
- Multi-factor risk formula ($0-100$) outputting `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Transparent factor breakdown object (`phishing_probability`, `correlation_score`, `severity`, `recency`, `source_reliability`).

### 6. Tamper-Evident Blockchain Audit Ledger (`backend/blockchain/`)
- Canonical JSON serialization & SHA-256 event hashing.
- On-chain transaction logging & block verification (`VALID`, `TAMPERED`, `NOT_FOUND`).

---

## 🚀 Running Tests & Benchmarks

```bash
# Python AI Unit Tests & Benchmarks (7/7 Passed)
cd scraper
python -m pytest test_ai_engine.py

# Node.js AI, Multi-Source & Blockchain Tests (10/10 Passed)
cd backend
node test/ai_blockchain.test.js

# Regression Tests
node test/source_registry.test.js
node test/scraper_redaction.test.js
```

---

## 📜 Database Schema Migrations

Run MySQL migrations located in:
- `backend/sql/schema.sql` (Email OTPs)
- `backend/sql/gateway_schema.sql` (Android SMS Gateway Devices & Jobs)
- `backend/sql/ai_schema.sql` (Phishing Analysis, ML Predictions, Entity Correlations, Threat Indicators, Blockchain Audit Logs)
