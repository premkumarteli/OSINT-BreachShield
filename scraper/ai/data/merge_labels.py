"""
[DEPRECATED] Merge HIGH+CRITICAL into SEVERE for training.

This script is deprecated and should NOT be used. It was part of an earlier
iteration when CRITICAL had only 5 records (0.5% of dataset). After the
DATA_CLASS_SCORES fix, CRITICAL grew to 60 records (5.8%), making the merge
unnecessary. We now train on the original 4 classes (LOW/MEDIUM/HIGH/CRITICAL)
with class-weighted loss.

This file is preserved for historical reference only. It documents the
reasoning that was used and then superseded.

Rationale:
- CRITICAL has only 5 records (0.5% of dataset). Not enough to train or
  evaluate a class. Train/val/test splits would have 2/2/1 CRITICAL examples,
  making any metric meaningless.
- HIGH (342) and CRITICAL (5) are conceptually similar — both involve
  significant data exposure (passwords, financial data, identity numbers).
- The meaningful distinction for the model is "serious breach" vs. "not
  serious" — that's a 347-example class vs. 687-example class, which is
  trainable.

Inference plan:
- Model predicts {LOW, MEDIUM, SEVERE}
- A secondary rule splits SEVERE into HIGH vs. CRITICAL at inference time:
  - Score >= 76 OR ("Credit cards" in DataClasses AND score >= 60) -> CRITICAL
  - Otherwise -> HIGH
- The 5 CRITICAL examples are held out as a qualitative sanity check only,
  not as a statistical evaluation.

This script:
1. Loads labeled_breaches.json
2. Merges HIGH+CRITICAL into SEVERE
3. Saves to data/processed/labeled_breaches_training.json
4. Reports the new 3-class distribution
"""

import json
from pathlib import Path


def merge_severity(record: dict) -> dict:
    """Merge HIGH+CRITICAL into SEVERE."""
    r = dict(record)
    if r["severity"] in ("HIGH", "CRITICAL"):
        r["severity"] = "SEVERE"
    return r


def main():
    project_root = Path(__file__).resolve().parents[3]
    processed_dir = project_root / "data" / "processed"

    # Load labeled data
    labeled_file = processed_dir / "labeled_breaches.json"
    with open(labeled_file, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"Loaded {len(records)} labeled records")

    # Show original distribution
    orig_dist = {}
    for r in records:
        sev = r["severity"]
        orig_dist[sev] = orig_dist.get(sev, 0) + 1

    print(f"\nOriginal distribution (4-class):")
    for sev in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        print(f"  {sev:8s}: {orig_dist.get(sev, 0):5d}")

    # Merge
    merged = [merge_severity(r) for r in records]

    # Show new distribution
    new_dist = {}
    for r in merged:
        sev = r["severity"]
        new_dist[sev] = new_dist.get(sev, 0) + 1

    print(f"\nMerged distribution (3-class):")
    for sev in ["LOW", "MEDIUM", "SEVERE"]:
        count = new_dist.get(sev, 0)
        pct = count / len(merged) * 100
        print(f"  {sev:8s}: {count:5d} ({pct:.1f}%)")

    # Save
    output_file = processed_dir / "labeled_breaches_training.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)

    print(f"\nSaved to: {output_file}")

    # List the 5 CRITICAL records for reference
    critical = [r for r in records if r["severity"] == "CRITICAL"]
    print(f"\n{len(critical)} CRITICAL records (held out as qualitative sanity check):")
    for r in critical:
        print(f"  - {r['Name']} (score={r['score']}): {r['DataClasses']}")


if __name__ == "__main__":
    main()
