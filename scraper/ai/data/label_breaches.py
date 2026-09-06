"""
Heuristic severity labeling for HIBP breach records.

Uses ONLY fields present in the HIBP response:
  - PwnCount: scale of the breach
  - DataClasses: what types of data were exposed
  - IsVerified: whether the breach is confirmed

NOTE: IsSensitive is intentionally excluded — it flags services where being
listed is socially sensitive (adult/dating), not data severity. These are
orthogonal concepts. No other HIBP boolean flag is a valid severity signal.

Outputs:
  - severity: LOW / MEDIUM / HIGH / CRITICAL
  - score: continuous 0-100

SCORING FORMULA (point-based, additive, capped at 100):

  1. Data class exposure (0-60 points)
     Each data class contributes independently based on real-world impact:
     - Passwords: +25  (credential exposure enables account takeover —
                         the single most actionable breach type per industry
                         frameworks like NIST SP 800-63)
     - Security questions and answers: +15  (bypasses identity verification
                                             flows, enabling account recovery attacks)
     - Credit cards: +20  (direct financial fraud, PCI-DSS scope)
     - National identity numbers: +20  (identity theft, long-lived credential
                                         that can't be changed like a password)
     - Bank account details: +15  (direct financial fraud)
     - Phone numbers: +5  (SIM-swap attacks, phishing vector)
     - Physical addresses: +5  (enables physical threats, social engineering)
     - Usernames: +3  (combined with passwords, enables credential stuffing)
     - Email addresses: +2  (baseline targeting identifier)
     - IP addresses: +2  (enables targeted network attacks)
     - Names: +3  (enables social engineering, doxxing)
     - Date of birth: +3  (enables identity verification bypass)
     - Other fields: +1 each  (minimal standalone impact)

  2. Breach scale (0-25 points)
     Larger breaches affect more people and are more likely to be weaponized:
     - PwnCount < 10,000: +5
     - 10,000 - 100,000: +10
     - 100,000 - 1,000,000: +15
     - 1,000,000 - 10,000,000: +20
     - > 10,000,000: +25

  3. Context flags (-10 to 0 points)
     - IsVerified = false: -10  (unconfirmed breaches are less actionable
                                  and may be fabricated or inaccurate)
     NOTE: IsSensitive was intentionally excluded. It flags services where
     being listed is socially sensitive (adult/dating), not data severity.
     A medical clinic breach exposing health records is severe; a dating
     site breach exposing only emails is not. Severity must come from
     what data was exposed, not whether the service is stigmatized.
     No other HIBP boolean flag (IsFabricated, IsStealerLog, IsMalware)
     is a valid severity signal — they are either too rare (<10 records)
     or measure the wrong concept.
     NOTE: IsSensitive was intentionally excluded. It flags services where
     being listed is socially sensitive (adult/dating), not data severity.
     A medical clinic breach exposing health records is severe; a dating
     site breach exposing only emails is not. Severity must come from
     what data was exposed, not whether the service is stigmatized.
     No other HIBP boolean flag (IsFabricated, IsStealerLog, IsMalware)
     is a valid severity signal — they are either too rare (<10 records)
     or measure the wrong concept.

  Final score = clamp(0, 100, data_class_score + scale_score + context_adjustment)

  Severity buckets:
    LOW:      0-25
    MEDIUM:   26-50
    HIGH:     51-75
    CRITICAL: 76-100

WHY THIS FORMULA:
- Credential exposure (passwords) is weighted highest because it directly
  enables account takeover, which is the most common attack vector per
  Verizon DBIR 2024.
- Financial data (credit cards, bank accounts) is weighted high because it
  enables immediate monetary fraud.
- Identity numbers (SSN, national ID) are weighted high because they are
  permanent credentials — unlike passwords, they can't be rotated.
- Scale matters because a 10M-record breach is more likely to appear in
  credential stuffing lists than a 1K-record breach.
- IsVerified is included because unconfirmed breaches may be fabricated
  or inaccurate, reducing their real-world severity.
"""

import json
import sys
from pathlib import Path
from datetime import datetime


# --- Data class severity mapping ---
# Each class contributes independently. Values chosen based on:
#   1. Verizon DBIR 2024 credential abuse statistics
#   2. NIST SP 800-63 credential lifecycle guidance
#   3. PCI-DSS scope for financial data
#   4. GDPR Article 9 special categories (health, biometric, racial/ethnic, etc.)
#   5. Real-world attack patterns (credential stuffing, SIM swap, identity theft)
DATA_CLASS_SCORES = {
    # === ACCOUNT TAKEOVER (highest impact) ===
    "Passwords":                        25,  # Account takeover — highest impact
    "Security questions and answers":   15,  # Bypasses account recovery flows
    "Auth tokens":                      15,  # Session hijacking, full account access
    "Historical passwords":             12,  # Credential stuffing (old passwords reused)
    "Password hints":                    8,  # Aids password cracking
    "Mothers maiden names":             10,  # Classic security question answer

    # === FINANCIAL FRAUD ===
    "Credit cards":                     20,  # Direct financial fraud (PCI-DSS)
    "Credit card CVV":                  15,  # Card-not-present fraud
    "PINs":                             15,  # ATM/POS fraud
    "Bank account details":             15,  # Direct financial fraud
    "Bank account numbers":             12,  # Wire fraud
    "Credit scores":                    10,  # Financial profiling
    "Credit status information":        10,  # Financial profiling
    "Loan information":                 10,  # Financial profiling
    "Payment histories":                 8,  # Financial behavior exposure
    "Account balances":                  8,  # Financial profiling
    "Payment methods":                   5,  # Payment fraud vector
    "Financial transactions":           10,  # Transaction exposure
    "Financial investments":            10,  # Wealth exposure
    "Taxation records":                 10,  # Tax fraud, identity theft
    "Cryptocurrency wallet addresses":   8,  # Crypto theft target

    # === IDENTITY THEFT (permanent credentials) ===
    "National identity numbers":        20,  # Identity theft (can't be rotated)
    "Social security numbers":          20,  # Identity theft (US-specific)
    "Government issued IDs":            18,  # Identity theft
    "Passport numbers":                 18,  # Identity theft, passport fraud
    "Driver's licenses":                18,  # Identity theft, ID fraud
    "Vehicle identification numbers (VINs)": 8,  # Vehicle fraud
    "Vehicle registration plates":       6,  # Vehicle tracking
    "Licence plates":                    6,  # Vehicle tracking
    "IMEI numbers":                      7,  # Device tracking, cloning
    "IMSI numbers":                      7,  # Cellular tracking

    # === GDPR ARTICLE 9 SPECIAL CATEGORIES (privacy-sensitive) ===
    "Biometric data":                   20,  # Irreversible identity (fingerprints, face)
    "Mnemonic phrases":                 20,  # Crypto wallet access (BIP39 seed)
    "Encrypted keys":                   20,  # Cryptographic access
    "HIV statuses":                     15,  # Extreme health sensitivity
    "Personal health data":             12,  # Health data exposure
    "Health insurance information":     10,  # Health data exposure
    "Disabilities":                     10,  # Health/disc discrimination
    "Sexual orientations":              12,  # Privacy-sensitive (blackmail, discrimination)
    "Sexual fetishes":                  12,  # Privacy-sensitive (blackmail)
    "Ethnicities":                      12,  # Racial/ethnic origin (GDPR Art.9)
    "Races":                            12,  # Racial/ethnic origin (GDPR Art.9)
    "Religions":                        12,  # Religious belief (GDPR Art.9)
    "Political views":                  10,  # Political opinion (GDPR Art.9)
    "Political donations":              10,  # Political opinion (GDPR Art.9)

    # === SENSITIVE LIFESTYLE DATA ===
    "Drug habits":                       8,  # Substance abuse (discrimination risk)
    "Drinking habits":                   6,  # Lifestyle sensitivity
    "Smoking habits":                    5,  # Lifestyle sensitivity
    "Income levels":                    10,  # Financial profiling
    "Net worths":                       10,  # Financial profiling
    "Earnings":                         10,  # Financial profiling
    "Socioeconomic levels":              5,  # Financial profiling
    "Credit status information":        10,  # Financial profiling

    # === PRIVATE COMMUNICATION ===
    "Private messages":                  8,  # Private communication exposure
    "Chat logs":                         7,  # Private communication exposure
    "Email messages":                    7,  # Private communication exposure
    "SMS messages":                      7,  # Private communication exposure
    "Forum posts":                       3,  # Public but identifiable

    # === LOCATION ===
    "Latitude and longitude pairs":      8,  # Precise location tracking
    "Geographic locations":              4,  # General location
    "Places of birth":                   4,  # Location PII

    # === FAMILY/RELATIONSHIPS ===
    "Family members' names":             5,  # Family PII
    "Spouses names":                     4,  # Relationship PII
    "Family structure":                  5,  # Relationship PII

    # === DEVICE/TECHNICAL ===
    "Device information":                5,  # Device fingerprinting
    "Device serial numbers":             5,  # Device tracking
    "MAC addresses":                     4,  # Device tracking
    "Browsing histories":                6,  # Behavioral data
    "Login histories":                   6,  # Behavioral data
    "Apps installed on devices":         5,  # Behavioral data
    "Device usage tracking data":        4,  # Behavioral data

    # === OTHER PII ===
    "Dates of birth":                    5,  # Identity verification (original was 3)
    "Genders":                           3,  # Demographic PII
    "Nationalities":                     3,  # Citizenship
    "Citizenship statuses":              3,  # Citizenship
    "Marital statuses":                  3,  # Relationship status
    "Relationship statuses":             3,  # Relationship status
    "Education levels":                  3,  # Demographic PII
    "Occupations":                       3,  # Demographic PII
    "Job titles":                        3,  # Demographic PII
    "Employers":                         3,  # Demographic PII
    "Employment statuses":               3,  # Demographic PII
    "Age groups":                        2,  # Demographic PII
    "Ages":                              2,  # Demographic PII
    "Physical attributes":               4,  # Physical description
    "Personal descriptions":             4,  # Personal narrative
    "Personal interests":                3,  # Behavioral profile
    "Social media profiles":             4,  # Social presence
    "Social connections":                4,  # Social graph

    # === ORIGINAL FIELDS (adjusted) ===
    "Phone numbers":                     5,  # SIM-swap, phishing vector
    "Physical addresses":                5,  # Physical threats, doxxing
    "Usernames":                         3,  # Enables credential stuffing
    "Names":                             3,  # Social engineering, doxxing
    "Email addresses":                   2,  # Baseline targeting identifier
    "IP addresses":                      2,  # Targeted network attacks
}
DEFAULT_DATA_CLASS_SCORE = 2  # Any other field: minimal but non-zero impact


def score_data_classes(data_classes: list[str]) -> int:
    """
    Sum scores for each data class present.

    We use len(data_classes) capped contributions to prevent gaming:
    even if someone lists 50 data classes, the score is capped at 80.
    In practice, the maximum HIBP data class count is ~15, and the
    highest legitimate scores come from breaches with multiple high-value
    fields (passwords + credit cards + SSN + biometrics = 100+ uncapped).
    """
    total = 0
    for dc in data_classes:
        total += DATA_CLASS_SCORES.get(dc, DEFAULT_DATA_CLASS_SCORE)
    # Cap at 80 to keep data class contribution bounded but allow
    # genuinely severe breaches to reach CRITICAL
    return min(total, 80)


def score_pwn_count(pwn_count: int) -> int:
    """
    Breach scale score. Larger breaches are more likely to be weaponized
    in credential stuffing lists and dark web markets.

    Thresholds based on:
    - <10K: small, niche service, low weaponization risk
    - 10K-100K: moderate, may appear in breach compilation databases
    - 100K-1M: significant, likely in active credential stuffing lists
    - 1M-10M: large, high weaponization probability
    - >10M: massive, almost certainly in active attack campaigns
    """
    if pwn_count < 10_000:
        return 5
    elif pwn_count < 100_000:
        return 10
    elif pwn_count < 1_000_000:
        return 15
    elif pwn_count < 10_000_000:
        return 20
    else:
        return 25


def score_context(is_verified: bool) -> int:
    """
    Context adjustments:
    - IsVerified: -10 if false. Unconfirmed breaches may be fabricated,
      inaccurate, or from unreliable sources. They are less actionable
      and should be flagged as uncertain.

    NOTE: IsSensitive is intentionally excluded. It flags services where
    being listed is socially sensitive (adult/dating), not data severity.
    A medical clinic breach exposing health records is severe; a dating
    site breach exposing only emails is not. Severity must come from
    what data was exposed, not whether the service is stigmatized.
    """
    if not is_verified:
        return -10
    return 0


def compute_severity(score: int) -> str:
    """Map continuous 0-100 score to severity bucket."""
    if score <= 25:
        return "LOW"
    elif score <= 50:
        return "MEDIUM"
    elif score <= 75:
        return "HIGH"
    else:
        return "CRITICAL"


def label_breach(breach: dict) -> dict:
    """
    Label a single HIBP breach record.

    Returns the original record with 'score' and 'severity' added.
    """
    pwn_count = breach.get("PwnCount", 0) or 0
    data_classes = breach.get("DataClasses", []) or []
    is_verified = breach.get("IsVerified", True)  # default to True if missing

    data_score = score_data_classes(data_classes)
    scale_score = score_pwn_count(pwn_count)
    context_adj = score_context(is_verified)

    raw_score = data_score + scale_score + context_adj
    final_score = max(0, min(100, raw_score))
    severity = compute_severity(final_score)

    return {
        **breach,
        "score": final_score,
        "severity": severity,
    }


def main():
    # Paths
    project_root = Path(__file__).resolve().parents[3]
    raw_dir = project_root / "data" / "raw"
    processed_dir = project_root / "data" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)

    # Find the raw HIBP file (most recent)
    hibp_files = sorted(raw_dir.glob("hibp_breaches_*.json"))
    if not hibp_files:
        print("ERROR: No HIBP breach files found in data/raw/")
        sys.exit(1)
    raw_file = hibp_files[-1]
    print(f"Loading: {raw_file}")

    with open(raw_file, "r", encoding="utf-8-sig") as f:
        breaches = json.load(f)

    print(f"Loaded {len(breaches)} breach records")

    # Label all records
    labeled = [label_breach(b) for b in breaches]

    # Save labeled data
    output_file = processed_dir / "labeled_breaches.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(labeled, f, indent=2, ensure_ascii=False)

    # Report distribution
    distribution = {}
    for record in labeled:
        sev = record["severity"]
        distribution[sev] = distribution.get(sev, 0) + 1

    print(f"\nLabeled {len(labeled)} records")
    print(f"Saved to: {output_file}")
    print(f"\nClass distribution:")
    for bucket in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        count = distribution.get(bucket, 0)
        pct = (count / len(labeled)) * 100
        print(f"  {bucket:8s}: {count:5d} ({pct:.1f}%)")


if __name__ == "__main__":
    main()
