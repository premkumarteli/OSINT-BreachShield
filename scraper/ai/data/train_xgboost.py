"""
STEP 3a: Train XGBoost baseline on structured features.

Features: DataClasses (multi-hot), log_pwn_count, is_verified
Excluded: score (leakage), IsSensitive (removed)
Objective: Multi-class (LOW/MEDIUM/HIGH/CRITICAL)
Sample weights: Inversely proportional to class frequency
"""

import json
import numpy as np
import xgboost as xgb
from pathlib import Path
from collections import Counter


LABEL_NAMES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
LABEL_MAP = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}


def load_features(project_root: Path) -> dict:
    with open(project_root / "data/processed/xgboost_features.json", "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    project_root = Path(__file__).resolve().parents[3]
    data = load_features(project_root)

    X_train = np.array(data["splits"]["train"]["X"], dtype=np.float32)
    y_train = np.array(data["splits"]["train"]["y"], dtype=np.int32)
    w_train = np.array(data["splits"]["train"]["weights"], dtype=np.float32)

    X_val = np.array(data["splits"]["val"]["X"], dtype=np.float32)
    y_val = np.array(data["splits"]["val"]["y"], dtype=np.int32)

    X_test = np.array(data["splits"]["test"]["X"], dtype=np.float32)
    y_test = np.array(data["splits"]["test"]["y"], dtype=np.int32)

    print(f"Feature shapes:")
    print(f"  Train: X={X_train.shape}, y={y_train.shape}")
    print(f"  Val:   X={X_val.shape}, y={y_val.shape}")
    print(f"  Test:  X={X_test.shape}, y={y_test.shape}")

    print(f"\nClass distribution:")
    for split_name, y in [("train", y_train), ("val", y_val), ("test", y_test)]:
        dist = Counter(y)
        print(f"  {split_name}: {', '.join(f'{LABEL_NAMES[k]}={v}' for k, v in sorted(dist.items()))}")

    print(f"\nSample weights (train):")
    for label_id in range(4):
        mask = y_train == label_id
        if mask.any():
            print(f"  {LABEL_NAMES[label_id]:8s}: weight={w_train[mask][0]:.3f}, count={mask.sum()}")

    # Train XGBoost
    print(f"\n=== Training XGBoost ===")
    dtrain = xgb.DMatrix(X_train, label=y_train, weight=w_train)
    dval = xgb.DMatrix(X_val, label=y_val)
    dtest = xgb.DMatrix(X_test, label=y_test)

    params = {
        "objective": "multi:softprob",
        "num_class": 4,
        "eval_metric": "mlogloss",
        "max_depth": 6,
        "learning_rate": 0.1,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "min_child_weight": 3,
        "seed": 42,
        "verbosity": 0,
    }

    num_rounds = 500
    early_stopping_rounds = 50

    evals = [(dtrain, "train"), (dval, "val")]
    model = xgb.train(
        params,
        dtrain,
        num_rounds,
        evals=evals,
        early_stopping_rounds=early_stopping_rounds,
        verbose_eval=50,
    )

    best_round = model.best_iteration
    print(f"\nBest iteration: {best_round}")

    # Feature importances
    importance = model.get_score(importance_type="gain")
    feature_names = data["feature_names"]

    # Sort by importance
    sorted_imp = sorted(importance.items(), key=lambda x: x[1], reverse=True)

    print(f"\n=== Top 15 Feature Importances (gain) ===")
    for i, (feat_name, gain) in enumerate(sorted_imp[:15], 1):
        print(f"  {i:2d}. {feat_name:45s}: {gain:.4f}")

    # Predictions on validation set for quick check
    y_val_pred = model.predict(dval)
    y_val_pred_class = np.argmax(y_val_pred, axis=1)
    val_acc = (y_val_pred_class == y_val).mean()
    print(f"\nValidation accuracy: {val_acc:.4f}")

    # Save model
    model_path = project_root / "data/processed/xgboost_model.json"
    model.save_model(str(model_path))
    print(f"Model saved to: {model_path}")

    # Save training metadata
    metadata = {
        "model": "XGBoost",
        "features": feature_names,
        "num_features": len(feature_names),
        "best_iteration": best_round,
        "val_accuracy": float(val_acc),
        "params": params,
        "top_15_features": [(name, float(gain)) for name, gain in sorted_imp[:15]],
        "leakage_flags": {
            "score": "EXCLUDED — deterministic label",
            "IsSensitive": "EXCLUDED — removed per LABELING_NOTES.md",
            "log_pwn_count": "INCLUDED — legitimate feature but correlates with severity via labeling formula. Reported as leakage risk.",
        },
    }

    metadata_path = project_root / "data/processed/xgboost_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to: {metadata_path}")


if __name__ == "__main__":
    main()
