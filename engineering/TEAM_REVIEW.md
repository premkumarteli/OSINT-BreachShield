# Multi-Role Engineering Conference Review (Stage 2)
**Date:** November 18, 2026 | **Context:** Stage 1 Discovery & Stage 2 Audit Review | **Standard:** MASTER PROMPT v2
1. **Tech Lead / Architect**: The 5-tier architecture is structurally coherent, but breaks at boundaries: Express `/api/ai` calls fail due to `/query` path concatenation (SEC-07), and contracts lack standard test organization (SEC-11).
2. **Product Owner**: Core value proposition is genuine (client k-anonymity and identity-gated search), but docs overpromise by claiming live HIBP API and Hudson Rock integrations that do not exist in code.
3. **Backend Engineer**: API test coverage is strong (103 passing tests), but `auth.js:486` contains a broken relative path `require('../middleware/authGuard')` crashing all 12 authenticated AI and audit endpoints (SEC-01).
4. **Database Engineer**: Dual storage architecture (MySQL 8.0 on port 3306 with JSON flat-file fallback) functions smoothly, but audit logs store raw unhashed PII in `blockchain_audit_logs.json` (SEC-06).
5. **Frontend / UX Engineer**: The cyberpunk UI is backed by 106 passing React tests, but `VerifyOtpPage.jsx` mirrors JWTs to `sessionStorage`, destroying the XSS protections of `httpOnly` cookies (SEC-05).
6. **Security Engineer**: Four P0 vulnerabilities invalidate production security: `SKIP_OTP=true` auth bypass (SEC-02), gateway WebSocket length $\ge 10$ bypass (SEC-03), plaintext secrets in `.env` (SEC-04), and crash on import (SEC-01).
7. **QA / SDET**: 228 automated tests pass across backend (103), frontend (106), scraper (9), and blockchain (10), but `contracts/` test suite finds 0 tests due to missing directory structure (SEC-11).
8. **DevOps / SRE**: `run_servers.py` orchestrates 4 processes well on Windows, but 22 npm dependencies carry vulnerabilities (4 critical CVEs in `backend/`) and git tracks 95MB of zip and video binaries (SEC-09, SEC-14).
9. **Code Reviewer**: Reject any production promotion until `SKIP_OTP` is eliminated, module import paths are corrected, and `authGuard.js` stops accepting auth tokens via URL query parameters (SEC-12).
10. **Tech Writer**: System claims must be aligned with reality: disclose that blockchain notarization is an ephemeral Hardhat testbed, XGBoost is not deployed on live search, and HIBP runs as a local offline replica.
**Consensus**: Gate approved for Stage 1 & 2 completion. Halt all code changes until the owner authorizes Stage 3 remediation of findings SEC-01 through SEC-15.
