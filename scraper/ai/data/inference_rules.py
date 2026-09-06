"""
[DEPRECATED] Inference rules: split SEVERE into HIGH vs. CRITICAL.

This script is deprecated and should NOT be used. It was part of an earlier
iteration when CRITICAL had only 5 records and we trained on 3 classes
(LOW/MEDIUM/SEVERE). After the DATA_CLASS_SCORES fix, CRITICAL grew to
60 records (5.8%), and we reverted to 4-class training. The model now
learns the CRITICAL/HIGH boundary directly from data.

This file is preserved for historical reference only.

After the model predicts {LOW, MEDIUM, SEVERE}, apply these rules to
determine whether a SEVERE prediction should be reported as HIGH or CRITICAL.

Rules (applied in order):
1. Score >= 76 -> CRITICAL
2. "Credit cards" in DataClasses AND score >= 60 -> CRITICAL
3. Otherwise -> HIGH

These rules are based on the original 4-class labeling formula and are
designed to be conservative: they will under-predict CRITICAL rather than
over-predict, because the consequences of a false CRITICAL (unnecessary
panic) are worse than a false HIGH (missed severity).
"""

from typing import Optional


# Data classes that indicate financial fraud risk
FINANCIAL_DATA_CLASSES = {"Credit cards", "Bank account details"}


def split_severe(score: int, data_classes: list[str]) -> str:
    """
    Split a SEVERE prediction into HIGH or CRITICAL.

    Args:
        score: The heuristic severity score (0-100)
        data_classes: List of data classes from the HIBP record

    Returns:
        "HIGH" or "CRITICAL"
    """
    # Rule 1: High score -> CRITICAL
    if score >= 76:
        return "CRITICAL"

    # Rule 2: Financial data present with moderate-high score -> CRITICAL
    if any(dc in FINANCIAL_DATA_CLASSES for dc in data_classes) and score >= 60:
        return "CRITICAL"

    # Default: HIGH
    return "HIGH"


def classify(record: dict) -> str:
    """
    Classify a record using the 3-class model + secondary rules.

    Args:
        record: Dict with 'score', 'severity', 'DataClasses' keys

    Returns:
        Final severity label: LOW, MEDIUM, HIGH, or CRITICAL
    """
    severity = record.get("severity", "MEDIUM")
    score = record.get("score", 0)
    data_classes = record.get("DataClasses", [])

    if severity == "SEVERE":
        return split_severe(score, data_classes)
    return severity


def main():
    """Demonstrate the inference rules on the 5 CRITICAL examples."""
    import json
    from pathlib import Path

    project_root = Path(__file__).resolve().parents[3]
    labeled_file = project_root / "data" / "processed" / "labeled_breaches.json"

    with open(labeled_file, "r", encoding="utf-8") as f:
        records = json.load(f)

    critical = [r for r in records if r["severity"] == "CRITICAL"]
    severe = [r for r in records if r["severity"] == "HIGH"]

    print("=== CRITICAL examples (original labels) ===")
    print("These should all be classified as CRITICAL by the rules.\n")

    for r in critical:
        final = classify(r)
        match = "OK" if final == "CRITICAL" else f"WRONG ({final})"
        print(f'  {r["Name"]:20s} score={r["score"]:3d} -> {final:8s} [{match}]')
        print(f'    DataClasses: {r["DataClasses"]}')

    print(f"\n=== Sample HIGH examples (should be classified as HIGH) ===\n")

    for r in severe[:5]:
        final = classify(r)
        match = "OK" if final == "HIGH" else f"WRONG ({final})"
        print(f'  {r["Name"]:20s} score={r["score"]:3d} -> {final:8s} [{match}]')

    # Edge case: check if any HIGH examples would be misclassified as CRITICAL
    false_criticals = [r for r in severe if classify(r) == "CRITICAL"]
    print(f"\n=== HIGH examples that would be classified as CRITICAL: {len(false_criticals)} ===")
    for r in false_criticals[:10]:
        print(f'  {r["Name"]:20s} score={r["score"]:3d} DataClasses: {r["DataClasses"]}')


if __name__ == "__main__":
    main()
