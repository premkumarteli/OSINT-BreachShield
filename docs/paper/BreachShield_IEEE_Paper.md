# BreachShield: AI Powered OSINT Breach Detection & Dark Web Protection

**Authors:**
- **Arvind D. H., Girishkumar N. M., Manoj, Premkumar Teli**  
  *Department of Information Science and Engineering, Acharya Institute of Technology, Bengaluru, India*
- **Sushma T. M.**  
  *Assistant Professor, Department of Information Science and Engineering, Acharya Institute of Technology, Bengaluru, India*

---

## Abstract
Breach notification and dark-web exposure intelligence platforms suffer from a fundamental privacy paradox: to determine whether personal credentials have been compromised, users must transmit those sensitive identifiers in plaintext to a third-party server, creating a centralized query-surveillance and correlation vector. This paper presents BreachShield, a privacy-preserving Open-Source Intelligence (OSINT) breach detection and threat assessment platform designed to resolve this tension through cryptographic query isolation, accountable gating, and verifiable audit logging. BreachShield combines a client-side $k$-anonymity range-query protocol (20-bit SHA-256 prefix partitioning) executed via the W3C Web Crypto API, a dual-channel out-of-band One-Time Password (OTP) identity gate, a pluggable OSINT source aggregation engine supporting live breach stores and Telegram scraping, an empirical machine-learning breach severity assessment framework, and a Merkle-tree batched audit trail anchored to an Ethereum Virtual Machine (EVM) smart contract. We define a comprehensive threat model spanning external eavesdroppers, malicious authenticated users, insider adversaries, and source-poisoning vectors, supported by formal security and privacy analyses that evaluate prefix leakage against Private Set Intersection (PSI) baselines. We report extensive functional evaluation across all pipeline subsystems and detail the experimental evaluation of a 165-dimensional gradient-boosted decision tree classifier (XGBoost, 89.2% test accuracy) benchmarked against deep learning architectures.

**Keywords:** Breach intelligence, $k$-anonymity, Open-Source Intelligence (OSINT), threat modeling, Merkle tree, blockchain audit log, XGBoost, query privacy.

---

## I. Introduction
The exponential expansion of digital identity surfaces and automated credential theft has precipitated widespread exfiltration of personal records onto dark-web marketplaces, underground paste sites, and public data dumps [1], [2]. Traditional compromise-checking services are fundamentally reactive and architecturally centralized. Users or corporate security teams seeking to determine credential exposure typically submit target queries—such as cleartext email addresses, employee identities, or telephone numbers—directly to centralized lookup services. This lookup process exposes users to third-party query tracking: the lookup provider learns precisely which identifier is being monitored, when the query occurred, and the requesting network location [3]. Consequently, querying for compromised status inadvertently creates a high-value surveillance vector.

To counteract query-exposure risks, partial prefix-matching constructions (commonly termed $k$-anonymity range queries) have been introduced [3], [4]. In these models, clients hash target identifiers locally and submit only a truncated cryptographic hash prefix. The lookup server returns all records matching that prefix bucket, leaving the final matching step to the client. While prefix disclosure prevents the server from deterministically identifying the requested record among bucket candidates, naive public range endpoints remain vulnerable to bulk enumeration and dictionary-scraping attacks. Malicious actors can traverse the finite prefix space ($16^d$ possibilities) to harvest complete compromised credential corpora.

Furthermore, multi-source OSINT threat ingestion introduces acute data integrity and operational reliability challenges [2]. Underground data sources, such as distributed Telegram dump channels, operate with erratic uptime, rate limits, and unauthenticated provenance. Once compromise intelligence is obtained, security administrators face the operational challenge of triaging threat severity: distinguishing between low-impact leaks (e.g., outdated usernames) and critical exposures (e.g., plaintext passwords correlated with national identity records). Finally, audit records generated during organizational investigations are vulnerable to retroactive manipulation or repudiation by privileged insiders unless backed by cryptographic integrity guarantees [5], [6].

This paper presents BreachShield, a privacy-preserving OSINT breach intelligence platform engineered to address query privacy, authenticated enumeration resistance, multi-source aggregation, severity triage, and audit integrity within a unified architecture. BreachShield implements an end-to-end operational pipeline combining client-side Web Crypto SHA-256 partitioning, an out-of-band carrier-compliant OTP authentication gate, concurrent OSINT source dispatching, heuristic and machine-learning threat scoring, and Merkle-tree batched EVM smart contract anchoring.

The contributions of this paper are:
1. **Privacy-Preserving Breach Intelligence Architecture:** A client-side $k$-anonymity range-query protocol that bounds query disclosure to 20 bits of entropy, performing local cryptographic partitioning via the W3C Web Crypto API prior to network transmission.
2. **Multi-Source OSINT Aggregation Framework:** An extensible asynchronous provider pipeline featuring concurrent dispatching, thread-safe Telegram scraper microservices with mutex-controlled SQLite session pooling, and automated failover data stores.
3. **OTP-Gated Authenticated Breach-Search Architecture:** An accountable access control gate utilizing cryptographically secure OTP issuance, bcrypt hashing, carrier-compliant telecom DLT SMS templating via an Android gateway, and cryptographic session-token binding that enforces identity match invariants.
4. **Tamper-Evident Audit Logging:** A deterministic audit logger using sorted-key canonical JSON leaf hashing, asynchronous batch buffering (100-record / 60-second window), Merkle tree generation, and EVM smart contract state anchoring.
5. **Experimental Machine-Learning Severity Assessment:** An empirical benchmark evaluating XGBoost against 1D-CNN, RNN, and Transformer architectures across 1,034 curated breach records on a 165-dimensional feature space, establishing structural criteria for tabular exposure triage.

---

## II. Threat Model

```
                    [Attacker A1: Network Sniffer] (Eavesdrop)
                                   |
                                   v
[Client Browser] ----Prefix P----> [API Gateway] ----Dispatched Query----> [OSINT Engine]
(Web Crypto API)                   (Express 5)                             (FastAPI / Telethon)
       ^                                 |                                          |
       | (Enum/Harvest)                  v (Bucket Query)                           v (Events)
[Attacker A2: Malicious User]      [Breach Store]                           [Audit Anchor]
                                   (MySQL 8 / JSON)                         (Merkle Batcher -> EVM)
                                         ^                                          ^
                                         | (Direct Read)                            | (Log Mutation)
                                   [Attacker A3: Insider]                   [Attacker A5: Tamperer]
```

### A. System Assets and Security Assumptions
The assets requiring protection within BreachShield include:
- **Target Identifier Privacy ($T$):** The plaintext identity (email address or phone number) queried by a user.
- **Credential Integrity:** The authoritative repository of breach metadata and suffix buckets.
- **Audit Log Verifiability:** The chronological record of compliance events and threat intelligence queries.
- **Authentication Credentials:** Ephemeral OTP codes, bcrypt password hashes, and JSON Web Tokens (JWT).

We assume all operational communication between browser clients, the API gateway, microservices, and external carriers occurs over TLS 1.3. Cryptographic primitives including SHA-256 and bcrypt are assumed computationally secure against preimage and collision attacks.

### B. Adversary Taxonomy and Capabilities
We define five adversarial classes categorized by vantage point and capabilities:
- **Attacker $\mathcal{A}_1$ (External Network Adversary):** Positions on the path between client and gateway; observes timing, packet volumes, and SNI metadata.
- **Attacker $\mathcal{A}_2$ (Authenticated Malicious User):** Completes OTP verification for identifier $T_A$ but attempts bucket harvesting, searching unauthorized identifiers $T_B \ne T_A$, or request flooding.
- **Attacker $\mathcal{A}_3$ (Malicious or Compromised Insider):** Possesses read access to backend storage and process memory; attempts correlation between client IPs, tokens, and prefixes to unmask targets.
- **Attacker $\mathcal{A}_4$ (Source-Poisoning Adversary):** Controls an upstream channel (e.g., rogue dump channel); injects deceptive records or DoS payloads.
- **Attacker $\mathcal{A}_5$ (Audit Log Adversary):** Privileged insider attempting to retroactively delete, truncate, reorder, or alter audit logs.

---

## III. System Architecture & Implementation

### A. Client-Side Anonymization Tier
Implemented in React 19. Plaintext targets $T$ are normalized locally by lowercasing and trimming whitespace. The normalized string is transformed into a 256-bit hash $H = \text{SHA-256}(T)$ using the browser's hardware-accelerated W3C Web Crypto API (`frontend/src/lib/kAnonymity.js`). $H$ is split into a 5-character (20-bit) prefix $P = H[0:5]$ and a 59-character (236-bit) suffix $S = H[5:64]$. The plaintext target $T$ and suffix $S$ never traverse the network during range querying.

### B. API Gateway & Session Gating
The gateway runs on Express 5 (`backend/server.js`), enforcing rate limiting, CORS restrictions, session validation, and breach source registry orchestration. Range queries are guarded by `verifyOtpToken` middleware. MySQL 8 serves as persistent storage, with an automatic JSON file fallback (`backend/auth/db.js`) on database disconnection.

### C. OSINT Ingestion Microservice
Dark-web dump tracking is handled by a Python FastAPI microservice using Telethon MTProto. Because SQLite session files incur file-lock collisions under concurrent async requests, the microservice serializes client access through an `asyncio.Lock` mutex with an 8.0-second timeout ceiling.

### D. Android Telecom Relay Gateway
For jurisdictions with strict telecom DLT mandates (e.g., India's TRAI regulations), automated cloud SMS gateways drop non-templated OTP payloads. BreachShield integrates a companion Android native client in Kotlin (`android-gateway/`). It maintains a persistent WebSocket connection to the gateway, transmitting pending OTPs via carrier hardware using pre-approved SMS header templates.

### E. Pluggable Source Registry
Breach sources implement an abstract contract:
$$\text{search}(\text{target}, \text{targetHash}) \to \mathcal{P}(\text{Record})$$
The registry dynamically loads four concrete adapters:
1. `PublicBreachSource`: Range queries against the local normalized breach database ($k$-anonymity store).
2. `TelegramScraperSource`: Dispatches queries to the FastAPI scraper microservice.
3. `PhishingFeedSource`: Scaffolding for domain reputation feeds.
4. `ThreatIntelSource`: Scaffolding for commercial threat intelligence feeds.

### F. Operational Risk-Scoring Engine
Computed dynamically by `riskEngine.js: analyzeExposure()`:
- National ID / Document exposure: up to 35 points.
- Password / hash material: up to 30 points.
- Physical address coordinates: up to 20 points.
- Phone numbers: up to 15 points.
- Multiple independent source mentions: up to 15 points.
- Shared identifier correlation across sources: up to 15 points.
- Live URL phishing classification probabilities: up to 30 points (grounded in [11]–[13]).

The raw score is floored at 20, capped at 100, and mapped to categorical tiers: `LOW` ($<40$), `MEDIUM` ($40$–$59$), `HIGH` ($60$–$79$), `CRITICAL` ($\ge 80$). Recency decay:
$$\omega_{\text{recency}} = \max\left(0.20, \; 1.0 - 0.10 \times (\Delta y)\right)$$

---

## IV. Privacy-Preserving Protocols

### A. Client-Side $k$-Anonymity Range Query
1. $T' \leftarrow \text{ToLower}(\text{Trim}(T))$
2. $H \leftarrow \text{WebCrypto.SHA-256}(T')$ (computed in-browser)
3. $P \leftarrow H[0:5]$ (20-bit prefix, 5 hex characters)
4. $S \leftarrow H[5:64]$ (236-bit suffix, 59 hex characters)
5. $B(P) \leftarrow \text{HTTP\_GET}(\text{"/api/v1/range/"} \parallel P, \text{Headers}=\{\text{Bearer } \tau\})$
6. Client filters $B(P)$ for $S_i == S$ locally.

With prefix length $d=5$, there are $16^5 = 1,048,576$ uniform buckets:
$$E[k] = \frac{N}{1,048,576}$$
$$I(H; P) \le \log_2(16^5) = 20 \text{ bits}$$
leaving 236 bits of suffix entropy undisclosed.

### B. OTP-Gated Accountable Search Protocol
1. **Issuance (`POST /api/auth/send-otp`):** 30s cooldown; 6-digit numeric code $C \in [100000, 999999]$ generated via `crypto.randomInt()`; salted bcrypt hash $h_C = \text{bcrypt}(C, 10)$ stored with 5-minute TTL; sent out-of-band via SMTP or Android DLT SMS gateway.
2. **Verification (`POST /api/auth/verify-otp`):** Hard limit $\le 5$ verification attempts; validated via `bcrypt.compare()`.
3. **Session Binding:** Issues signed JWT $\tau = \text{Sign}_{\text{HMAC-SHA256}}(\{T, \text{verified}: \text{true}\}, K_{\text{jwt}})$ with 1h expiration. Identity match invariant strictly enforced:
$$\text{normalize}(T_{\text{query}}) \equiv \text{normalize}(\tau.\text{target})$$

---

## V. Tamper-Evident Audit Logging & Blockchain Anchoring
Every security event is logged through a deterministic hash tree pipeline [5], [10] (`backend/blockchain/merkleBatcher.js`):
1. **Canonical JSON Serialization:** $e_i = \text{SHA-256}(\text{Canonicalize}(\text{Event}_i))$.
2. **Batch Window Triggers:** Flushed when $|Q| \ge 100$ or $t_{\text{now}} - t_{\text{last}} \ge 60\,\text{s}$.
3. **Merkle Aggregation:** Constructs a balanced binary hash tree yielding 32-byte root $R$.
4. **Smart Contract Anchoring:** Invokes `anchor(bytes32 root)` on `AnchorRegistry.sol`, storing $\text{Registry}[R] = \text{block.timestamp}$.

---

## VI. Experimental Machine Learning Evaluation

### A. Curated Breach Dataset
1,034 curated historical breach incidents partitioned 70/15/15:

| Split | Total | LOW | MEDIUM | HIGH | CRITICAL |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Train (70%) | 723 | 49 | 341 | 291 | 42 |
| Val (15%) | 154 | 10 | 73 | 62 | 9 |
| Test (15%) | 157 | 11 | 74 | 63 | 9 |

### B. Feature Space
165-dimensional feature vector:
- `DataClasses` multi-hot vector (163 dims)
- `PwnCount` log-scaled volume: $\log_{10}(\text{PwnCount} + 1)$ (1 dim)
- `IsVerified` binary indicator (1 dim)

### C. Comparative Benchmarks ($N=157$)

| Model Architecture | Accuracy | Macro F1 | Weighted F1 |
| :--- | :---: | :---: | :---: |
| Naive Baseline (Predict MED) | 47.1% | 16.0% | 30.2% |
| RNN (Packed + Clip Retrain) | 44.6% | 34.0% | 46.8% |
| Transformer (2L / 4H) | 48.4% | 42.9% | 50.8% |
| 1D-CNN ($k=3,4,5$) | 66.2% | 57.2% | 65.7% |
| **XGBoost** | **89.2%** | **83.2%** | **89.4%** |

#### Per-Class Performance (XGBoost vs Baselines)
- **XGBoost:** LOW (P: 64.3%, R: 81.8%, F1: 72.0%), MEDIUM (P: 90.7%, R: 91.9%, F1: 91.3%), HIGH (P: 94.9%, R: 88.9%, F1: 91.8%), CRITICAL (P: 77.8%, R: 77.8%, F1: 77.8%).
- **Confusion Matrix:** Of 17 misclassifications, 14 occurred between directly adjacent severity categories.

### D. Tabular Bias Analysis & Operational Pipeline Status
The superiority of XGBoost aligns with findings by Grinsztajn et al. (NeurIPS 2022) [8]. Unordered sparse categorical features lack temporal or spatial geometry, favoring tree-based axis-aligned decision partitions over deep attention mechanisms.

*Operational Clarification:* XGBoost serves as an offline research artifact due to feature availability constraints in raw OSINT text feeds. Inline search scoring utilizes the regex risk engine alongside the live `UrlBERT` classifier [11]–[13].

---

## VII. Security Analysis
- **Query Privacy ($\mathcal{A}_1$):** Reconstructing target $T$ from prefix $P$ requires inverting 236 bits of entropy, which is computationally infeasible.
- **Enumeration Resistance ($\mathcal{A}_2$):** Bounded by 401 Unauthorized for unauthenticated requests and token identity matching invariant $\text{SHA-256}(T_{\text{query}})[0:5] \equiv P_{\text{query}}$.
- **OTP Resilience:** 6-digit space ($9 \times 10^5$ codes), capped at $\le 5$ attempts ($P_{\text{guess}} \le 5.56 \times 10^{-6}$), bcrypt hashed ($cost=10$), 300s TTL, complying with NIST SP 800-63B [14].
- **Session Transport:** Signed HMAC-SHA256 JWTs complying with RFC 7519 [15], stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
- **Audit Non-Repudiation ($\mathcal{A}_5$):** Any leaf modification alters root $R' \ne R$, failing on-chain cryptographic verification.

---

## VIII. Privacy Analysis

### A. $k$-Anonymity & Distribution
For an enterprise repository with $N = 50,000,000$ records and $2^{20}$ uniform buckets, expected candidate bucket size $E[k] \approx 47.68$. The server cannot distinguish which of the candidate records was queried.

### B. Identity Linkage Trade-off
To prevent scraping, search requires verified OTP sessions. Hence, the server knows that user $T_{\text{auth}}$ performed a search, but does not know which candidate record matched locally. **Accountable enumeration resistance is explicitly prioritized over complete unlinkability.**

### C. Comparison with OPRF-Based Private Set Intersection (PSI)

| Dimension | Prefix $k$-Anonymity (BreachShield) | OPRF-Based Private Set Intersection (PSI) |
| :--- | :--- | :--- |
| **Client Computation** | 1 SHA-256 evaluation (Web Crypto API) | Multiple Elliptic Curve point multiplications |
| **Server Computation** | 1 Database B-Tree index lookup | 1 OPRF evaluation per candidate item |
| **Bandwidth Overhead** | Proportional to bucket size ($N / 16^5$) | $O(1)$ constant response size |
| **Prefix Disclosure** | 20 bits revealed ($I(H;P) \le 20$ bits) | 0 bits revealed (Cryptographically full privacy) |
| **Scraping Resistance** | Mandates out-of-band authenticated gating | Cryptographically bounded query evaluations |
| **Client Complexity** | Minimal (Native W3C Web Crypto browser API) | High (WebAssembly / BigInt finite-field crypto) |

---

## IX. Functional Evaluation
- **Authentication:** Rate limiting (30s cooldown, HTTP 429), bcrypt verification, target invariant mismatch rejection (HTTP 403) verified via `backend/test/auth_search.test.js`.
- **Range Query:** Prefix bucket routing and client suffix parsing verified.
- **Concurrency Control:** Telethon SQLite lock collisions eliminated via `asyncio.Lock` with 8.0s timeout boundary (`backend/test/challenger_backend.test.js`).
- **Audit Verification:** Canonical sorted JSON serialization, batching triggers (100 records / 60s), and Merkle proof verification validated (`backend/test/verify_audit_integrity.js`).
- **Smart Contract:** Hardhat local EVM deployment and `RootAnchored` event emissions verified (`contracts/test_anchor.js`).

---

## X. Limitations
1. **Severity Tier Imbalance:** The `CRITICAL` tier comprises 9 test samples (5.7%), yielding wider confidence bounds.
2. **Source Stubs:** `PhishingFeedSource` and `ThreatIntelSource` remain mock stubs in the current prototype.
3. **Local Blockchain:** Operates on local Hardhat EVM; public testnet deployment requires dynamic gas estimation.
4. **Decoupled ML:** XGBoost operates as an offline evaluation benchmark due to unstructured live OSINT formats.
5. **Session-Query Linkage:** Search gating links query transactions to verified user identities.

---

## XI. Future Work & Conclusion
Future work includes SMOTE-based class balancing [9] for the critical severity tier, live API connectors for external threat feeds, public EVM testnet deployment, and long-term exploration of OPRF-based PSI protocols.

BreachShield resolves the fundamental query-surveillance paradox of credential monitoring by uniting client-side $k$-anonymity range queries, carrier-compliant OTP gating, concurrent OSINT scraping, machine-learning risk evaluation, and Merkle-tree EVM smart contract anchoring.

---

## References
1. A. Aljofey, Q. Jiang, Q. Qu, M. Huang, and J.-P. Niyigena, "An effective phishing detection model based on character level convolutional neural network from URL," *Electronics*, vol. 9, no. 9, p. 1514, 2020.
2. P. Kühn, K. Wittorf, and C. Reuter, "Navigating the shadows: Manual and semi-automated evaluation of the dark web for cyber threat intelligence," *IEEE Access*, vol. 12, pp. 45112–45128, 2024.
3. L. Li, B. Pal, J. Ali, N. Sullivan, R. Chatterjee, and T. Ristenpart, "Protocols for checking compromised credentials," in *Proc. ACM SIGSAC Conf. Comput. Commun. Secur. (CCS)*, 2019, pp. 1387–1403.
4. L. Sweeney, "$k$-anonymity: A model for protecting privacy," *Int. J. Uncertainty, Fuzziness Knowl.-Based Syst.*, vol. 10, no. 5, pp. 557–570, 2002.
5. S. A. Crosby and D. S. Wallach, "Efficient data structures for tamper-evident logging," in *Proc. 18th USENIX Secur. Symp.*, 2009, pp. 317–334.
6. A. Arabnouri, S. Eissazadeh, and A. Shafieinejad, "A secure auditable log based on blockchain," *Monadi*, vol. 13, no. 2, pp. 75–86, 2024.
7. T. Chen and C. Guestrin, "XGBoost: A scalable tree boosting system," in *Proc. 22nd ACM SIGKDD Int. Conf. Knowl. Discov. Data Min.*, 2016, pp. 785–794.
8. L. Grinsztajn, E. Oyallon, and G. Varoquaux, "Why do tree-based models still outperform deep learning on typical tabular data?" in *Adv. Neural Inf. Process. Syst. (NeurIPS)*, vol. 35, 2022, pp. 507–520.
9. F. S. Alsubaei, A. A. Almazroi, and N. Ayub, "Enhancing phishing detection: A novel hybrid deep learning framework for cybercrime forensics," *IEEE Access*, vol. 12, pp. 8373–8389, 2024.
10. R. C. Merkle, "A digital signature based on a conventional encryption function," in *Adv. Cryptol. - CRYPTO '87*, Springer, 1988, pp. 369–378.
11. O. K. Sahingoz, E. Buber, and E. Kugu, "DEPHIDES: Deep learning based phishing detection system," *IEEE Access*, vol. 12, pp. 8052–8070, 2024.
12. B. V. Pavani, D. Mahitha, and B. Uma Maheswari, "Enhancing online safety: Phishing URL detection using machine learning and explainable AI," in *Proc. 15th Int. Conf. Comput., Commun. Netw. Technol. (ICCCNT)*, IEEE, 2024, pp. 1–6.
13. M. Tawfik, A. A. Abu-Ein, A. H. Abdelhaliem, Y. M. Al-Sharo, and I. S. Fathi, "Explainable few-shot learning with modern BERT for detecting emerging phishing attacks using XF-PhishBERT," *Sci. Rep.*, vol. 15, no. 1, p. 42821, 2025.
14. P. Grassi, M. Garcia, and J. Fenton, "Digital identity guidelines: Authentication and lifecycle management," NIST Special Publication 800-63B, Gaithersburg, MD, 2020.
15. M. Jones, J. Bradley, and N. Sakimura, "JSON Web Token (JWT)," RFC 7519, May 2015.
