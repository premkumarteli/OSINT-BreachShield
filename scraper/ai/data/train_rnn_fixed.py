"""
Retrain RNN only with packed sequences + gradient clipping.
Uses the same hyperparameters as the original run.
"""

import json
import math
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from pathlib import Path
from collections import Counter
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support, confusion_matrix


EMBED_DIM = 128
HIDDEN_DIM = 64  # bidirectional = 128 effective, same as original
NUM_CLASSES = 4
BATCH_SIZE = 32
MAX_EPOCHS = 100
PATIENCE = 15
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
LABEL_NAMES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class TextDataset(Dataset):
    def __init__(self, indices, labels):
        self.indices = torch.tensor(indices, dtype=torch.long)
        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        length = (self.indices[idx] != 0).sum().item()
        return self.indices[idx], self.labels[idx], length


def collate_with_lengths(batch):
    indices, labels, lengths = zip(*batch)
    indices = torch.stack(indices)
    labels = torch.stack(labels)
    lengths = torch.tensor(lengths, dtype=torch.long)
    sorted_idx = lengths.argsort(descending=True)
    return indices[sorted_idx], labels[sorted_idx], lengths[sorted_idx]


class TextRNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_dim * 2, num_classes)
        self.dropout = nn.Dropout(0.3)

    def forward(self, x, lengths=None):
        emb = self.embedding(x)
        if lengths is not None:
            lengths_cpu = lengths.cpu().clamp(min=1)
            packed = nn.utils.rnn.pack_padded_sequence(
                emb, lengths_cpu, batch_first=True, enforce_sorted=False
            )
            _, (h_n, _) = self.lstm(packed)
        else:
            _, (h_n, _) = self.lstm(emb)

        h_forward = h_n[-2]
        h_backward = h_n[-1]
        h_cat = torch.cat([h_forward, h_backward], dim=1)
        out = self.dropout(h_cat)
        out = self.fc(out)
        return out


def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    correct = 0
    total = 0

    for inputs, labels, lengths in loader:
        inputs, labels, lengths = inputs.to(device), labels.to(device), lengths.to(device)
        optimizer.zero_grad()
        outputs = model(inputs, lengths)
        loss = criterion(outputs, labels)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        total_loss += loss.item() * inputs.size(0)
        _, predicted = outputs.max(1)
        correct += predicted.eq(labels).sum().item()
        total += labels.size(0)

    return total_loss / total, correct / total


def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss = 0
    correct = 0
    total = 0

    with torch.no_grad():
        for inputs, labels, lengths in loader:
            inputs, labels, lengths = inputs.to(device), labels.to(device), lengths.to(device)
            outputs = model(inputs, lengths)
            loss = criterion(outputs, labels)

            total_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            correct += predicted.eq(labels).sum().item()
            total += labels.size(0)

    return total_loss / total, correct / total


def main():
    project_root = Path(__file__).resolve().parents[3]

    with open(project_root / "data/processed/text_features.json", "r", encoding="utf-8") as f:
        text_data = json.load(f)

    vocab_size = text_data["vocab_size"]

    def make_loader(split_name, shuffle=False):
        indices = text_data["splits"][split_name]["indices"]
        labels = text_data["splits"][split_name]["labels"]
        label_map = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
        labels_int = [label_map[l] for l in labels]
        dataset = TextDataset(indices, labels_int)
        return DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=shuffle, collate_fn=collate_with_lengths)

    train_loader = make_loader("train", shuffle=True)
    val_loader = make_loader("val", shuffle=False)
    test_loader = make_loader("test", shuffle=False)

    # Class weights
    all_labels = text_data["splits"]["train"]["labels"]
    label_counter = Counter(all_labels)
    total = len(all_labels)
    class_weights = torch.tensor([
        total / (NUM_CLASSES * label_counter.get(LABEL_NAMES[i], 1))
        for i in range(NUM_CLASSES)
    ], dtype=torch.float).to(DEVICE)

    print(f"Class weights: {class_weights.tolist()}")
    print(f"Vocabulary size: {vocab_size}")
    print(f"Device: {DEVICE}")

    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # Train RNN
    rnn = TextRNN(vocab_size, EMBED_DIM, HIDDEN_DIM, NUM_CLASSES).to(DEVICE)
    optimizer = optim.Adam(rnn.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)

    best_val_loss = float("inf")
    best_epoch = 0
    patience_counter = 0

    train_losses = []
    val_losses = []
    train_accs = []
    val_accs = []

    print(f"\n=== Training RNN (packed sequences + gradient clipping) ===")

    for epoch in range(1, MAX_EPOCHS + 1):
        train_loss, train_acc = train_epoch(rnn, train_loader, optimizer, criterion, DEVICE)
        val_loss, val_acc = evaluate(rnn, val_loader, criterion, DEVICE)

        train_losses.append(train_loss)
        val_losses.append(val_loss)
        train_accs.append(train_acc)
        val_accs.append(val_acc)

        if epoch % 10 == 0 or epoch <= 5:
            print(f"  Epoch {epoch:3d}: train_loss={train_loss:.4f} train_acc={train_acc:.4f} val_loss={val_loss:.4f} val_acc={val_acc:.4f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_epoch = epoch
            patience_counter = 0
            ckpt_path = project_root / "data/processed/rnn_fixed_best.pt"
            torch.save(rnn.state_dict(), ckpt_path)
        else:
            patience_counter += 1
            if patience_counter >= PATIENCE:
                print(f"  Early stopping at epoch {epoch}. Best epoch: {best_epoch}")
                break

    # Load best checkpoint
    ckpt_path = project_root / "data/processed/rnn_fixed_best.pt"
    rnn.load_state_dict(torch.load(ckpt_path, weights_only=True))

    print(f"\n=== Training Summary ===")
    print(f"  Best epoch: {best_epoch}, best val_loss: {best_val_loss:.4f}")

    # Save training curves
    training_results = {
        "best_epoch": best_epoch,
        "best_val_loss": best_val_loss,
        "train_losses": train_losses,
        "val_losses": val_losses,
        "train_accs": train_accs,
        "val_accs": val_accs,
    }
    with open(project_root / "data/processed/rnn_fixed_training.json", "w") as f:
        json.dump(training_results, f, indent=2)

    # === Evaluate on test set ===
    print(f"\n=== Test Set Evaluation ===")

    rnn.eval()
    all_preds = []
    all_labels = []
    all_probs = []

    with torch.no_grad():
        for inputs, labels, lengths in test_loader:
            inputs, labels, lengths = inputs.to(DEVICE), labels.to(DEVICE), lengths.to(DEVICE)
            outputs = rnn(inputs, lengths)
            probs = torch.softmax(outputs, dim=1)
            _, predicted = outputs.max(1)

            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    all_probs = np.array(all_probs)

    # Overall metrics
    accuracy = accuracy_score(all_labels, all_preds)
    macro_f1 = f1_score(all_labels, all_preds, average='macro')
    weighted_f1 = f1_score(all_labels, all_preds, average='weighted')

    print(f"\nOverall Metrics:")
    print(f"  Accuracy:  {accuracy*100:.1f}%")
    print(f"  Macro F1:  {macro_f1*100:.1f}%")
    print(f"  Weighted F1: {weighted_f1*100:.1f}%")

    # Per-class metrics
    precision, recall, f1, support = precision_recall_fscore_support(
        all_labels, all_preds, labels=range(NUM_CLASSES), zero_division=0
    )

    print(f"\nPer-Class Metrics:")
    print(f"{'Class':>10s} | {'Precision':>9s} | {'Recall':>6s} | {'F1':>6s} | {'Support':>7s}")
    print("-" * 55)
    for i, name in enumerate(LABEL_NAMES):
        flag = " (!)" if name == "CRITICAL" else ""
        print(f"{name:>10s} | {precision[i]*100:8.1f}% | {recall[i]*100:5.1f}% | {f1[i]*100:5.1f}% | {int(support[i]):7d}{flag}")

    # Confusion matrix
    cm = confusion_matrix(all_labels, all_preds, labels=range(NUM_CLASSES))
    print(f"\nConfusion Matrix (rows=true, cols=pred):")
    for i, name in enumerate(LABEL_NAMES):
        print(f"  {name:>10s}: {cm[i].tolist()}")

    # Naive baseline comparison
    naive_acc = max(Counter(all_labels).values()) / len(all_labels)
    print(f"\nNaive baseline (always predict most common class): {naive_acc*100:.1f}%")
    print(f"vs naive: {(accuracy - naive_acc)*100:+.1f}%")

    # Save evaluation results
    eval_results = {
        "accuracy": float(accuracy),
        "macro_f1": float(macro_f1),
        "weighted_f1": float(weighted_f1),
        "per_class": {
            LABEL_NAMES[i]: {
                "precision": float(precision[i]),
                "recall": float(recall[i]),
                "f1": float(f1[i]),
                "support": int(support[i]),
            }
            for i in range(NUM_CLASSES)
        },
        "confusion_matrix": {LABEL_NAMES[i]: cm[i].tolist() for i in range(NUM_CLASSES)},
        "naive_baseline": float(naive_acc),
        "vs_naive": float(accuracy - naive_acc),
    }
    with open(project_root / "data/processed/rnn_fixed_evaluation.json", "w") as f:
        json.dump(eval_results, f, indent=2)
    print(f"\nResults saved to: data/processed/rnn_fixed_evaluation.json")


if __name__ == "__main__":
    main()
