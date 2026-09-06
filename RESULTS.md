# RESULTS.md — Phase 2 Model Training & Honest Evaluation

## Deployment Status: NOT DEPLOYED

**Reason:** The trained XGBoost breach-severity model requires three feature groups:
- DataClasses (163-dim multi-hot)
- log_pwn_count (log-scaled record count)
- is_verified (boolean)

No current production source in OSINT-BreachShield provides the complete feature contract.
The `PublicBreachSource` returns only `dataClasses` (partial vocabulary match).
`TelegramScraperSource`, `PhishingFeedSource`, and `ThreatIntelSource` are OSINT/threat-intel sources, not breach records, and lack `PwnCount` and `IsVerified`.

The model is retained as a validated research artifact. It should not be integrated into the production pipeline unless a feature-complete breach source is introduced that supplies all three required feature groups.

---

## Executive Summary

**XGBoost wins decisively** with 89.2% test accuracy (+42.0% over naive baseline).
All three neural models (CNN, RNN, Transformer) overfit severely on 723 training
examples and fail to meaningfully beat the naive baseline.

---

## Dataset

| Split | Size | LOW | MEDIUM | HIGH | CRITICAL |
|-------|-----:|----:|-------:|-----:|---------:|
| Train | 723 | 49 | 341 | 291 | 42 |
| Val | 154 | 10 | 73 | 62 | 9 |
| Test | 157 | 11 | 74 | 63 | 9 |

Naive baseline (always predict MEDIUM): **47.1%** on test set.

---

## Model Configurations

| Model | Architecture | Regularization |
|-------|--------------|----------------|
| XGBoost | Gradient boosted trees (max_depth=6, lr=0.1) | Sample weights, early stopping |
| CNN | Emb(128) → Conv1D(k=3,4,5, 64 filters) → MaxPool → FC | Dropout 0.3, weight_decay=1e-4 |
| RNN | Emb(128) → BiLSTM(128) → FC | Dropout 0.3, weight_decay=1e-4 (original arch) |
| Transformer | Emb(128) → PosEnc → TransformerEncoder(2 layers, 4 heads) → AvgPool → FC | Dropout 0.1/0.3, weight_decay=1e-4 |

---

## Test-Set Results

### Overall Metrics

| Model | Accuracy | Macro F1 | Weighted F1 | vs Naive (47.1%) |
|-------|---------:|---------:|------------:|-----------------:|
| **XGBoost** | **89.2%** | **83.2%** | **89.4%** | **+42.0%** |
| CNN (retried) | 66.2% | 57.2% | 65.7% | +19.1% |
| RNN (original) | 41.4% | 32.1% | 44.0% | **-5.7%** |
| Transformer (original) | 48.4% | 42.9% | 50.8% | +1.3% |

### Per-Class Metrics (Test Set)

#### XGBoost
| Class | Precision | Recall | F1 | Support |
|-------|----------:|-------:|---:|--------:|
| LOW | 64.3% | 81.8% | 72.0% | 11 |
| MEDIUM | 90.7% | 91.9% | 91.3% | 74 |
| HIGH | 94.9% | 88.9% | 91.8% | 63 |
| CRITICAL | 77.8% | 77.8% | 77.8% | 9 ⚠ |

#### CNN (retried)
| Class | Precision | Recall | F1 | Support |
|-------|----------:|-------:|---:|--------:|
| LOW | 45.5% | 45.5% | 45.5% | 11 |
| MEDIUM | 64.2% | 82.4% | 72.2% | 74 |
| HIGH | 79.1% | 54.0% | 64.2% | 63 |
| CRITICAL | 50.0% | 44.4% | 47.1% | 9 ⚠ |

#### RNN (original)
| Class | Precision | Recall | F1 | Support |
|-------|----------:|-------:|---:|--------:|
| LOW | 14.6% | 54.5% | 23.1% | 11 |
| MEDIUM | 63.4% | 35.1% | 45.2% | 74 |
| HIGH | 51.6% | 50.8% | 51.2% | 63 |
| CRITICAL | 7.7% | 11.1% | 9.1% | 9 ⚠ |

#### Transformer (original)
| Class | Precision | Recall | F1 | Support |
|-------|----------:|-------:|---:|--------:|
| LOW | 18.9% | 63.6% | 29.2% | 11 |
| MEDIUM | 67.6% | 33.8% | 45.0% | 74 |
| HIGH | 67.9% | 60.3% | 63.9% | 63 |
| CRITICAL | 22.2% | 66.7% | 33.3% | 9 ⚠ |

---

### Confusion Matrices (rows=true, cols=pred)

**XGBoost:**
```
LOW:      [9, 2, 0, 0]
MEDIUM:   [4, 68, 2, 0]
HIGH:     [1, 4, 56, 2]
CRITICAL: [0, 1, 1, 7]
```

**CNN:**
```
LOW:      [5, 5, 1, 0]
MEDIUM:   [5, 61, 7, 1]
HIGH:     [1, 25, 34, 3]
CRITICAL: [0, 4, 1, 4]
```

**RNN:**
```
LOW:      [6, 2, 3, 0]
MEDIUM:   [22, 26, 22, 4]
HIGH:     [12, 11, 32, 8]
CRITICAL: [1, 2, 5, 1]
```

**Transformer:**
```
LOW:      [7, 3, 0, 1]
MEDIUM:   [27, 25, 17, 5]
HIGH:     [2, 8, 38, 15]
CRITICAL: [1, 1, 1, 6]
```

---

## CRITICAL Class — Low Confidence Flag

**9 test examples only.** All per-class metrics for CRITICAL are reported
with a low-confidence flag. Confidence intervals are wide; do not rely
on point estimates for this class.

| Model | Precision | Recall | F1 |
|-------|----------:|-------:|---:|
| XGBoost | 77.8% | 77.8% | 77.8% |
| CNN | 50.0% | 44.4% | 47.1% |
| RNN | 7.7% | 11.1% | 9.1% |
| Transformer | 22.2% | 66.7% | 33.3% |

---

## Naive Baseline Comparison (All Models)

| Model | Accuracy | vs Naive (47.1%) |
|-------|---------:|-----------------:|
| XGBoost | 89.2% | **+42.0%** |
| CNN | 66.2% | +19.1% |
| Transformer | 48.4% | +1.3% |
| RNN | 41.4% | **-5.7%** |

RNN **underperforms the naive baseline** by 5.7%. It learned nothing
useful beyond class frequency.

---

## Training Behavior

| Model | Best Epoch/Iter | Best Val Loss | Final Val Acc | Overfitting |
|-------|----------------:|--------------:|--------------:|-------------|
| XGBoost | 195 | 0.38 | 86.4% | No |
| CNN (retried) | 7 | 0.95 | 72.1% | Yes |
| RNN (original) | 6 | 1.26 | 50.0% | Yes (severe) |
| Transformer (original) | 6 | 1.05 | 61.7% | Yes (severe) |

All three neural models overfit severely despite:
- Dropout (0.3 in CNN/RNN, 0.1/0.3 in Transformer)
- Weight decay (1e-4)
- Early stopping (patience=15)
- Reduced RNN capacity (hidden_dim=128, original arch)

With 723 training examples, all neural models memorize training data
(train loss → 0, train acc → 98%) while validation loss increases.
This is a fundamental data-quantity limitation.

---

## Leakage Flags (Honest Disclosure)

| Feature | Status | Risk |
|---------|--------|------|
| `score` | EXCLUDED | Deterministic label (score<=25→LOW) |
| `IsSensitive` | EXCLUDED | Removed per LABELING_NOTES.md |
| `log_pwn_count` | INCLUDED | **Legitimate feature but correlates with severity via labeling formula** — reported as leakage risk |
| `Description` text | INCLUDED (CNN/RNN/Transformer) | **Prose often states record count** — softer form of PwnCount leakage |

The labeling formula uses PwnCount and DataClasses to compute `score`,
which determines `severity`. Features derived from these (log_pwn_count,
DataClasses multi-hot) can partially reconstruct the label. This is
documented in LABELING_NOTES.md and should be disclosed if reporting
metrics in any paper/report.

---

## Production Recommendation

>>> **Use XGBoost for production.**

**Reasons:**
1. **Highest accuracy (89.2%)** — beats all neural models by 23+ points
2. **No overfitting** — train/val gap is small; neural models all overfit
3. **Fast inference** — tree ensemble, no GPU needed
4. **Interpretable features** — feature importances show what drives severity
5. **Beats naive baseline by 42%** — all neural models are within 20% of naive
6. **RNN underperforms naive baseline** — learned nothing useful

**Do not deploy CNN/RNN/Transformer.** They overfit, underperform the
baseline (RNN), and add no value over XGBoost on this dataset size.

---

## Reproducibility

All code, data splits, and trained models saved in:
- `data/processed/xgboost_model.json`
- `data/processed/cnn_best.pt` (retried)
- `data/processed/rnn_original_best.pt` (original)
- `data/processed/transformer_best.pt` (original)
- `data/processed/evaluation_results.json`
- `data/processed/xgboost_features.json`
- `data/processed/text_features.json`

Training scripts: `scraper/ai/data/train_xgboost.py`, `scraper/ai/data/train_text_models.py`

---

## Caveats

1. **CRITICAL class**: 9 test examples only — all metrics flagged low-confidence
2. **Heuristic labels**: Not human-annotated ground truth (see LABELING_NOTES.md)
3. **Leakage risk**: log_pwn_count and DataClasses features correlate with label construction
4. **Dataset size**: 723 train examples is small for neural models; overfitting is structural
5. **Class imbalance**: MEDIUM=47%, HIGH=40%, LOW=7%, CRITICAL=6% — weighted loss used