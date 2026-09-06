"""
Stratified train/val/test split for labeled HIBP breach data.

Splits by severity bucket (LOW/MEDIUM/HIGH/CRITICAL) with 70/15/15 ratio.
4-class training scheme (reverted from merged SEVERE approach after CRITICAL
grew from 5 to 60 records following the DATA_CLASS_SCORES fix).

Uses deterministic shuffle for reproducibility (seed=42).
"""

import json
import random
from pathlib import Path
from collections import defaultdict


SEED = 42
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

SEVERITY_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def stratified_split(records: list[dict]) -> dict:
    """
    Split records into train/val/test by severity bucket.

    For each bucket, we shuffle deterministically and assign:
    - First 70% to train
    - Next 15% to val
    - Last 15% to test

    For very small buckets (< 3 examples), we use round-robin assignment
    to ensure at least 1 example in each split.
    """
    # Group by severity
    buckets = defaultdict(list)
    for record in records:
        buckets[record["severity"]].append(record)

    train, val, test = [], [], []

    for severity in SEVERITY_ORDER:
        bucket_records = buckets.get(severity, [])
        if not bucket_records:
            continue

        # Deterministic shuffle
        rng = random.Random(SEED)
        rng.shuffle(bucket_records)
        n = len(bucket_records)

        if n < 10:
            # Round-robin for small buckets: ensure at least 1 in each split
            for i, record in enumerate(bucket_records):
                if i % 3 == 0:
                    train.append(record)
                elif i % 3 == 1:
                    val.append(record)
                else:
                    test.append(record)
        else:
            train_end = int(n * TRAIN_RATIO)
            val_end = train_end + int(n * VAL_RATIO)

            train.extend(bucket_records[:train_end])
            val.extend(bucket_records[train_end:val_end])
            test.extend(bucket_records[val_end:])

    return {"train": train, "val": val, "test": test}


def count_distribution(records: list[dict]) -> dict:
    dist = defaultdict(int)
    for r in records:
        dist[r["severity"]] += 1
    return dict(dist)


def main():
    project_root = Path(__file__).resolve().parents[3]
    processed_dir = project_root / "data" / "processed"

    # Load 4-class labeled data
    labeled_file = processed_dir / "labeled_breaches.json"
    with open(labeled_file, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"Loaded {len(records)} labeled records")

    # Overall distribution
    overall_dist = count_distribution(records)
    print(f"\nOverall distribution:")
    for sev in SEVERITY_ORDER:
        count = overall_dist.get(sev, 0)
        print(f"  {sev:8s}: {count:5d}")

    # Split
    splits = stratified_split(records)

    # Save and report each split
    for split_name in ["train", "val", "test"]:
        split_records = splits[split_name]
        output_file = processed_dir / f"{split_name}.json"

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(split_records, f, indent=2, ensure_ascii=False)

        dist = count_distribution(split_records)
        print(f"\n{split_name.upper()} split: {len(split_records)} records -> {output_file.name}")
        for sev in SEVERITY_ORDER:
            count = dist.get(sev, 0)
            pct = (count / len(split_records) * 100) if split_records else 0
            print(f"  {sev:8s}: {count:5d} ({pct:.1f}%)")

    # Sanity check: no records lost
    total = sum(len(splits[s]) for s in splits)
    print(f"\nTotal across splits: {total} (original: {len(records)})")
    assert total == len(records), f"Record count mismatch! {total} != {len(records)}"
    print("OK: all records accounted for")


if __name__ == "__main__":
    main()
