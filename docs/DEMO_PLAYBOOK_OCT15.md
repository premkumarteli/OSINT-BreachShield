# BreachShield — Demo Playbook & Finalization Roadmap (October 15, 2026)

**Target Demo Date:** October 15, 2026  
**Audience:** Guide (Prof. Sushma T.M), Dept. of ISE Evaluators / External Examiners (Acharya Institute of Technology)  
**Team Members:**
- **Premkumar Teli (1AY24IS407):** Frontend, System Integration & Lead Presenter
- **Arvind D H (1AY24IS400):** Express Backend & Blockchain Anchoring
- **Girishkumar N M (1AY24IS404):** ML Threat Engine & Python Microservices
- **Manoj (1AY24IS406):** Android Gateway & OSINT Scraper Feeds

---

## 1. System Health & Test Verification (Audited Oct 8)

All core components and automated test suites are **100% passing**:

| Test Suite | Tests Run | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Backend Unit & Stress Tests** | 103 | **PASS (103/103)** | Adversarial gating, rate-limiting, lockout, WebSocket, timeline |
| **Blockchain & Merkle Tests** | 10 | **PASS (10/10)** | Canonical JSON, SHA-256, Merkle proof, inclusion verification |
| **Audit Integrity Tests** | 3 | **PASS (3/3)** | Tamper-detection, unalterable ledger verification |
| **Frontend Contract Tests** | 50 | **PASS (50/50)** | k-Anonymity contract, route protection, adversarial UI |
| **Python ML Engine (pytest)** | 4 | **PASS (4/4)** | HuggingFace URL classifier, SentenceTransformer entity correlator |
| **Scraper Resilience Tests** | 5 | **PASS (5/5)** | Disconnect fallback, FloodWait handling, paywall handling, locks |
| **Total Test Verification** | **175** | **100% PASS** | **Zero broken builds or failing tests** |

---

## 2. 7-Day Countdown Roadmap (Oct 9 – Oct 15)

```text
[Oct 9: Day 1]  Code Freeze & Baseline Verification
       │
[Oct 10: Day 2] Golden Test Queries & Pre-cached Demo Data
       │
[Oct 11: Day 3] Presentation Slide Deck & Paper Alignment
       │
[Oct 12: Day 4] Team Role Allocation & Hand-off Rehearsal
       │
[Oct 13: Day 5] Full Technical Dry-Run (Under 12 Mins)
       │
[Oct 14: Day 6] Viva Defense Prep & Offline Fail-Safe Checklist
       │
[Oct 15: Day 7] DEMO DAY EXECUTION
```

### Day 1 (Oct 9) — Code Freeze & Baseline Verification
- **Goal:** Freeze all code changes to avoid introducing unexpected regressions.
- Verify that `python run_servers.py` boots all 4 services cleanly in one terminal:
  - Hardhat Local Node: `http://127.0.0.1:8545`
  - Python FastAPI Service: `http://127.0.0.1:8001`
  - Node.js Express Backend: `http://localhost:5000`
  - React Frontend App: `http://localhost:3000`
- Push all current commits to both remotes using `push_to_github.bat`.

### Day 2 (Oct 10) — Golden Demo Queries & Offline Cache
- **Goal:** Select 2-3 guaranteed demo inputs that showcase all system features.
- Pick a breach target that triggers high exposure and multiple categories (e.g. `victim@example.com` or pre-indexed phone target).
- Pick a clean target that demonstrates safe status ("No threat records detected").
- Pick a phishing URL for live classification:
  - Malicious URL: `http://paypa1-secure-login.tk/verify-account` (returns >65% PHISHING probability)
  - Safe URL: `https://www.google.com` (returns <40% SAFE)

### Day 3 (Oct 11) — Slide Deck & Documentation Polish
- Open `docs/academic/presentations/Project Phase -2 Presentation.pptx` and verify alignment:
  - Problem Statement & Architecture diagrams match current codebase.
  - Test counts updated: 175 passing tests across frontend, backend, ML, blockchain.
  - Phishing classifier model: `CrabInHoney/urlbert-tiny-v4-phishing-classifier` (89% accuracy).
  - Merkle audit trail: SHA-256 + Canonical JSON + AnchorRegistry.sol on Hardhat.
- Print or keep ready a PDF copy of `docs/paper/BreachShield_IEEE_Paper.pdf`.

### Day 4 (Oct 12) — Team Role Allocation & Transitions
- Rehearse speaker transitions between the 4 team members so the presentation flows seamlessly without awkward pauses.
- Practice exact screen switches (Slides → Browser UI → Hardhat/Backend Terminal → Swagger/Postman).

### Day 5 (Oct 13) — Live Timed Dry-Run
- Run the full presentation + demo with a 12-minute timer.
- Test both the happy path (smooth internet) and simulated offline path (disconnect Wi-Fi, verify in-memory fallback works).

### Day 6 (Oct 14) — Final Emergency Backups
- Record a crisp 4-minute screen recording with OBS or Windows Game Bar (`Win + Alt + R`) showing the live app working smoothly. Store it on a USB drive. If the college projector, laptop battery, or network glitches, you can immediately switch to the video.
- Charge laptops, pack HDMI adapters, test USB mouse.

### Day 7 (Oct 15) — Demo Day!
- Arrive 30 minutes early, test HDMI connection to the projector.
- Open terminal, start `python run_servers.py`, let the models pre-warm into RAM.

---

## 3. Minute-by-Minute Demo Script (10–12 Minutes)

### Phase 1: Context & Architecture (2 Mins) — Arvind & Prem
1. **The Hook:** "Traditional breach detectors require users to upload their sensitive passwords or emails in plaintext to centralized servers. BreachShield solves this with client-side k-anonymity privacy, AI threat intelligence, and an immutable blockchain audit ledger."
2. **Architecture Slide:** Point to the 4-tier microservice architecture: React SPA $\to$ Express Gateway $\to$ FastAPI AI Service $\to$ Hardhat EVM Chain.

### Phase 2: Live Search & Privacy Demonstration (3 Mins) — Premkumar
1. Open `http://localhost:3000`.
2. Show the clean futuristic cyberpunk UI.
3. Open Developer Tools (`F12` $\to$ **Network Tab**):
   - Enter an email (e.g., `victim@example.com`).
   - Click Search. Show the examiners that the browser **NEVER** transmitted `victim@example.com` or the full 64-character hash over the network.
   - Highlight the `/api/v1/range/:prefix` network call: only the first 5 characters (e.g., `015d8`) were sent.
   - Explain: *"This is $k$-Anonymity privacy by design. Even if our backend or network is compromised, the user's raw identity cannot be reverse-engineered."*
4. Show OTP verification: enter the 6-digit code (logged in backend terminal or sent to Gmail).

### Phase 3: Results, AI Risk Engine & Phishing Detector (3 Mins) — Girishkumar
1. On the Results Page, walk through:
   - **Risk Gauge:** 0-100 explainable multi-factor score (PII exposure, breach severity, recency).
   - **Breach Timeline:** Interactive chronological layout of historical breaches.
   - **AI Intelligence Cards:** Point out the phishing probability score computed by the HuggingFace transformer model.
2. Enter a suspicious URL (`http://paypa1-secure-login.tk/verify-account`):
   - Show the real-time inference result: "PHISHING (High Confidence)".
   - Explain lexical feature extraction (17 heuristic features) combined with BERT tokenization.

### Phase 4: Blockchain Forensic Audit Trail (2 Mins) — Arvind
1. Show that every verified breach investigation generates an immutable audit record.
2. Open terminal or `/api/ai/audit` endpoint:
   - Canonical JSON $\to$ SHA-256 hash.
   - Merkle root generated from batched leaves.
   - Smart contract transaction hash from `AnchorRegistry.sol` on the local Hardhat node (`http://127.0.0.1:8545`).
3. Emphasize: *"If an attacker tries to alter an investigation record in the database, the recalculated Merkle root will not match the on-chain anchor, immediately flagging data tampering."*

### Phase 5: Conclusion & Q&A Defense (2 Mins) — All
1. Conclude with summary of deliverables: 175 passing tests, IEEE conference paper formatted and ready, working full-stack implementation.
2. Invite questions from the examiners.

---

## 4. Viva / Examiner Q&A Defense Sheet

### Q1: "Why use k-anonymity? Why not just encrypt the email with AES or HTTPS?"
> **Answer:** "HTTPS protects data in transit, but the server still decrypts and sees the plaintext email in memory. If the server logs or database are subpoenaed or breached, user queries are exposed. With client-side $k$-anonymity (similar to Have I Been Pwned and Cloudflare), the server only ever receives a 5-character SHA-256 prefix representing thousands of possible hashes. The mathematical guarantee is that the server cannot determine which specific email was searched."

### Q2: "Why use a local Hardhat blockchain instead of Ethereum Mainnet or Polygon?"
> **Answer:** "As documented in our paper and `BLOCKCHAIN_NOTES.md`, running on Ethereum Mainnet incurs real gas fees ($5–$20 per transaction) and public testnets like Polygon Amoy suffer from faucet rate limits and node latency during demo evaluations. Hardhat provides a deterministic, EVM-equivalent environment running the exact same Solidity 0.8.20 bytecode and consensus validation without network cost or latency risks."

### Q3: "What ML model did you use for phishing detection, and why did you not deploy the neural RNN/Transformer models?"
> **Answer:** "For URL phishing classification, we deployed `CrabInHoney/urlbert-tiny-v4-phishing-classifier` which achieves 89% accuracy with low CPU inference latency (~50ms). For breach severity classification, as documented in our `RESULTS.md`, we trained XGBoost, CNN, BiLSTM, and Transformers. XGBoost scored 89.2% test accuracy (+42% over naive baseline), whereas deep neural models overfit due to dataset size constraints. We honestly document this architectural choice rather than claiming artificial deep learning deployment."

### Q4: "What happens if MySQL or Telegram is offline during production?"
> **Answer:** "The system implements resilient graceful degradation. If MySQL is offline, the backend automatically switches to `instance/users.json` in-memory fallback. If Telegram rate-limits or disconnects, the scraper serves cached demo packets with a 5-attempt FloodWait recovery lock, ensuring 100% service uptime."

---

## 5. Pre-Demo Morning Checklist (15 Oct)

- [ ] Laptops plugged in with AC power (do not rely on battery power to prevent CPU throttling).
- [ ] Terminal 1: run `python run_servers.py`.
- [ ] Wait for green confirmation:
  - `[OK] Local Hardhat Blockchain is READY on http://127.0.0.1:8545!`
  - `[OK] FastAPI (8001) is READY!`
  - `[OK] Node.js (5000) is READY!`
  - `[OK] React Frontend (3000) is READY!`
- [ ] Browser opened at `http://localhost:3000` with zoom set to 110% for projector visibility.
- [ ] Backup screen recording video loaded on Desktop or USB drive.
- [ ] Hard copy or PDF of presentation slides and IEEE paper ready on table.
