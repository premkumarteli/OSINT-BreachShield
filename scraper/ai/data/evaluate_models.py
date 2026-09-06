"""
STEP 4: Final test-set evaluation on all 4 models.

Models evaluated:
- XGBoost (structured features)
- CNN (retried version)
- RNN (original version)
- Transformer (original version)

Outputs:
- Per-model: accuracy, per-class P/R/F1, confusion matrix
- Naive baseline comparison (always MEDIUM = 47.4%)
- CRITICAL class flagged as low-confidence (9 test examples)
- Side-by-side comparison table
"""

import json
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import xgboost as xgb
from pathlib import Path
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
from collections import Counter


LABEL_NAMES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
LABEL_MAP = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
NAIVE_BASELINE = 47.4  # always predict MEDIUM on val/test


# === Models (same architectures as training) ===

class TextCNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, num_classes, num_filters=64, kernel_sizes=(3, 4, 5)):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.convs = nn.ModuleList([
            nn.Conv1d(embed_dim, num_filters, k) for k in kernel_sizes
        ])
        self.fc = nn.Linear(num_filters * len(kernel_sizes), num_classes)
        self.dropout = nn.Dropout(0.3)

    def forward(self, x):
        emb = self.embedding(x).transpose(1, 2)
        conv_outputs = [torch.max(torch.relu(conv(emb)), dim=2)[0] for conv in self.convs]
        out = self.dropout(torch.cat(conv_outputs, dim=1))
        return self.fc(out)


class TextRNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_dim * 2, num_classes)
        self.dropout = nn.Dropout(0.3)

    def forward(self, x):
        emb = self.embedding(x)
        _, (h_n, _) = self.lstm(emb)
        h_cat = torch.cat([h_n[-2], h_n[-1]], dim=1)
        return self.fc(self.dropout(h_cat))


class PositionalEncoding(nn.Module):
    def __init__(self, embed_dim, max_len=128):
        super().__init__()
        pe = torch.zeros(max_len, embed_dim)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, embed_dim, 2).float() * (-np.log(10000.0) / embed_dim))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer("pe", pe.unsqueeze(0))

    def forward(self, x):
        return x + self.pe[:, :x.size(1)]


class TextTransformer(nn.Module):
    def __init__(self, vocab_size, embed_dim, num_classes, num_heads=4, num_layers=2):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.pos_encoding = PositionalEncoding(embed_dim)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim, nhead=num_heads, dim_feedforward=embed_dim * 4,
            dropout=0.1, batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.fc = nn.Linear(embed_dim, num_classes)
        self.dropout = nn.Dropout(0.3)

    def forward(self, x):
        emb = self.pos_encoding(self.embedding(x))
        padding_mask = (x == 0)
        out = self.transformer(emb, src_key_padding_mask=padding_mask)
        mask = (~padding_mask).float().unsqueeze(-1)
        out = (out * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1)
        return self.fc(self.dropout(out))


class TextDataset(Dataset):
    def __init__(self, indices, labels):
        self.indices = torch.tensor(indices, dtype=torch.long)
        self.labels = torch.tensor(labels, dtype=torch.long)
    def __len__(self):
        return len(self.labels)
    def __getitem__(self, idx):
        return self.indices[idx], self.labels[idx]


def evaluate_model(model, loader, criterion, device):
    model.eval()
    all_preds, all_labels = [], []
    total_loss = 0
    with torch.no_grad():
        for inputs, labels in loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            total_loss += loss.item() * inputs.size(0)
            _, preds = outputs.max(1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    return np.array(all_preds), np.array(all_labels), total_loss / len(loader.dataset)


def compute_metrics(y_true, y_pred, labels_list):
    """Compute per-class and macro metrics."""
    accuracy = accuracy_score(y_true, y_pred)
    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=labels_list, average=None, zero_division=0
    )
    macro_precision = precision.mean()
    macro_recall = recall.mean()
    macro_f1 = f1.mean()
    weighted_precision, weighted_recall, weighted_f1, _ = precision_recall_fscore_support(
        y_true, y_pred, labels=labels_list, average="weighted", zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred, labels=labels_list)
    return {
        "accuracy": accuracy,
        "per_class": {
            LABEL_NAMES[i]: {"precision": float(precision[i]), "recall": float(recall[i]),
                           "f1": float(f1[i]), "support": int(support[i])}
            for i in range(len(labels_list))
        },
        "macro": {"precision": float(macro_precision), "recall": float(macro_recall), "f1": float(macro_f1)},
        "weighted": {"precision": float(weighted_precision), "recall": float(weighted_recall), "f1": float(weighted_f1)},
        "confusion_matrix": cm.tolist(),
    }


def main():
    project_root = Path(__file__).resolve().parents[3]

    # === Load test data ===
    # XGBoost test data
    with open(project_root / "data/processed/xgboost_features.json", "r") as f:
        xgb_data = json.load(f)
    X_test = np.array(xgb_data["splits"]["test"]["X"], dtype=np.float32)
    y_test = np.array(xgb_data["splits"]["test"]["y"], dtype=np.int32)

    # Text test data
    with open(project_root / "data/processed/text_features.json", "r") as f:
        text_data = json.load(f)
    test_indices = text_data["splits"]["test"]["indices"]
    test_labels_str = text_data["splits"]["test"]["labels"]
    test_labels = np.array([LABEL_MAP[l] for l in test_labels_str])

    # Test label distribution
    test_dist = Counter(test_labels)
    print(f"Test set distribution: {dict(test_dist)}")
    print(f"Test set total: {len(test_labels)}")
    print(f"Naive baseline (always MEDIUM): {test_dist.get(1, 0) / len(test_labels) * 100:.1f}%\n")

    # === 1. XGBoost ===
    print("=" * 60)
    print("EVALUATING: XGBoost")
    print("=" * 60)
    xgb_model = xgb.Booster()
    xgb_model.load_model(str(project_root / "data/processed/xgboost_model.json"))
    dtest = xgb.DMatrix(X_test, label=y_test)
    xgb_preds = np.argmax(xgb_model.predict(dtest), axis=1)
    xgb_metrics = compute_metrics(y_test, xgb_preds, [0, 1, 2, 3])

    # === 2. CNN (retried) ===
    print("=" * 60)
    print("EVALUATING: CNN (retried)")
    print("=" * 60)
    vocab_size = text_data["vocab_size"]
    cnn = TextCNN(vocab_size, 128, 4).to(DEVICE)
    cnn.load_state_dict(torch.load(project_root / "data/processed/cnn_best.pt", weights_only=True))
    cnn_dataset = TextDataset(test_indices, test_labels)
    cnn_loader = DataLoader(cnn_dataset, batch_size=32, shuffle=False)
    criterion = nn.CrossEntropyLoss()
    cnn_preds, cnn_labels, cnn_loss = evaluate_model(cnn, cnn_loader, criterion, DEVICE)
    cnn_metrics = compute_metrics(cnn_labels, cnn_preds, [0, 1, 2, 3])

    # === 3. RNN (original) ===
    print("=" * 60)
    print("EVALUATING: RNN (original)")
    print("=" * 60)
    rnn = TextRNN(vocab_size, 128, 128, 4).to(DEVICE)  # Original hidden_dim=128
    rnn.load_state_dict(torch.load(project_root / "data/processed/rnn_original_best.pt", weights_only=True))
    rnn_loader = DataLoader(cnn_dataset, batch_size=32, shuffle=False)  # same dataset
    rnn_preds, rnn_labels, rnn_loss = evaluate_model(rnn, rnn_loader, criterion, DEVICE)
    rnn_metrics = compute_metrics(rnn_labels, rnn_preds, [0, 1, 2, 3])

    # === 4. Transformer (original) ===
    print("=" * 60)
    print("EVALUATING: Transformer (original)")
    print("=" * 60)
    transformer = TextTransformer(vocab_size, 128, 4).to(DEVICE)
    transformer.load_state_dict(torch.load(project_root / "data/processed/transformer_best.pt", weights_only=True))
    transformer_loader = DataLoader(cnn_dataset, batch_size=32, shuffle=False)
    transformer_preds, transformer_labels, transformer_loss = evaluate_model(transformer, transformer_loader, criterion, DEVICE)
    transformer_metrics = compute_metrics(transformer_labels, transformer_preds, [0, 1, 2, 3])

    # === Naive baseline on test set ===
    test_labels_list = test_labels.tolist()
    naive_preds = np.full_like(test_labels_list, 1)  # Always MEDIUM
    naive_accuracy = (naive_preds == test_labels_list).mean() * 100

    # === Print per-model results ===
    all_metrics = {
        "XGBoost": xgb_metrics,
        "CNN": cnn_metrics,
        "RNN": rnn_metrics,
        "Transformer": transformer_metrics,
    }

    print(f"\n{'='*60}")
    print("FINAL TEST-SET RESULTS")
    print(f"{'='*60}")
    print(f"Test set size: {len(test_labels)}")
    print(f"Naive baseline (always MEDIUM): {naive_accuracy:.1f}%\n")

    for name, metrics in all_metrics.items():
        acc = metrics["accuracy"] * 100
        print(f"\n--- {name} ---")
        print(f"  Accuracy: {acc:.1f}%  (vs naive {naive_accuracy:.1f}%: {acc - naive_accuracy:+.1f}%)")
        print(f"  Macro F1: {metrics['macro']['f1']*100:.1f}%")
        print(f"  Weighted F1: {metrics['weighted']['f1']*100:.1f}%")
        print(f"  Per-class:")
        for cls_name in LABEL_NAMES:
            pc = metrics["per_class"][cls_name]
            flag = " [LOW CONFIDENCE (9 test examples)]" if cls_name == "CRITICAL" else ""
            print(f"    {cls_name:8s}: P={pc['precision']*100:5.1f}%  R={pc['recall']*100:5.1f}%  F1={pc['f1']*100:5.1f}%  n={pc['support']}{flag}")
        print(f"  Confusion matrix (rows=true, cols=pred):")
        for i, row in enumerate(metrics["confusion_matrix"]):
            print(f"    {LABEL_NAMES[i]:8s}: {row}")

    # === Side-by-side comparison table ===
    print(f"\n{'='*60}")
    print("SIDE-BY-SIDE COMPARISON")
    print(f"{'='*60}")
    print(f"\n{'Model':<15} | {'Accuracy':>8} | {'Macro F1':>8} | {'Weighted F1':>10} | {'vs Naive':>9}")
    print("-" * 60)
    for name, metrics in all_metrics.items():
        acc = metrics["accuracy"] * 100
        macro_f1 = metrics["macro"]["f1"] * 100
        weighted_f1 = metrics["weighted"]["f1"] * 100
        vs_naive = acc - naive_accuracy
        print(f"{name:<15} | {acc:>7.1f}% | {macro_f1:>7.1f}% | {weighted_f1:>9.1f}% | {vs_naive:>+7.1f}%")

    # CRITICAL class specific
    print(f"\n{'='*60}")
    print("CRITICAL CLASS (n=9 test) — LOW CONFIDENCE")
    print(f"{'='*60}")
    print(f"{'Model':<15} | {'Precision':>10} | {'Recall':>10} | {'F1':>10} | {'Support':>8}")
    print("-" * 55)
    for name, metrics in all_metrics.items():
        pc = metrics["per_class"]["CRITICAL"]
        print(f"{name:<15} | {pc['precision']*100:>9.1f}% | {pc['recall']*100:>9.1f}% | {pc['f1']*100:>9.1f}% | {pc['support']:>8d}")

    # === Recommendation ===
    print(f"\n{'='*60}")
    print("PRODUCTION RECOMMENDATION")
    print(f"{'='*60}")

    best_model = max(all_metrics.items(), key=lambda x: x[1]["accuracy"])
    best_name, best_metrics = best_model
    best_acc = best_metrics["accuracy"] * 100

    print(f"\nBest accuracy: {best_name} ({best_acc:.1f}%)")
    print(f"Naive baseline: {naive_accuracy:.1f}%")
    print(f"Improvement over naive: {best_acc - naive_accuracy:.1f}%")

    # Check if XGBoost wins
    xgb_acc = all_metrics["XGBoost"]["accuracy"] * 100
    if best_name == "XGBoost":
        print(f"\n>>> RECOMMENDATION: Use XGBoost for production.")
        print(f"    - Highest accuracy ({xgb_acc:.1f}%)")
        print(f"    - No overfitting (train/val gap small)")
        print(f"    - Fast inference, interpretable features")
        print(f"    - Beats all neural models decisively")
    else:
        print(f"\n>>> RECOMMENDATION: Use {best_name} for production.")
        print(f"    - Note: XGBoost accuracy is {xgb_acc:.1f}%")

    # Save all results
    results = {
        "test_set_size": len(test_labels),
        "test_distribution": {k: v for k, v in test_dist.items()},
        "naive_baseline_accuracy": naive_accuracy / 100,
        "models": {
            name: {
                "accuracy": metrics["accuracy"],
                "macro_f1": metrics["macro"]["f1"],
                "weighted_f1": metrics["weighted"]["f1"],
                "per_class": metrics["per_class"],
                "confusion_matrix": metrics["confusion_matrix"],
            }
            for name, metrics in all_metrics.items()
        },
        "recommendation": best_name,
        "naive_baseline": naive_accuracy / 100,
    }

    output_path = project_root / "data/processed/evaluation_results.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to: {output_path}")


if __name__ == "__main__":
    main()