"""Spot-check sample: 20 records weighted toward LOW and CRITICAL."""

import json
from pathlib import Path


def main():
    project_root = Path(__file__).resolve().parents[3]
    labeled_file = project_root / "data" / "processed" / "labeled_breaches.json"

    with open(labeled_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Group by severity
    buckets = {}
    for r in data:
        sev = r["severity"]
        buckets.setdefault(sev, []).append(r)

    # Sample: all CRITICAL, 5 LOW, 5 MEDIUM, 5 HIGH
    sample = []
    for r in buckets.get("CRITICAL", []):
        sample.append(r)
    for r in buckets.get("LOW", [])[:5]:
        sample.append(r)
    for r in buckets.get("MEDIUM", [])[:5]:
        sample.append(r)
    for r in buckets.get("HIGH", [])[:5]:
        sample.append(r)

    print(f"Spot-check sample: {len(sample)} records")
    print("=" * 100)
    for i, r in enumerate(sample, 1):
        print(f'[{i}] {r["Name"]} ({r["Domain"]})')
        print(f'    Severity: {r["severity"]}  Score: {r["score"]}')
        print(f'    PwnCount: {r["PwnCount"]:,}')
        print(f'    DataClasses: {r["DataClasses"]}')
        desc = r.get("Description", "")
        # Strip HTML tags for readability
        import re
        desc = re.sub(r"<[^>]+>", "", desc)
        if len(desc) > 250:
            desc = desc[:250] + "..."
        print(f"    Description: {desc}")
        print()


if __name__ == "__main__":
    main()
