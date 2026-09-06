"""
STEP 1: Feature preparation for XGBoost baseline.

Structured input features:
- DataClasses: multi-hot encoded across 163-field vocabulary
- PwnCount: log-scaled (log1p)
- IsVerified: boolean (0/1)

Excluded (leakage risk):
- score: deterministic function of severity (score<=25 -> LOW, etc.)
- IsSensitive: removed per LABELING_NOTES.md

Output:
- data/processed/xgboost_features.json — feature metadata + train/val/test splits
"""

import json
import math
from pathlib import Path
from collections import Counter


# Label encoding
LABEL_MAP = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
LABEL_NAMES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def load_data(project_root: Path) -> list[dict]:
    with open(project_root / "data/processed/labeled_breaches.json", "r", encoding="utf-8") as f:
        return json.load(f)


def build_vocabulary(records: list[dict]) -> list[str]:
    """Build sorted vocabulary of all unique DataClasses across all records."""
    all_dcs = set()
    for r in records:
        for dc in r.get("DataClasses", []) or []:
            all_dcs.add(dc)
    return sorted(all_dcs)


def multi_hot_encode(data_classes: list[str], vocab: list[str]) -> list[int]:
    """Multi-hot encode a list of data classes against the vocabulary."""
    dc_set = set(data_classes) if data_classes else set()
    return [1 if v in dc_set else 0 for v in vocab]


def compute_sample_weights(records: list[dict]) -> dict:
    """
    Compute per-sample weights inversely proportional to class frequency.
    Returns dict mapping record index -> weight.
    """
    class_counts = Counter(r["severity"] for r in records)
    total = len(records)
    num_classes = len(class_counts)

    # Weight = total / (num_classes * count)
    class_weights = {
        sev: total / (num_classes * count)
        for sev, count in class_counts.items()
    }

    return {i: class_weights[r["severity"]] for i, r in enumerate(records)}


def prepare_features(records: list[dict], vocab: list[str]) -> dict:
    """
    Prepare feature matrices for train/val/test splits.

    Returns dict with keys: train, val, test, each containing:
    - X: list of feature vectors
    - y: list of integer labels
    - weights: list of sample weights
    - names: list of breach names (for debugging)
    """
    # Group by split
    splits = {"train": [], "val": [], "test": []}
    for r in records:
        # Determine split from the existing split files
        splits.setdefault(r.get("split", "train"), []).append(r)

    # Actually, let's load from the existing split files
    result = {}
    for split_name in ["train", "val", "test"]:
        with open(
            Path(__file__).resolve().parents[3] / f"data/processed/{split_name}.json",
            "r",
            encoding="utf-8",
        ) as f:
            split_records = json.load(f)

        X, y, weights, names = [], [], [], []
        for i, r in enumerate(split_records):
            # Multi-hot DataClasses
            dc_features = multi_hot_encode(r.get("DataClasses", []) or [], vocab)

            # Log-scaled PwnCount
            pwn_count = r.get("PwnCount", 0) or 0
            log_pwn = math.log1p(pwn_count)

            # IsVerified
            is_verified = 1 if r.get("IsVerified", True) else 0

            # Combine features
            features = dc_features + [log_pwn, is_verified]
            X.append(features)
            y.append(LABEL_MAP[r["severity"]])
            names.append(r.get("Name", ""))

        # Compute sample weights for this split
        class_counts = Counter(r["severity"] for r in split_records)
        total = len(split_records)
        num_classes = len(class_counts)
        class_weights = {
            sev: total / (num_classes * count) for sev, count in class_counts.items()
        }
        weights = [class_weights[split_records[i]["severity"]] for i in range(len(split_records))]

        result[split_name] = {"X": X, "y": y, "weights": weights, "names": names}

    return result


def main():
    project_root = Path(__file__).resolve().parents[3]

    # Load all labeled data
    records = load_data(project_root)
    print(f"Loaded {len(records)} labeled records")

    # Build vocabulary
    vocab = build_vocabulary(records)
    print(f"DataClasses vocabulary: {len(vocab)} unique fields")

    # Prepare features
    splits = prepare_features(records, vocab)

    # Report
    print(f"\nFeature vector length: {len(vocab) + 2} (DataClasses + log_pwn + is_verified)")
    print(f"\nSplit sizes:")
    for name in ["train", "val", "test"]:
        print(f"  {name}: {len(splits[name]['X'])} records")

    # Class distribution per split
    for name in ["train", "val", "test"]:
        dist = Counter(splits[name]["y"])
        print(f"\n  {name} class distribution:")
        for label_id in range(4):
            count = dist.get(label_id, 0)
            print(f"    {LABEL_NAMES[label_id]:8s}: {count:4d}")

    # Save feature metadata
    output = {
        "vocabulary": vocab,
        "feature_names": vocab + ["log_pwn_count", "is_verified"],
        "label_map": LABEL_MAP,
        "label_names": LABEL_NAMES,
        "num_features": len(vocab) + 2,
        "splits": {
            name: {
                "X": splits[name]["X"],
                "y": splits[name]["y"],
                "weights": splits[name]["weights"],
            }
            for name in ["train", "val", "test"]
        },
    }

    output_path = project_root / "data/processed/xgboost_features.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f)
    print(f"\nSaved to: {output_path}")

    # Show top 15 most common DataClasses (by frequency)
    dc_freq = Counter()
    for r in records:
        for dc in r.get("DataClasses", []) or []:
            dc_freq[dc] += 1

    print(f"\nTop 15 DataClasses by frequency:")
    for dc, count in dc_freq.most_common(15):
        print(f"  {dc:45s}: {count:4d} records")

    # Confirm no leakage features
    print(f"\n=== LEAKAGE CHECK ===")
    print(f"Features included: DataClasses (multi-hot), log_pwn_count, is_verified")
    print(f"Features EXCLUDED: score (deterministic label), IsSensitive (removed)")
    print(f"PwnCount leakage risk: YES — log_pwn_count is a legitimate feature")
    print(f"  but correlates with severity via the labeling formula.")
    print(f"  Will be reported as leakage risk in RESULTS.md.")


if __name__ == "__main__":
    main()
