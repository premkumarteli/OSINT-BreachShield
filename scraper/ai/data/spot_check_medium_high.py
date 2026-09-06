"""Show MEDIUM and HIGH records near score boundaries."""

import json
import re
from pathlib import Path


def main():
    project_root = Path("C:/Users/prem/OSINT-breach-Finder-main")
    with open(project_root / "data/processed/labeled_breaches.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    buckets = {}
    for r in data:
        buckets.setdefault(r["severity"], []).append(r)

    medium = sorted(buckets["MEDIUM"], key=lambda x: x["score"])
    high = sorted(buckets["HIGH"], key=lambda x: x["score"])

    # MEDIUM: 2 near lower boundary, 2 mid, 1 near upper
    med_picks = [
        next(r for r in medium if 26 <= r["score"] <= 30),
        next(r for r in medium if 26 <= r["score"] <= 35),
        next(r for r in medium if 36 <= r["score"] <= 42),
        next(r for r in medium if 43 <= r["score"] <= 48),
        next(r for r in medium if 49 <= r["score"] <= 50),
    ]

    # HIGH: 2 near lower boundary, 2 mid, 1 near upper
    high_picks = [
        next(r for r in high if 51 <= r["score"] <= 55),
        next(r for r in high if 51 <= r["score"] <= 58),
        next(r for r in high if 59 <= r["score"] <= 65),
        next(r for r in high if 66 <= r["score"] <= 72),
        next(r for r in high if 73 <= r["score"] <= 75),
    ]

    def show(label, records):
        print(label)
        print("=" * 100)
        for i, r in enumerate(records, 1):
            desc = re.sub(r"<[^>]+>", "", r.get("Description", ""))
            if len(desc) > 250:
                desc = desc[:250] + "..."
            print(f'[{i}] {r["Name"]} ({r["Domain"]})')
            print(f'    Severity: {r["severity"]}  Score: {r["score"]}')
            print(f'    PwnCount: {r["PwnCount"]:,}')
            print(f'    DataClasses: {r["DataClasses"]}')
            print(f"    Description: {desc}")
            print()

    show("MEDIUM records (5)", med_picks)
    show("HIGH records (5)", high_picks)


if __name__ == "__main__":
    main()
