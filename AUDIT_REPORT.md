# Code-Health & Security Audit Report: OSINT-BreachShield

**Date:** November 14, 2026  
**Auditor:** Senior Security & Systems Engineer (Automated Code-Health Review)  
**Target Repository:** `c:\Users\prem\OSINT-breach-Finder-main` (Branch: `main`)  
**Audit Scope:** Read-only repository inspection, static analysis tooling execution, runtime lifecycle verification, dependency vulnerability scanning, and code-health audit. Zero source files were modified, reformatted, or deleted during this evaluation.

---

## 1. Executive Summary

OSINT-BreachShield presents a sophisticated, multi-tiered architecture (React frontend, Express 5 API gateway, Python FastAPI threat intelligence engine, EVM Merkle batch anchoring, and Android SMS gateway), supported by high unit-test coverage (98 passing Node.js tests, 73 passing React tests). However, the codebase bears heavy scars from fragmented AI generation across separate sessions, resulting in critical lifecycle misconfigurations, orphaned modules, and security gaps. The most critical flaw is an architectural bootstrap disconnect where `backend/index.js` bypasses `server.js`'s contract deployment verification and Merkle crash-recovery hooks, silently breaking blockchain anchoring guarantees in normal runs. Furthermore, client-side mirroring of JWTs into `sessionStorage` undermines the backend's `httpOnly` cookie protection, the Ollama LLM integration is disabled and returns hardcoded HTTP 503s despite documentation claims, and unpinned HuggingFace remote model loads expose the Python subsystem to supply chain tampering. Overall codebase health is **Grade C+ (Functionally capable, architecturally fractured, requiring rigorous lifecycle and dependency hardening).**

---

## 2. Repository Map: What Runs vs. What Does Not

```
OSINT-BreachShield/
├── run_servers.py                  [RUNS] Monorepo process manager (starts Hardhat, Express, FastAPI, React)
├── backend/                        [RUNS] Node.js Express 5.1.0 API Gateway & Auth Service
│   ├── index.js                    [RUNS] Default npm/runner entry point (bypasses server.js hooks)
│   ├── server.js                   [RUNS] Core Express app, middleware, routes, WebSocket server
│   ├── database/                   [RUNS] Dual storage engine (MySQL pool + JSON flat-file fallback)
│   ├── routes/                     [RUNS] Modular route handlers (auth, alerts, admin, health, etc.)
│   ├── services/
│   │   ├── merkleBatcher.js        [RUNS] Accumulates hashes, builds Merkle trees, posts to EVM
│   │   ├── contractService.js      [PARTIALLY BYPASSED] AnchorRegistry caller (bypassed on startup)
│   │   ├── breachSources/          [RUNS] Modular source adapters (HIBP, Telegram, etc.)
│   │   └── riskEngine.js           [RUNS] Dynamic scoring & exposure calculations
│   └── test/                       [RUNS] 98 automated unit/integration tests (all passing)
├── scraper/                        [PARTIALLY RUNS] Python 3.13 FastAPI Microservice & ML Engine
│   ├── osint_service.py            [RUNS] FastAPI service (port 8000), Telethon scraper
│   ├── login_telegram.py           [RUNS] Interactive CLI utility for Telethon MTProto auth
│   ├── ai/
│   │   ├── feature_extractor.py    [RUNS] 20-feature URL lexer and entropy calculator
│   │   ├── phishing_classifier.py  [RUNS] PyTorch/BERT classifier (unpinned model repo)
│   │   ├── xgboost_model.py        [RUNS] Tabular breach severity predictor
│   │   ├── cnn_model.py            [STANDALONE] PyTorch 1D-CNN (imported in eval, not FastAPI)
│   │   ├── rnn_model.py            [STANDALONE] PyTorch BiLSTM (imported in eval, not FastAPI)
│   │   ├── transformer_model.py    [STANDALONE] PyTorch Transformer (imported in eval, not FastAPI)
│   │   ├── severity_classifier.py  [DEAD CODE] Legacy mock/stub classifier; unreferenced
│   │   ├── ollama_client.py        [DISABLED] LLM client; deactivated by LLM_ACTIVE = False
│   │   └── data/                   [OFFLINE] Training, evaluation, and dataset generation scripts
│   └── test_*.py                   [BROKEN] Pytest fails at collection (missing torch/telethon mocks)
├── frontend/                       [RUNS] React 19 Single Page Application (Create React App)
│   ├── src/
│   │   ├── App.jsx                 [RUNS] Client router, theme providers, dashboard layout
│   │   ├── services/api.js         [RUNS] Axios client (reads token from sessionStorage)
│   │   ├── pages/                  [RUNS] 12 dashboard views (BreachLookup, Alerts, Merkle, etc.)
│   │   └── components/             [RUNS] Cyberpunk/glassmorphism UI component library
│   └── src/**/__tests__/           [RUNS] 73 tests pass, but 146 ESLint testing-library rule violations
├── contracts/                      [RUNS] Solidity 0.8.28 Smart Contracts & Hardhat Testbed
│   ├── contracts/
│   │   └── AnchorRegistry.sol      [RUNS] Merkle root notary contract with replay protection
│   ├── scripts/deploy.js           [RUNS] Hardhat deployment script creating deployment.json
│   └── test/AnchorRegistry.test.js [RUNS] 17 Hardhat/Ethers unit tests
├── android-gateway/                [INDEPENDENT] Native Android Kotlin SMS Gateway
│   ├── app/src/main/java/...       [STANDALONE] Foreground service, WakeLock, SmsManager multipart
│   └── build.gradle.kts            [STANDALONE] Gradle build system (compiled separately)
└── docs/                           [DOCUMENTATION & ARTIFACTS]
    ├── RESULTS.md, ARCHITECTURE.md [DOCS] Architectural blueprints and evaluation metrics
    └── gemini_generated_*.mp4      [BLOAT] 25MB video file committed directly to git root
```

---

## 3. Static Tool Results Summary

All tools were executed inside an isolated virtual environment (`$env:TEMP\audit_venv`) or using native package runner binaries without modifying repository configs or manifests.

| Tool | Target | Status | Issues Found | Primary Violation Categories |
| :--- | :--- | :--- | :--- | :--- |
| **Ruff** (v0.9.x) | `scraper/`, `run_servers.py` | Ran successfully | **229 violations** | Bare `except Exception:` passes, unused imports (`F401`), unused variables (`F841`), import sorting (`I001`), `None` comparisons (`E711`). |
| **Flake8** (v7.1.x) | `scraper/`, `run_servers.py` | Ran successfully | **260 violations** | E722 (bare except), E402 (imports not at top of file), F401 (unused imports), W293 (trailing whitespace). |
| **Bandit** (v1.8.x) | `scraper/` | Ran successfully | **55 issues** (5 Medium, 50 Low) | **Medium:** B310 (audit `urllib.request.urlopen` for dangerous schemes in `ollama_client.py`), B615 (unpinned HuggingFace model download in `phishing_classifier.py`). **Low:** B101 (`assert` used in non-test scripts). |
| **Mypy** (v1.15.x) | `scraper/` | Ran successfully | **23 errors** across 5 files | Missing type annotations (`var-annotated`), incompatible parameter defaults (`ollama_client.py`), unsafe `None` attribute access on Telethon client (`union-attr` in `osint_service.py`). |
| **Deptry** (v0.23.x) | `scraper/` | Ran successfully | **13 dependency issues** | Missing requirements definitions (`sklearn` vs `scikit-learn`, `dotenv` vs `python-dotenv`, `pydantic`, `pytest`). Unused top-level dependency (`gunicorn`). |
| **Vulture** (v2.14.x) | `scraper/` | Ran successfully | **~35 dead code items** | Unused class `SeverityClassifier`, unused loss variables in training scripts, unused endpoints in `osint_service.py`. |
| **Backend Tests** (`node --test`) | `backend/test/*.js` | Ran successfully | **0 failures** (98/98 passed) | Admin routes, auth lockout, challenger k-anonymity, risk engine, stress testing. |
| **Frontend Tests** (`npm test`) | `frontend/src` | Ran successfully | **0 failures** (73/73 passed) | 18 test suites passing. |
| **ESLint** (v8.x) | `frontend/src` | Ran successfully | **146 problems** | 100% confined to test files: `no-container`, `no-node-access`, `no-wait-for-multiple-assertions` (Testing Library). Production code: 0 errors. |
| **npm audit (Backend)** | `backend/` | Ran successfully | **22 vulnerabilities** | **4 Critical**, **16 High**, **2 Moderate**. Critical CVEs in `adm-zip` (zip-slip/arbitrary file overwrite), High in `undici`, `axios`, `zod`, `tar`. |
| **npm audit (Frontend)** | `frontend/` | Ran successfully | **146 vulnerabilities** | Outdated transitive dependencies locked to `react-scripts 5.0.1` (`webpack-dev-server`, `browserslist`, `nth-check`). |
| **Pytest** (v9.2.x) | `scraper/` | **Failed at collection** | **2 Collection Errors** | `ModuleNotFoundError: No module named 'torch'` and `'telethon'`. Tests cannot run in standard Python environments without heavyweight dependencies. |

---

## 4. Comprehensive Findings Table

| ID | Category | Severity | Status | Location | Description | Suggested Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BS-001** | Architecture / Bug | **Critical** | **VERIFIED** | `backend/server.js:134-149`, `backend/index.js:1-12` | In `server.js`, `ensureContractDeployed()` and `recoverPendingBatches()` are guarded by `if (require.main === module)`. However, `backend/index.js` (and `run_servers.py`) imports `server.js` and calls `server.listen` directly. Consequently, **blockchain contract verification and unanchored Merkle batch crash recovery are completely bypassed in standard production runs.** | Move `ensureContractDeployed()` and `recoverPendingBatches()` into an exported async bootstrap function called by both `index.js` and `server.js` before accepting inbound traffic. |
| **BS-002** | Security / Auth | **High** | **VERIFIED** | `frontend/src/pages/VerifyOtpPage.jsx:87-88`, `frontend/src/services/api.js:18` | Backend implements secure `httpOnly` cookies (`server.js:46`), but frontend explicitly mirrors the JWT into client storage via `sessionStorage.setItem('osint_token', res.data.token)` and injects it into `Authorization: Bearer` headers. This negates `httpOnly` XSS mitigation. | Remove `sessionStorage.setItem` and Bearer token header injection. Rely exclusively on `credentials: 'include'` and `withCredentials: true` via the `httpOnly` cookie. |
| **BS-003** | Supply Chain Security | **High** | **VERIFIED** | `scraper/ai/phishing_classifier.py:44-46` | Remote Hugging Face model `ealvaradob/bert-finetuned-phishing` is loaded via `from_pretrained()` without specifying a commit hash (`revision="<hash>"`). Exposes the service to silent remote supply chain tampering or breaking model updates (Bandit B615). | Pin the exact Git commit SHA in `from_pretrained(self.model_repo, revision="...")` and verify model weight checksums. |
| **BS-004** | Vulnerability / Deps | **High** | **VERIFIED** | `backend/package.json:18-35` | `npm audit` reveals 22 vulnerabilities in backend dependencies, including Critical CVEs in `adm-zip` (v0.5.10 - arbitrary file overwrite via directory traversal) and High CVEs in `undici`, `axios`, and `zod`. | Run `npm audit fix` and selectively bump `adm-zip` to `>=0.5.16`, `axios` to `>=1.7.4`, and `undici` to `>=6.19.8`. |
| **BS-005** | Security / SSRF | **Medium** | **VERIFIED** | `scraper/ai/ollama_client.py:41, 60, 97` | `urllib.request.urlopen` is invoked directly on user-configurable or environment-derived URLs without URI scheme validation or target IP pinning (Bandit B310). | Replace `urllib.request` with `httpx` (already in `requirements.txt`), enforce `http://127.0.0.1` or `localhost` restriction, and validate target hostname. |
| **BS-006** | Incomplete Work | **Medium** | **VERIFIED** | `scraper/osint_service.py:69-71, 125-145` | `LLM_ACTIVE = False`. Endpoints `/api/ai/analyze-text`, `/api/ai/explain-phishing`, and `/api/ai/extract-entities` return hardcoded HTTP 503 (`{"success": false, "error": "LLM module is disabled"}`). Documentation and presentation slides state active LLM capabilities. | Either complete local Ollama fallback / Docker compose service, or deprecate and remove the dead endpoints and update docs to reflect actual status. |
| **BS-007** | Dead Code / Stubs | **Medium** | **VERIFIED** | `scraper/ai/severity_classifier.py:6-73` | Defines `SeverityClassifier` with hardcoded fallback heuristic dictionaries (`DUMMY_WEIGHTS`) and stubbed methods (`predict_proba`, `explain_prediction`). This class is never imported or used by `osint_service.py` or the frontend. | Delete `scraper/ai/severity_classifier.py` and consolidate severity logic into `xgboost_model.py`. |
| **BS-008** | Broken Code / Tests | **Medium** | **VERIFIED** | `scraper/test_ai_engine.py:1-40`, `scraper/test_scraper_resilience.py:1-35` | Running `pytest scraper` fails immediately at collection time with `ModuleNotFoundError: No module named 'torch'` and `'telethon'`. The tests do not mock external frameworks, preventing automated CI testing. | Introduce `unittest.mock` fixtures or test dependencies in `scraper/requirements-dev.txt` so tests can run in lightweight headless CI environments. |
| **BS-009** | Code Hygiene / ESLint | **Low** | **VERIFIED** | `frontend/src/FingerprintIntroAndLanding.test.js`, `frontend/src/AdversarialFrontend.test.js`, `frontend/src/App.test.js` | 146 ESLint errors in frontend tests violating Testing Library rules: `testing-library/no-container`, `testing-library/no-node-access`, and `testing-library/no-wait-for-multiple-assertions`. | Refactor test assertions to use standard React Testing Library `screen.getByRole` / `screen.getByText` queries rather than direct DOM `container.querySelector` access. |
| **BS-010** | Error Handling / Python | **Low** | **VERIFIED** | `scraper/osint_service.py:34, 49, 102, 114, 188`, `run_servers.py:27, 45` | Multiple instances of blind `except Exception: pass` and bare `except:` statements masking critical network, filesystem, and subprocess failures. | Replace bare excepts with specific exception types (`ConnectionError`, `FileNotFoundError`, `subprocess.CalledProcessError`) and log stack traces. |
| **BS-011** | Repo Hygiene / Bloat | **Low** | **VERIFIED** | `gemini_generated_video_803b46c9.mp4` (~25MB), `data/processed/*.pt` (local) | Large demo video file committed directly to Git root history. In addition, 5 PyTorch checkpoint files (`*.pt`, ~45MB each) reside unversioned in `data/processed/`. | Move video demo to external cloud storage or GitHub release assets. Add `.mp4` to `.gitignore`. Document model artifact retrieval via DVC or Hugging Face. |
| **BS-012** | Secret Hygiene / Fallback | **Low** | **VERIFIED** | `backend/server.js:48` | Fallback session secret `process.env.SESSION_SECRET || 'dev_secret_fallback_do_not_use_in_prod'` allows the application to boot in an insecure state if `.env` is omitted. | Throw a fatal error on boot if `NODE_ENV === 'production'` and `SESSION_SECRET` or `JWT_SECRET` is unset or matches known development fallbacks. |

---

## 5. Half-Finished Work Inventory

1. **Smart Contract Deployment & Merkle Crash Recovery (`backend/server.js` vs `backend/index.js`):**
   - **What was started:** Robust startup verification functions `ensureContractDeployed()` and `recoverPendingBatches()` were implemented in `server.js` (lines 134-149) to verify Hardhat chain connectivity, deploy `AnchorRegistry.sol` if missing, write contract artifacts, and replay unanchored Merkle batches.
   - **What is missing:** The standard entrypoint `backend/index.js` imports `server` from `server.js` but does not invoke these startup routines. In real-world operation, unless `node server.js` is called directly, this entire lifecycle subsystem sits dormant.
2. **Ollama Threat Intelligence Integration (`scraper/ai/ollama_client.py`):**
   - **What was started:** A client class `OllamaClient` was built with prompt templates for breach explanation and phishing threat narrative generation.
   - **What is missing:** It was disabled at line 70 of `scraper/osint_service.py` (`LLM_ACTIVE = False`) due to local latency and memory constraints. The service endpoints return HTTP 503 stubs. The module lacks streaming support, timeouts, and circuit-breaker fallbacks.
3. **Deep Learning Model Deployment in Production API (`scraper/ai/`):**
   - **What was started:** Sophisticated 1D-CNN, BiLSTM, and Transformer neural network architectures were designed and trained offline on HIBP breach data (`cnn_model.py`, `rnn_model.py`, `transformer_model.py`).
   - **What is missing:** Neither `osint_service.py` nor `server.js` exposes inference endpoints for these neural models. Only the Hugging Face BERT phishing classifier and XGBoost breach classifier are wired into active routes; the PyTorch sequence models remain standalone evaluation scripts.
4. **Hudson Rock Infostealer Intelligence Source:**
   - **What was started:** Listed across project READMEs and documentation as a planned OSINT adapter alongside HIBP.
   - **What is missing:** No adapter, API client, or scraping module exists anywhere in `backend/services/breachSources/` or `scraper/`.
5. **Vercel / Cloud Native Deployment Configuration:**
   - **What was started:** Claimed in deployment docs that the frontend is deployable to Vercel.
   - **What is missing:** No `vercel.json`, rewrite rules, or serverless API proxies exist. Because the backend relies on an active WebSocket server (`ws://`) and local filesystem persistence (`instance/` and `data/`), running it on standard serverless tiers is currently impossible without refactoring.

---

## 6. Dead Code & Dependency Removal Candidates

### A. Dead / Stale Code Candidates

| Candidate File / Symbol | Location | Status | Confidence | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `SeverityClassifier` class | `scraper/ai/severity_classifier.py:6-73` | Dead Code | **High (99%)** | Never imported across the entire codebase. Contains dummy heuristic weights and mock returns. Production routes use `XGBoostBreachClassifier`. |
| Disabled LLM Endpoints | `scraper/osint_service.py:125-145` | Dead Code | **High (95%)** | Endpoints `/api/ai/analyze-text`, `/api/ai/explain-phishing`, `/api/ai/extract-entities` return static 503 errors and cannot be activated without editing source code. |
| In-memory `p_queue` & `pagination_state` leaks | `scraper/osint_service.py:186, 547` | Stale Code | **Medium (80%)** | Unbounded global dictionaries storing Telegram pagination state in process memory without TTL eviction or cleanup. |
| Test Reference Scripts | `backend/package.json:9` | Stale Config | **High (95%)** | `npm test` runs `node --test test/*.js`. Standalone test files like `test-merkle.js` or manual stress scripts in repo root can be consolidated into the main test directory. |

### B. Dependency Pruning Candidates

| Ecosystem | Package | Status | Recommendation |
| :--- | :--- | :--- | :--- |
| **Python (`scraper`)** | `gunicorn` | Unused | Remove from `scraper/requirements.txt` (FastAPI is served via `uvicorn`). |
| **Python (`scraper`)** | `python-dotenv` | Misnamed in deptry | Keep in `requirements.txt`, but normalize import convention. |
| **Python (`scraper`)** | `scikit-learn` | Misnamed in deptry | Keep in `requirements.txt`, required for `xgboost_model.py` and feature extraction. |
| **Python (`scraper`)** | `pydantic` | Missing top-level | Add explicit `pydantic>=2.0` to `scraper/requirements.txt`. |
| **Python (`scraper`)** | `pytest` | Missing dev-dep | Add `pytest` to a new `scraper/requirements-dev.txt`. |
| **Node.js (`backend`)** | `adm-zip` | Vulnerable / Critical | Upgrade to `>=0.5.16` or replace with native Node.js stream decompression. |

---

## 7. Security-Relevant Findings (Ordered by Severity)

### [CRITICAL] BS-001: Blockchain Merkle Batch Recovery Bypassed on Normal Server Boot
- **Location:** `backend/server.js:134-149`, `backend/index.js:1-12`
- **Impact:** An attacker who induces a server crash or network disconnect can leave pending Merkle breach audit batches unanchored permanently. Because `index.js` fails to execute `recoverPendingBatches()`, the tamper-evident Merkle ledger guarantee is broken upon reboot.
- **Evidence:**
  ```javascript
  // backend/server.js:134-138
  if (require.main === module) {
    server.listen(PORT, async () => {
      logger.info(`OSINT Breach Finder running on port ${PORT}`);
      await ensureContractDeployed();
      await recoverPendingBatches();
    });
  }
  // backend/index.js:8-11 (Actual entrypoint called by run_servers.py)
  server.listen(PORT, () => {
    console.log(`OSINT Breach Finder running on port ${PORT}`);
  }); // Startup hooks are omitted!
  ```

### [HIGH] BS-002: Client-Side JWT Mirroring in `sessionStorage` Negates `httpOnly` Protection
- **Location:** `frontend/src/pages/VerifyOtpPage.jsx:87-88`, `frontend/src/services/api.js:18`
- **Impact:** While the backend correctly dispatches an `httpOnly`, `SameSite=Strict` cookie, the frontend captures the raw token from the HTTP response body and writes it to browser `sessionStorage`. Any third-party script, injected ad, or XSS vector can steal the JWT via `sessionStorage.getItem('osint_token')`.
- **Evidence:**
  ```javascript
  // frontend/src/pages/VerifyOtpPage.jsx:87-88
  if (res.data.token) {
    sessionStorage.setItem('osint_token', res.data.token);
  }
  // frontend/src/services/api.js:18
  const token = sessionStorage.getItem('osint_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  ```

### [HIGH] BS-003: Unpinned Hugging Face Model Ingestion via Untrusted Remote Namespace
- **Location:** `scraper/ai/phishing_classifier.py:44-46`
- **Impact:** Model weights and tokenizer configurations are pulled dynamically from Hugging Face (`ealvaradob/bert-finetuned-phishing`) without commit pinning or SHA-256 verification. If the third-party Hugging Face account is compromised, malicious serialized payloads could be executed during model loading.
- **Evidence:**
  ```python
  # scraper/ai/phishing_classifier.py:44-46
  self.tokenizer = AutoTokenizer.from_pretrained(self.model_repo)
  self.model = AutoModelForSequenceClassification.from_pretrained(self.model_repo)
  ```

### [HIGH] BS-004: Critical Remote Code Execution & Traversal CVEs in Backend Dependencies
- **Location:** `backend/package.json` (`npm audit`)
- **Impact:** `adm-zip` (v0.5.10) contains known path traversal vulnerabilities (Zip Slip) allowing arbitrary file overwrites if untrusted zip archives are decompressed. Additional High vulnerabilities in `axios` and `undici` allow HTTP request smuggling and DoS.

### [MEDIUM] BS-005: Unvalidated URL Ingestion in Local Ollama Client (SSRF)
- **Location:** `scraper/ai/ollama_client.py:41, 60, 97`
- **Impact:** Direct use of `urllib.request.urlopen` against URLs constructed from environment or input variables without schema validation triggers Bandit B310 and could facilitate internal port scanning if the client is re-enabled.

### [LOW] BS-012: Insecure Fallback Session & JWT Secret Defaults
- **Location:** `backend/server.js:48`
- **Impact:** `const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_fallback_do_not_use_in_prod';` allows deployments without configured environment variables to sign session state with a universally known string.

---

## 8. Proposed Step-by-Step Cleanup Plan

To prevent regression and maintain clean reviewable diffs, cleanups should be executed across 5 focused branch PRs:

### Task 1: Fix Server Bootstrap & Merkle Recovery Lifecycle
- **Scope:** `backend/server.js`, `backend/index.js`
- **DO NOT TOUCH:** `backend/services/merkleBatcher.js`, `contracts/`
- **Actions:**
  1. Refactor `server.js` to export an `async function startServer(port)` that encapsulates `ensureContractDeployed()` and `recoverPendingBatches()`.
  2. Update `index.js` to await `startServer(PORT)`.
  3. Verify via `node --test backend/test/*.js` that existing tests continue to pass.
- **Definition of Done:** Running `node backend/index.js` logs contract deployment status and executes pending batch recovery on boot.

### Task 2: Purge Client-Side Token Mirroring & Enforce `httpOnly`
- **Scope:** `frontend/src/pages/VerifyOtpPage.jsx`, `frontend/src/pages/LoginPage.jsx`, `frontend/src/services/api.js`
- **DO NOT TOUCH:** `backend/routes/auth.js`
- **Actions:**
  1. Remove `sessionStorage.setItem('osint_token', ...)` and `sessionStorage.removeItem('osint_token')`.
  2. Configure `api.js` Axios instance with `withCredentials: true`.
  3. Rely exclusively on the `auth_token` cookie for authenticated requests.
- **Definition of Done:** `npm test` passes in `frontend/`, and manual login test confirms authentication functions without any token appearing in `sessionStorage` or `localStorage`.

### Task 3: Pin HuggingFace Model Revisions & Sanitize AI Client
- **Scope:** `scraper/ai/phishing_classifier.py`, `scraper/ai/ollama_client.py`
- **DO NOT TOUCH:** `scraper/ai/feature_extractor.py`, `scraper/osint_service.py`
- **Actions:**
  1. Add `revision="<commit-sha>"` to `from_pretrained` in `phishing_classifier.py`.
  2. Refactor `ollama_client.py` to use `httpx.AsyncClient` with restricted local URL verification.
  3. Run `bandit -r scraper` and verify 0 Medium/High warnings.
- **Definition of Done:** Bandit scan reports 0 findings on modified files.

### Task 4: Prune Dead Modules & Reorganize Python Dependencies
- **Scope:** `scraper/ai/severity_classifier.py`, `scraper/requirements.txt`, `scraper/requirements-dev.txt`
- **DO NOT TOUCH:** `scraper/ai/xgboost_model.py`
- **Actions:**
  1. Safely remove unused `scraper/ai/severity_classifier.py`.
  2. Remove `gunicorn` from `scraper/requirements.txt`. Add explicit `pydantic>=2.0`.
  3. Create `scraper/requirements-dev.txt` containing `pytest>=8.0`, `ruff`, `mypy`, `bandit`.
- **Definition of Done:** `deptry scraper --requirements-files scraper/requirements.txt` runs cleanly with 0 unused dependency errors.

### Task 5: Upgrade Vulnerable Node Dependencies & Fix Test Linting
- **Scope:** `backend/package.json`, `frontend/src/**/__tests__/*.js`
- **DO NOT TOUCH:** Production application code in `frontend/src/components/` or `backend/routes/`
- **Actions:**
  1. Run `npm update adm-zip undici axios` in `backend/`. Verify `npm audit` drops from 22 to 0 high/critical issues.
  2. Refactor frontend test files to replace `container.querySelector` with `screen.getByRole` / `screen.getByText`.
- **Definition of Done:** `npm audit` reports 0 high/critical vulnerabilities in `backend/`, and `npx eslint src` reports 0 errors in `frontend/`.

---

## 9. Recommended Guardrails & Quality Controls

### A. Pre-Commit Configuration (`.pre-commit-config.yaml`)
Create this file in the repo root to block broken code before commit:
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.9.9
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: check-added-large-files
        args: ['--maxkb=5000']
      - id: check-json
      - id: check-yaml
      - id: detect-private-key
```

### B. GitHub Actions Automated CI (`.github/workflows/ci.yml`)
```yaml
name: OSINT-BreachShield CI
on: [push, pull_request]
jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm --prefix backend ci
      - run: npm --prefix backend audit --audit-level=high
      - run: npm --prefix backend test
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm --prefix frontend ci
      - run: npm --prefix frontend test -- --watchAll=false
```

### C. AI Agent Rules (`.cursorrules` or `.gemini/rules.md`)
1. **Never write raw tokens to client storage:** Always use `httpOnly` cookies for session management.
2. **Never add bare excepts:** Catch specific exceptions in Python and Node.js; never use `except Exception: pass`.
3. **No unpinned ML dependencies:** Always specify explicit Git commit SHAs when downloading weights from Hugging Face.
4. **Preserve startup lifecycle hooks:** Ensure any startup verification hooks (`ensureContractDeployed`, database migrations) are executed by all entrypoints.
5. **No large binary commits:** Never commit videos, zip archives, or model checkpoints (`*.pt`, `*.bin`, `*.mp4`) directly into Git tracking.

---

## 10. Open Questions for System Maintainer

1. **Ollama Integration:** Is there a requirement to keep local LLM threat intelligence active on machines with local GPUs, or should the Ollama client and its 503 endpoints be cleanly removed in favor of lightweight deterministic rules?
2. **Repository Media Storage:** Can `gemini_generated_video_803b46c9.mp4` (~25MB) and the untracked `.zip` archives (`android-gateway.zip`, `Mobile application development.zip`) be migrated to GitHub Release Assets or external cloud buckets to reduce clone latency?
3. **PyTorch Model Checkpoints (`*.pt`):** Would you like to track the trained breach classification models (`cnn_best.pt`, `transformer_best.pt`, `rnn_fixed_best.pt`) using Git LFS or DVC, or host them as assets on Hugging Face Model Hub?
4. **Android Gateway Distribution:** Should the `android-gateway` project be separated into its own repository or remain a submodule within the monorepo?
