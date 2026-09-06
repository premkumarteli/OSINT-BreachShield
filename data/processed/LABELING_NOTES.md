# LABELING_NOTES.md — Honest Assessment of This Dataset

## 1. Total Records After Fetching

**1,034 breach records** from the HIBP public breach catalog
(`haveibeenpwned.com/api/v3/breaches`), fetched 2026-09-05.

Raw snapshot saved to `data/raw/hibp_breaches_20260905.json` (never overwritten).

## 2. Final Class Distribution (4-class training scheme)

### Full dataset

| Class    | Count | %     |
|----------|-------|-------|
| LOW      | 70    | 6.8%  |
| MEDIUM   | 488   | 47.2% |
| HIGH     | 416   | 40.2% |
| CRITICAL | 60    | 5.8%  |

### Stratified split (70/15/15)

| Class    | Train | Val | Test |
|----------|-------|-----|------|
| LOW      | 49    | 10  | 11   |
| MEDIUM   | 341   | 73  | 74   |
| HIGH     | 291   | 62  | 63   |
| CRITICAL | 42    | 9   | 9    |

The split preserves the original class proportions. No split has zero
examples of any class.

## 3. History of Decisions (full timeline)

This section documents the decisions made during Phase 1, including
reversed decisions, so anyone reviewing this later understands the
full reasoning trail.

### Iteration 1: Initial labeling

- Used HIBP fields: PwnCount, DataClasses, IsSensitive, IsVerified
- IsSensitive scored +15 (adult/dating services = more severe)
- Data class cap: 60
- Default score for unlisted fields: 1
- Only 12 of 163 unique DataClasses had explicit scores
- Result: LOW=86, MEDIUM=560, HIGH=378, CRITICAL=10

### Iteration 2: IsSensitive removed

- **Decision:** Remove IsSensitive from score_context() entirely
- **Reason:** IsSensitive flags services where *being listed* is socially
  sensitive (adult/dating), not data severity. A medical clinic breach
  exposing health records is severe; a dating site breach exposing only
  emails is not. These are orthogonal concepts.
- **Effect:** 93 IsSensitive=True records lost +15 bonus, dropping down
  a bucket. CRITICAL dropped from 10 to 5.
- **Result:** LOW=101, MEDIUM=586, HIGH=342, CRITICAL=5

### Iteration 3: CRITICAL too small — merge attempted

- **Decision:** Merge HIGH+CRITICAL into SEVERE for training
- **Reason:** CRITICAL had only 5 records (0.5%). Stratified split gave
  train=2, val=2, test=1. No meaningful metric possible with 1 test
  example. Model cannot learn from 5 examples.
- **Result:** LOW=101, MEDIUM=586, SEVERE=347 (3-class scheme)
- **Inference rules:** Score >= 76 OR (Credit cards AND score >= 60) -> CRITICAL
- **Threshold derivation:** Verified against the 5 known CRITICAL examples,
  not independently validated. Documented as such.

### Iteration 4: DATA_CLASS_SCORES fix — CRITICAL grows to 60

- **Decision:** Fix the 154 DataClasses hitting default score of 1
- **Reason:** Special-category fields (HIV status, biometric data, sexual
  orientation, religion, etc.) were scoring 1 — the same as "avatar URLs"
  or "clothing sizes." These are the most consequential data types in
  real privacy frameworks (GDPR Article 9), not the least.
- **Fields added:** 80+ fields given explicit scores based on GDPR Art.9,
  PCI-DSS, NIST SP 800-63, and Verizon DBIR 2024
- **Cap increase:** 60 -> 80 (to allow genuinely severe breaches to
  reach CRITICAL)
- **Default score:** 1 -> 2 (minimal but non-zero)
- **Effect:** CRITICAL grew from 5 to 60. Many records with multiple
  moderately-sensitive fields (ethnicity, income, health, identity docs)
  were promoted from HIGH to CRITICAL.
- **Result:** LOW=70, MEDIUM=488, HIGH=416, CRITICAL=60

### Iteration 5: Merge reverted — back to 4 classes

- **Decision:** Revert to 4-class training (LOW/MEDIUM/HIGH/CRITICAL)
- **Reason:** 60 CRITICAL is trainable. CRITICAL breaches are genuinely
  different from HIGH (identity theft, biometric exposure, financial fraud
  vs. passwords + emails). Merging erases the most important signal.
- **Class-weighted loss:** Will be used in Phase 2 training to handle
  imbalance (weights inversely proportional to class frequency)
- **CRITICAL evaluation:** 9 test examples gives wide confidence intervals.
  Will be reported as "limited by sample size, interpret qualitatively."
- **Deprecated files:** merge_labels.py and inference_rules.py are
  preserved for historical reference but should NOT be used.

## 4. Is This Heuristic Labeling a Substitute for Human-Annotated Ground Truth?

**No.** This is explicitly NOT a substitute for human-annotated ground truth.

The severity labels are assigned by a deterministic formula based on
HIBP metadata fields (PwnCount, DataClasses, IsVerified). IsSensitive
was intentionally excluded — it flags services where being listed is
socially sensitive (adult/dating), not data severity. The formula is
documented inline in `scraper/ai/data/label_breaches.py`.

This approach has the following limitations:

1. **No context about the breach itself.** The formula doesn't know whether
   the passwords were salted bcrypt hashes or plaintext. It doesn't know
   whether the service had 2FA enabled. It doesn't know whether the breach
   was responsibly disclosed or sold on dark web markets.

2. **PwnCount is a proxy, not a ground truth.** HIBP's PwnCount is often
   an estimate, sometimes wildly inaccurate. A breach reported as "10M
   records" might actually be 2M unique accounts with duplicates.

3. **DataClasses are self-reported.** HIBP relies on breach disclosers to
   report what data was exposed. Some breaches underreport the scope.

4. **No temporal degradation modeling.** A 2012 breach with passwords is
   less severe in 2026 because many of those accounts no longer exist.
   The formula treats all breaches as equally time-relevant.

5. **Class imbalance is real, not a bug.** Most HIBP breaches are MEDIUM
   severity because most breaches expose email + some PII but not
   passwords or financial data. A model trained on this will be
   calibrated to the real-world distribution, which is what we want.

**For any paper, report, or production system, these labels should be
validated by human security analysts.** The heuristic labels are useful
for:
- Pre-training data for self-supervised learning
- Baseline model evaluation
- Understanding which features the model learns from
- Rapid prototyping before investing in human annotation

They are NOT suitable for:
- Production risk scoring without human validation
- Academic claims about breach severity classification accuracy
- Any system where incorrect severity labels could cause harm

## 5. Single Biggest Data-Quality Risk

**The heuristic labels are the ground truth the model will learn from,
and they have systematic blind spots the model will inherit.**

Specifically: the formula cannot distinguish between a breach where
passwords were stored as plaintext (catastrophic) vs. bcrypt hashes
(unfortunate but contained). Both get "+25 for Passwords." A model
trained on these labels will learn to predict "CRITICAL" based on the
presence of "Passwords" in DataClasses — which is correct behavior
for this dataset, but wrong for real-world risk scoring where the
storage method matters enormously.

The second biggest risk is **label leakage from PwnCount**. The formula
uses PwnCount to compute the score, and the model will have access to
PwnCount as a feature. This means the model can partially reconstruct
the heuristic formula, giving artificially high accuracy that doesn't
reflect genuine understanding of breach severity. This is a known issue
with heuristic labeling and should be disclosed if reporting metrics.

A softer form of the same leakage exists in the **Description field**.
HIBP descriptions often state the record count or scale in prose
(e.g., "exposed almost 15 million customer records", "impacted over 8
million subscribers"). If Description text is used as a model input
(e.g., via TF-IDF or embeddings), the model can extract the scale from
the prose, inheriting the same PwnCount leakage through a different
channel. This should be accounted for in any feature-selection analysis.
