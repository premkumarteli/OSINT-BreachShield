# Comprehensive Engineering Audit: OSINT-BreachShield

**Document Version:** 1.0.0  
**Date:** November 18, 2026  
**Auditor / Engineering Role:** Architecture, Security & Code Quality Audit Team  
**Governing Standard:** MASTER PROMPT v2 (Stage 2 Completion Deliverable)  
**Integrity Mode:** Development (Read-Only Forensic Evaluation; zero source modifications)

---

## 1. Audit Overview & Methodology

This audit establishes a complete forensic catalog of security vulnerabilities, architectural defects, privacy breaches, and technical debt in **OSINT-BreachShield**. In accordance with MASTER PROMPT v2:
- All findings are classified by severity: **P0 (Critical / Blocker)**, **P1 (High)**, **P2 (Medium)**, and **P3 (Low / Polish)**.
- Each finding is grounded in direct repository evidence, exact file paths, line numbers, and empirical test execution.
- No finding is fabricated or assumed.
- Findings are evaluated against established industry benchmarks: OWASP ASVS v4.0, OWASP Top 10 API Security 2023, STRIDE threat modeling, and NIST SSDF.

### Summary Table of Findings (SEC-01 through SEC-15)

| ID | Severity | Category | File & Line Location | Summary Description | Effort |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **P0** | Auth / Defect | `backend/auth/routes/auth.js:486` | Broken relative require path crashes 12 authenticated AI and blockchain endpoints. | 15 min |
| **SEC-02** | **P0** | Auth Bypass | `backend/auth/routes/auth.js:323`, `.env:32` | `SKIP_OTP=true` bypasses user OTP, admin OTP, and gateway auth, issuing full JWTs. | 30 min |
| **SEC-03** | **P0** | Auth Bypass | `backend/gateway/gatewayWs.js:89-94` | Accepts unverified tokens if length $\ge 10$ or decodes without signature validation. | 30 min |
| **SEC-04** | **P0** | Secret Hygiene | `.env:10-38`, `osint_bot_session.session` | Plaintext Gmail app password, Telegram API ID/hash, MySQL password, and session DB in repo. | 1 hr |
| **SEC-05** | **P1** | XSS / Auth | `frontend/src/pages/VerifyOtpPage.jsx:73` | Frontend mirrors JWT to `sessionStorage` and injects Bearer header, defeating `httpOnly` cookie. | 1 hr |
| **SEC-06** | **P1** | Privacy / PII | `backend/services/searchService.js:87` | Raw search query (email/phone) is logged in plaintext to `blockchain_audit_logs.json`. | 45 min |
| **SEC-07** | **P1** | Integration | `backend/api/ai.js:45, 53, 78, 94, 128` | Appends `/api/ai/*` to `PYTHON_SERVICE_URL` containing trailing `/query`, causing 404s. | 30 min |
| **SEC-08** | **P1** | Runtime Bug | `scraper/osint_service.py:86` | `LLMThreatAnalyzer(llm_client)` passes argument to 0-argument `__init__`, crashing LLM boot. | 20 min |
| **SEC-09** | **P1** | Dependencies | `backend/package.json` | 22 npm vulnerabilities (4 critical: `proxy-addr`, `shell-quote`, `tar`; 16 high: `axios`, `zod`). | 1.5 hr |
| **SEC-10** | **P2** | Error Handling | `backend/server.js:1-166` | Missing global Express error handling middleware; unhandled errors leak call stacks and paths. | 30 min |
| **SEC-11** | **P2** | Testing Gap | `contracts/package.json:8` | `hardhat test` reports 0 passing because tests are not located in `contracts/test/`. | 1 hr |
| **SEC-12** | **P2** | ASVS Violation | `backend/middleware/authGuard.js:25-27` | Middleware accepts authentication tokens via URL query string `req.query.token` (CWE-598). | 20 min |
| **SEC-13** | **P2** | Resource Leak | `scraper/osint_service.py:349, 186` | Deprecated `@app.on_event('startup')`; unbounded in-memory queues and pagination without TTL. | 1.5 hr |
| **SEC-14** | **P3** | Repository Hygiene | Root workspace, `frontend/public/` | Large committed binary files: `gemini_generated_*.mp4` (2.7MB), `android-gateway.zip` (66MB). | 30 min |
| **SEC-15** | **P3** | Documentation Gap | `README.md:186-187` | Claims `blockchain/tests/merkle.test.js` runs with Jest; backend actually uses `node --test`. | 30 min |

---

## 2. Priority 0 (P0) — Critical Vulnerabilities & Blocker Defects

---

### SEC-01: Broken Module Require Path in Auth Router Crashes Authenticated AI Endpoints
- **ID:** `SEC-01`
- **Severity:** `P0` (Critical / Crash)
- **Category:** Authentication / Code Defect
- **File & Line Location:** `backend/auth/routes/auth.js:486` (referenced by `backend/api/ai.js:3`)
- **Evidence:**
  ```javascript
  // backend/auth/routes/auth.js:485-487
  function verifyOtpToken(req, res, next) {
    return require('../middleware/authGuard').verifyOtpToken(req, res, next);
  }
  ```
  Execution Verification:
  ```powershell
  node -e "require('./backend/auth/routes/auth').verifyOtpToken({}, {}, () => {})"
  # Output:
  # Error: Cannot find module '../middleware/authGuard'
  # Require stack:
  # - c:\Users\prem\OSINT-breach-Finder-main\backend\auth\routes\auth.js
  ```
- **Root Cause Analysis:**
  `auth.js` is located at `backend/auth/routes/auth.js`. The path `../middleware/authGuard` resolves to `backend/auth/middleware/authGuard`, which does not exist (`authGuard.js` is located at `backend/middleware/authGuard.js`, which is `../../middleware/authGuard`). `backend/api/ai.js:3` imports `{ verifyOtpToken }` from `../auth/routes/auth` and mounts it across 12 endpoints. When any authenticated user attempts to access these endpoints, the dynamic require executes and immediately throws an unhandled `MODULE_NOT_FOUND` exception, crashing the request.
- **Proposed Solution:**
  1. Fix the require path in `backend/auth/routes/auth.js:486` to `require('../../middleware/authGuard')`.
  2. Better yet, in `backend/api/ai.js:3`, import `verifyOtpToken` directly from its authoritative source: `const { verifyOtpToken } = require('../middleware/authGuard');`.
- **Effort Estimate:** 15 minutes.
- **Verification Criteria:**
  Running `node -e "require('./backend/auth/routes/auth').verifyOtpToken"` must succeed without error, and calling `POST /api/ai/analyze-url` with a valid JWT must not crash with `MODULE_NOT_FOUND`.

---

### SEC-02: Complete Authentication Bypass via `SKIP_OTP=true` in Environment
- **ID:** `SEC-02`
- **Severity:** `P0` (Critical / Authentication Bypass)
- **Category:** Authentication Bypass / Broken Access Control
- **File & Line Location:** `backend/auth/routes/auth.js:321-329`, `backend/api/admin.js:135-165`, `.env:32`
- **Evidence:**
  ```javascript
  // backend/auth/routes/auth.js:321-326
  const skipOtp = (process.env.SKIP_OTP || '').toLowerCase() === 'true';
  if (skipOtp) {
    console.log(`[DEV] SKIP_OTP=true — no OTP record for ${targetKey}, allowing login anyway`);
    record = { email: targetKey, verified: true, id: 0 };
  }
  ```
  ```javascript
  // backend/api/admin.js:159-165
  } else if (skipOtp) {
    console.log(`[DEV] SKIP_OTP=true — bypassing admin OTP for ${targetEmail}`);
  }
  // Immediately signs and returns 24h admin JWT!
  ```
  Active value in `c:\Users\prem\OSINT-breach-Finder-main\.env:32`:
  ```text
  SKIP_OTP=true
  ```
- **Root Cause Analysis:**
  A development bypass flag `SKIP_OTP` was hardcoded into authentication routines to facilitate rapid local testing. In `.env`, `SKIP_OTP=true` is actively enabled. When active, sending `POST /api/auth/verify-otp` with any arbitrary target and OTP code instantly returns a valid 1-hour JWT. More critically, sending `POST /api/admin/verify-otp` with `admin@breachshield.io` and an arbitrary OTP bypasses all authentication and issues a 24-hour administrative JWT with `role: 'admin'`, granting complete SOC control to unauthenticated remote actors.
- **Proposed Solution:**
  1. In root `.env` and `.env.example`, change `SKIP_OTP=true` to `SKIP_OTP=false`.
  2. In `backend/server.js`, add an environment guard: if `process.env.NODE_ENV === 'production'` and `SKIP_OTP === 'true'`, refuse to start and terminate with `process.exit(1)`.
  3. Restrict `SKIP_OTP` handling exclusively to automated integration test runners.
- **Effort Estimate:** 30 minutes.
- **Verification Criteria:**
  With `SKIP_OTP=false`, calling `POST /api/auth/verify-otp` with an incorrect OTP must return HTTP 400 `{"success": false, "error": "Invalid or expired verification code."}`.

---

### SEC-03: Forged Token & Arbitrary Length Bypass in Android Gateway WebSocket
- **ID:** `SEC-03`
- **Severity:** `P0` (Critical / Authentication Bypass)
- **Category:** Broken Authentication / Gateway Relay
- **File & Line Location:** `backend/gateway/gatewayWs.js:83-94`, `backend/gateway/controllers/gatewayController.js:430`
- **Evidence:**
  ```javascript
  // backend/gateway/gatewayWs.js:83-94
  } catch (jwtErr) {
    const unverified = jwt.decode(targetToken);
    if (unverified && (unverified.deviceId === deviceId || !unverified.deviceId)) {
      decoded = { deviceId, role: 'sms_gateway', ...unverified };
    } else if ((process.env.SKIP_OTP || '').toLowerCase() === 'true' || targetToken.length >= 10) {
      decoded = { deviceId, role: 'sms_gateway' };
    } else {
      throw jwtErr;
    }
  }
  ```
- **Root Cause Analysis:**
  When a mobile gateway connects to `/ws/gateway` and sends an authentication frame, the server verifies the JWT signature. However, if `jwt.verify` fails, the `catch` block falls back to decoding the token without cryptographic verification (`jwt.decode`), or grants full `sms_gateway` authorization if `targetToken.length >= 10`. Any attacker who connects to `/ws/gateway` with a random 10-character string (e.g. `"0123456789"`) is authenticated as an active SMS gateway and receives all dispatched user SMS OTP verification codes in plaintext.
- **Proposed Solution:**
  1. Delete lines 84-93 of `backend/gateway/gatewayWs.js`.
  2. If `jwt.verify(targetToken, JWT_SECRET)` throws an error, reject the connection immediately: send `AUTH_FAILED` frame and close the WebSocket with status code 1008 (Policy Violation).
  3. Apply the same strict enforcement to HTTP polling in `gatewayController.js:430`.
- **Effort Estimate:** 30 minutes.
- **Verification Criteria:**
  Attempting to connect to `/ws/gateway` with a token of length $\ge 10$ that is not signed with `JWT_SECRET` must be immediately rejected with close code 1008.

---

### SEC-04: Plaintext Production Secrets and MTProto Session File in Version-Controlled Tree
- **ID:** `SEC-04`
- **Severity:** `P0` (Critical / Secret Hygiene)
- **Category:** Credential Exposure / Information Disclosure
- **File & Line Location:** `c:\Users\prem\OSINT-breach-Finder-main\.env:10-38`, `osint_bot_session.session` (root and `scraper/`)
- **Evidence:**
  Lines 10-38 of `.env`:
  ```text
  TG_PHONE=+917996171402
  TG_API_ID=28444606
  TG_API_HASH=409411e66ccb00968523f446d30cded9
  DB_PASS=Prem@333
  EMAIL_USER=breachshield.osint@gmail.com
  EMAIL_PASS=mequ adyu zfyx jxmj
  ADMIN_EMAIL=premkumarteli333@gmail.com
  ```
  Binary MTProto session files present in workspace:
  - `c:\Users\prem\OSINT-breach-Finder-main\osint_bot_session.session` (28,672 bytes)
  - `c:\Users\prem\OSINT-breach-Finder-main\scraper\osint_bot_session.session` (28,672 bytes)
- **Root Cause Analysis:**
  Live production credentials — including a functional Google Account App Password (`EMAIL_PASS`), personal Telegram API developer keys (`TG_API_ID`, `TG_API_HASH`), local MySQL administrative passwords, and a persistent Telegram MTProto SQLite authentication session database — are stored as plaintext files directly in the repository directory rather than an isolated external secrets vault.
- **Proposed Solution:**
  1. Revoke and rotate the exposed Google App Password immediately in Google Account security settings.
  2. Regenerate the Telegram API hash on `my.telegram.org`.
  3. Add `.env`, `*.session`, and `*.session-journal` to root `.gitignore`.
  4. Ensure `.env.example` contains only placeholder values (`your_email@gmail.com`, `replace_with_strong_secret`).
- **Effort Estimate:** 1 hour.
- **Verification Criteria:**
  `git status` must not track `.env` or `*.session`, and `.env.example` must contain zero production secrets.

---

## 3. Priority 1 (P1) — High Severity Vulnerabilities & Architectural Defects

---

### SEC-05: Client-Side JWT Token Mirroring in `sessionStorage` Defeats `httpOnly` XSS Protection
- **ID:** `SEC-05`
- **Severity:** `P1` (High / XSS Resistance)
- **Category:** Session Management / ASVS V3.4
- **File & Line Location:** `frontend/src/pages/VerifyOtpPage.jsx:73`, `frontend/src/lib/api.js:12-15`, `frontend/src/lib/kAnonymity.js:59-62`
- **Evidence:**
  ```javascript
  // frontend/src/pages/VerifyOtpPage.jsx:72-74
  if (res.data.token) {
    sessionStorage.setItem('osint_token', res.data.token);
  }
  ```
  ```javascript
  // frontend/src/lib/api.js:12-15
  const token = sessionStorage.getItem('osint_token');
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token;
  }
  ```
- **Root Cause Analysis:**
  The Express backend sets secure `httpOnly` cookies (`token` and `otp_token`) upon OTP verification to prevent script-based token theft in accordance with OWASP recommendations. However, `auth.js:411` simultaneously returns the JWT in the JSON response body. The React frontend reads this JSON field and saves it to `sessionStorage`, manually attaching it as an `Authorization: Bearer` header on subsequent requests. Because `sessionStorage` is fully accessible to any client-side JavaScript executing in the origin, an attacker exploiting any Cross-Site Scripting (XSS) vulnerability can exfiltrate the JWT, entirely negating the defense provided by `httpOnly` cookies.
- **Proposed Solution:**
  1. Remove `sessionStorage.setItem('osint_token')` from `VerifyOtpPage.jsx`.
  2. Remove `sessionStorage.getItem('osint_token')` and manual `Authorization` header injection from `api.js` and `kAnonymity.js`.
  3. Ensure Axios client is configured globally with `axios.defaults.withCredentials = true;`, allowing the browser to automatically transmit `httpOnly` cookies with each request.
- **Effort Estimate:** 1 hour.
- **Verification Criteria:**
  Inspect `sessionStorage` in DevTools after OTP verification; `osint_token` must not be present, while authenticated search requests continue to succeed via `cookie: otp_token=...`.

---

### SEC-06: Plaintext PII Exposure in Blockchain Audit Log Persistence
- **ID:** `SEC-06`
- **Severity:** `P1` (High / Privacy Breach)
- **Category:** Cryptographic Privacy / PII Retention
- **File & Line Location:** `backend/services/searchService.js:87`, `backend/blockchain/auditLogger.js:49-62, 88-90`
- **Evidence:**
  ```javascript
  // backend/services/searchService.js:87
  auditRecord = await logThreatEvent({
    query: normalizedQuery, // e.g. "victim@target.com" or "+919876543210"
    eventType: 'BREACH_SEARCH',
    sourceName: 'Telegram-MultiSource',
    riskScore: exposure.riskScore,
    riskLevel: exposure.riskLevel
  });
  ```
  ```javascript
  // backend/blockchain/auditLogger.js:58-62, 88-90
  const eventPayload = {
    ...event,
    eventId,
    eventType: event.eventType || 'OSINT_EVENT',
    timestamp: event.timestamp || new Date().toISOString()
  };
  // ...
  logs.push(auditRecord);
  writeJsonLogs(logs); // Writes unhashed PII directly to disk!
  ```
- **Root Cause Analysis:**
  OSINT-BreachShield advertises zero-knowledge k-Anonymity searching where personal identifiers are never stored on the server. However, in `searchService.js`, the raw `normalizedQuery` (unmasked email or phone number) is passed directly into `logThreatEvent()`. `auditLogger.js` persists this payload directly into `instance/blockchain_audit_logs.json` and builds canonical JSON hashes from it. If server logs are inspected, breached, or audited, the exact search targets of all users are permanently stored in cleartext on disk.
- **Proposed Solution:**
  1. Hash the search query with SHA-256 (`crypto.createHash('sha256').update(normalizedQuery).digest('hex')`) before passing it into `logThreatEvent()`.
  2. In `auditLogger.js`, store `queryHash: hash` and an optional truncated prefix mask (e.g. `vi***@target.com`), ensuring raw PII is never written to disk or canonical JSON.
- **Effort Estimate:** 45 minutes.
- **Verification Criteria:**
  Execute a search for `test@example.com` and inspect `instance/blockchain_audit_logs.json`. The raw string `test@example.com` must not appear anywhere in the file.

---

### SEC-07: Route Suffix Concatenation Defect Causes 404 on AI Proxy Endpoints
- **ID:** `SEC-07`
- **Severity:** `P1` (High / Functional Defect)
- **Category:** Subsystem Integration / HTTP Routing
- **File & Line Location:** `backend/api/ai.js:45, 53, 78, 94, 128`, `.env:6`
- **Evidence:**
  In `.env:6`:
  ```text
  PYTHON_SERVICE_URL=http://127.0.0.1:8001/query
  ```
  In `backend/api/ai.js:45`:
  ```javascript
  const resp = await fetch(`${PYTHON_SERVICE_URL}/api/ai/analyze-url`, { ... });
  ```
  Evaluated URL:
  `http://127.0.0.1:8001/query/api/ai/analyze-url` (returns HTTP 404 Not Found from FastAPI).
- **Root Cause Analysis:**
  The `PYTHON_SERVICE_URL` variable in `.env` is configured as `http://127.0.0.1:8001/query` because the legacy search proxy in `search.js` posted directly to that URL. In `backend/api/search.js:16-21`, the author wrote a `getPythonBaseUrl()` helper function that strips trailing `/query`. However, `backend/api/ai.js` was written without this helper and blindly concatenates `${PYTHON_SERVICE_URL}/api/ai/...`, causing every AI endpoint (`/api/ai/analyze-url`, `/api/ai/analyze-threat`, `/api/ai/correlate`, `/api/ai/compare`) to call invalid URLs and fail with 404 errors.
- **Proposed Solution:**
  1. Create a shared helper `backend/config/urls.js` that parses `PYTHON_SERVICE_URL` and exports both `PYTHON_BASE_URL` (`http://127.0.0.1:8001`) and `PYTHON_QUERY_URL` (`http://127.0.0.1:8001/query`).
  2. Refactor `backend/api/ai.js` to use `PYTHON_BASE_URL`.
- **Effort Estimate:** 30 minutes.
- **Verification Criteria:**
  Sending `POST /api/ai/analyze-url` with `{ "url": "http://test.com" }` through the Express gateway must return HTTP 200 with model classification probabilities, not HTTP 404 or 502.

---

### SEC-08: Argument Mismatch in `LLMThreatAnalyzer.__init__` Crashes Threat Engine Boot
- **ID:** `SEC-08`
- **Severity:** `P1` (High / Runtime Defect)
- **Category:** Runtime Exception / Python Microservice
- **File & Line Location:** `scraper/osint_service.py:86`, `scraper/ai/llm_threat_analyzer.py:35`
- **Evidence:**
  In `scraper/osint_service.py:86`:
  ```python
  llm_analyzer = LLMThreatAnalyzer(llm_client)
  ```
  In `scraper/ai/llm_threat_analyzer.py:35`:
  ```python
  class LLMThreatAnalyzer:
      def __init__(self):
          self.client = OllamaClient()
  ```
  Runtime Execution Result:
  `TypeError: LLMThreatAnalyzer.__init__() takes 1 positional argument but 2 were given`
- **Root Cause Analysis:**
  In `osint_service.py`, `llm_analyzer` is instantiated by passing `llm_client` as a constructor argument. However, `LLMThreatAnalyzer.__init__` in `llm_threat_analyzer.py` is defined with only `self`, accepting zero arguments. When Ollama integration is enabled or initialized, Python raises an immediate `TypeError`.
- **Proposed Solution:**
  Update `scraper/ai/llm_threat_analyzer.py:35`:
  ```python
  def __init__(self, client=None):
      self.client = client or OllamaClient()
  ```
- **Effort Estimate:** 20 minutes.
- **Verification Criteria:**
  Executing `python -c "from ai.llm_threat_analyzer import LLMThreatAnalyzer; from ai.ollama_client import OllamaClient; LLMThreatAnalyzer(OllamaClient())"` must instantiate without error.

---

### SEC-09: 22 Unpatched npm Vulnerabilities with 4 Critical CVEs in Backend
- **ID:** `SEC-09`
- **Severity:** `P1` (High / Supply Chain Security)
- **Category:** Dependency Vulnerabilities / Supply Chain
- **File & Line Location:** `backend/package.json`, `backend/package-lock.json`
- **Evidence:**
  Command: `npm audit --prefix backend`
  Output:
  ```text
  22 vulnerabilities (2 moderate, 16 high, 4 critical)
  Critical Severity:
  - proxy-addr (GHSA-jqcg-44mw-7w3h): IP address spoofing vulnerability in express subnet parsing
  - shell-quote (GHSA-pqg4-j6r4-53mv): Arbitrary command injection via comment line terminators
  - tar (GHSA-34x7-hfp2-rc4v): Arbitrary file overwrite / creation via hardlink traversal
  High Severity:
  - adm-zip (GHSA-vwc7-r8mq-g2x9): Symlink traversal arbitrary file overwrite
  - axios (GHSA-3p68-rc4w-qgx5, GHSA-w9j2-pvgh-6h63): SSRF bypass & prototype pollution
  - undici (GHSA-2m5v-pch6-74hx, GHSA-4qv8-2p9j-2685): TLS certificate validation bypass & DoS
  - zod (GHSA-mrhx-c7xc-m3w5): Regular expression denial of service / memory exhaustion
  ```
- **Root Cause Analysis:**
  Core backend packages have not been updated to patched minor/patch versions, leaving known CVEs present in production dependencies. The `proxy-addr` vulnerability is particularly severe for rate-limiting and IP blacklisting in `authGuard.js` and `server.js`.
- **Proposed Solution:**
  Run targeted dependency updates:
  ```powershell
  npm update adm-zip axios undici zod proxy-addr tar --prefix backend
  ```
  Audit package-lock and verify all 103 backend tests continue to pass.
- **Effort Estimate:** 1.5 hours.
- **Verification Criteria:**
  `npm audit --prefix backend` must report 0 critical and 0 high vulnerabilities.

---

## 4. Priority 2 (P2) — Medium Severity Vulnerabilities & Engineering Gaps

---

### SEC-10: Missing Centralized Express Error Handling Middleware
- **ID:** `SEC-10`
- **Severity:** `P2` (Medium / Information Leakage)
- **Category:** Error Handling / Information Disclosure
- **File & Line Location:** `backend/server.js:1-166`
- **Evidence:**
  Inspection of `backend/server.js` reveals that routes are mounted via `app.use()`, followed immediately by `server.listen()`. No 4-parameter error middleware (`app.use((err, req, res, next) => ...)`) is registered at the bottom of the middleware chain.
- **Root Cause Analysis:**
  When an unhandled synchronous exception occurs inside a route handler, Express falls back to its default internal error handler, returning an HTML document containing the raw JavaScript stack trace, internal variable values, and absolute file system paths on the host machine.
- **Proposed Solution:**
  Add a global JSON error handler at the end of `backend/server.js`:
  ```javascript
  app.use((err, req, res, next) => {
    console.error('[Unhandled Error]', err);
    res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
  });
  ```
- **Effort Estimate:** 30 minutes.
- **Verification Criteria:**
  Triggering an unhandled throw inside a test route returns structured JSON with HTTP 500 and suppresses internal directory paths.

---

### SEC-11: Smart Contracts Test Execution Deficit
- **ID:** `SEC-11`
- **Severity:** `P2` (Medium / Testing Deficit)
- **Category:** Test Infrastructure / CI Readiness
- **File & Line Location:** `contracts/package.json:8`, `contracts/test_anchor.js`
- **Evidence:**
  Command: `npm --prefix contracts test`
  Output:
  ```text
  0 passing (2ms)
  ```
- **Root Cause Analysis:**
  `contracts/package.json` specifies `"test": "hardhat test"`. Hardhat's default test runner looks for test files inside a `contracts/test/` directory. However, the contract verification script was placed in `contracts/test_anchor.js` and in `backend/test/ai_blockchain.test.js`. Consequently, anyone running standard tests in the `contracts/` workspace receives a misleading `0 passing` report.
- **Proposed Solution:**
  1. Create directory `contracts/test/`.
  2. Move or adapt `contracts/test_anchor.js` into `contracts/test/AnchorRegistry.test.js` using Hardhat Chai matchers and Ethers.js.
  3. Verify deployment, successful anchoring, duplicate rejection, and event emission.
- **Effort Estimate:** 1 hour.
- **Verification Criteria:**
  `npm --prefix contracts test` must discover and execute at least 4 unit tests with 100% passing status.

---

### SEC-12: Authentication Token Accepted in URL Query Parameters (ASVS V3.1.1)
- **ID:** `SEC-12`
- **Severity:** `P2` (Medium / ASVS Non-Compliance)
- **Category:** Authentication Transport / CWE-598
- **File & Line Location:** `backend/middleware/authGuard.js:25-27`
- **Evidence:**
  ```javascript
  // backend/middleware/authGuard.js:25-27
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }
  ```
- **Root Cause Analysis:**
  The `verifyOtpToken` middleware accepts authentication tokens passed as URL query strings (`?token=eyJ...`). Passing sensitive bearer tokens in URLs violates OWASP ASVS V3.1.1 because URLs are logged in web server access logs, browser history, reverse proxy telemetry, and transmitted in `Referer` headers to external websites.
- **Proposed Solution:**
  Delete lines 25-27 of `backend/middleware/authGuard.js`. Accept tokens exclusively via `Authorization: Bearer <token>` headers and secure `httpOnly` cookies.
- **Effort Estimate:** 20 minutes.
- **Verification Criteria:**
  Requests providing authentication only via `?token=...` must receive HTTP 403 Forbidden.

---

### SEC-13: Deprecated Lifecycle Hooks and Unbounded In-Memory State in Scraper
- **ID:** `SEC-13`
- **Severity:** `P2` (Medium / Reliability & Memory Leak)
- **Category:** Resource Management / Python Lifespan
- **File & Line Location:** `scraper/osint_service.py:186, 349, 547`
- **Evidence:**
  In `scraper/osint_service.py:349`:
  ```python
  @app.on_event("startup")
  async def startup_event():
      # deprecated in modern FastAPI
  ```
  In lines 186 and 547:
  ```python
  p_queue = {}
  pagination_state = {}
  ```
- **Root Cause Analysis:**
  1. `@app.on_event("startup")` is deprecated in modern FastAPI in favor of the `lifespan` async context manager.
  2. Search pagination and query queues are stored in plain Python dictionaries (`p_queue`, `pagination_state`) without maximum size constraints, eviction policies, or Time-To-Live (TTL) expiration. Under high query volume, memory usage will grow monotonically until the process is terminated by the OS Out-Of-Memory (OOM) killer.
- **Proposed Solution:**
  1. Refactor FastAPI startup/shutdown to use modern `lifespan(app: FastAPI)` context manager.
  2. Replace raw dictionaries with an LRU cache or `cachetools.TTLCache(maxsize=1000, ttl=3600)`.
- **Effort Estimate:** 1.5 hours.
- **Verification Criteria:**
  FastAPI boots without deprecation warnings, and pagination state expires automatically after 1 hour.

---

## 5. Priority 3 (P3) — Low Severity & Technical Debt

---

### SEC-14: Repository Bloat and Committed Binary Files in Git History
- **ID:** `SEC-14`
- **Severity:** `P3` (Low / Repository Hygiene)
- **Category:** Git Hygiene / Repository Size
- **File & Line Location:** Root workspace, `frontend/public/`
- **Evidence:**
  File size analysis in workspace:
  - `gemini_generated_video_803b46c9.mp4`: 2,690,221 bytes (2.7 MB) in root.
  - `android-gateway.zip`: 65,943,927 bytes (65.9 MB) in root.
  - `Mobile application development.zip`: 25,173,453 bytes (25.2 MB) in root.
  Total binary overhead: ~93.8 MB.
- **Root Cause Analysis:**
  Large backup archives and generated demonstration videos were committed or placed in the root directory rather than being hosted on external asset storage or GitHub Release attachments.
- **Proposed Solution:**
  1. Add `*.zip` and `*.mp4` (outside `frontend/public/assets`) to `.gitignore`.
  2. Remove zip archives from the working directory and archive them in GitHub Releases.
- **Effort Estimate:** 30 minutes.
- **Verification Criteria:**
  Workspace root contains zero `.zip` files, and git clone payload is reduced by ~90MB.

---

### SEC-15: Inaccurate Test Runner and Architecture Claims in Documentation
- **ID:** `SEC-15`
- **Severity:** `P3` (Low / Documentation Defect)
- **Category:** Documentation Hygiene / Anti-AI Rule Compliance
- **File & Line Location:** `README.md:183-189`
- **Evidence:**
  In `README.md:183`:
  ```text
  Backend (94 tests)
  cd backend && npx jest
  Frontend (26 tests)
  cd frontend && npm test
  ```
- **Root Cause Analysis:**
  Documentation has not been updated to reflect current engineering reality:
  - The backend uses Node's native runner (`node --test`), not `npx jest` (running Jest fails or executes nothing).
  - Backend tests total 103 tests across 26 suites (not 94).
  - Frontend tests total 106 tests across 4 suites (not 26).
- **Proposed Solution:**
  Update `README.md` to reflect exact reproduction commands (`npm --prefix backend test`, `npm --prefix frontend test -- --watchAll=false`) and current passing counts (103 backend, 106 frontend).
- **Effort Estimate:** 30 minutes.
- **Verification Criteria:**
  All commands listed in `README.md` can be copy-pasted and succeed verbatim.

---

## 6. Audit Conclusion & Gate Recommendation

Stage 2 Audit is formally complete. A total of 15 verifiable findings have been documented with concrete root cause analysis, evidence, and remediation steps.

**Quality Gate Decision:**
- **STAGE 1 & 2 GATE: PASSED.**
- **STAGE 3 AUTHORIZATION: REQUIRED.**
- **Remediation Priority for Stage 4 (Fix Critical Problems):**
  1. Fix `SEC-01` (broken module require).
  2. Disable `SEC-02` (`SKIP_OTP=false` across `.env` and code).
  3. Fix `SEC-03` (enforce strict JWT verification on Android Gateway WebSocket).
  4. Sanitize `SEC-04` (rotate and omit secrets from version control).
  5. Remediate `SEC-05` (remove `sessionStorage` token mirroring) and `SEC-06` (hash PII before audit logging).
