"""Spot-check 10 newly CRITICAL records."""

import json
import re
from pathlib import Path


def main():
    project_root = Path("C:/Users/prem/OSINT-breach-Finder-main")
    with open(project_root / "data/processed/labeled_breaches.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    original_critical_names = {"AshleyMadison", "GenesisMarket", "gPotato", "Mate1", "VTech"}

    critical = [r for r in data if r["severity"] == "CRITICAL"]
    new_critical = [r for r in critical if r["Name"] not in original_critical_names]

    print(f"Total CRITICAL now: {len(critical)}")
    print(f"Original CRITICAL (before fix): {len(original_critical_names)}")
    print(f"Newly CRITICAL (moved from HIGH): {len(new_critical)}")

    # Pick 3 near boundary (76-82), 4 mid (83-90), 3 high (91-100)
    new_critical_sorted = sorted(new_critical, key=lambda x: x["score"])
    picks = []
    for r in new_critical_sorted:
        if 76 <= r["score"] <= 82 and len(picks) < 3:
            picks.append(r)
    for r in new_critical_sorted:
        if 83 <= r["score"] <= 90 and len(picks) < 7:
            picks.append(r)
    for r in new_critical_sorted:
        if 91 <= r["score"] <= 100 and len(picks) < 10:
            picks.append(r)

    print()
    print("Spot-check: 10 newly CRITICAL records")
    print("=" * 100)
    for i, r in enumerate(picks, 1):
        desc = re.sub(r"<[^>]+>", "", r.get("Description", ""))
        if len(desc) > 250:
            desc = desc[:250] + "..."
        print(f'[{i}] {r["Name"]} ({r["Domain"]})')
        print(f'    Severity: {r["severity"]}  Score: {r["score"]}')
        print(f'    PwnCount: {r["PwnCount"]:,}')
        print(f'    DataClasses: {r["DataClasses"]}')
        print(f"    Description: {desc}")
        print()


if __name__ == "__main__":
    main()
