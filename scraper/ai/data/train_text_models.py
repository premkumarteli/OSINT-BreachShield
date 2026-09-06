"""
STEP 3b: Train CNN, RNN, and Transformer on Description text.

All 3 models share:
- Input: tokenized descriptions (indices, padded to 128)
- Embedding: trained from scratch (vocab_size=1873, embed_dim=128)
- Output: 4-class softmax (LOW/MEDIUM/HIGH/CRITICAL)
- Loss: CrossEntropyLoss with class weights
- Optimizer: Adam
- Early stopping on val loss (patience=15)
- Checkpoint best epoch (not last)

Models:
- CNN: Embedding -> Conv1D -> GlobalMaxPool -> Dense -> Output
- RNN: Embedding -> LSTM -> Dense -> Output
- Transformer: Embedding -> PositionalEncoding -> TransformerEncoder -> GlobalAvgPool -> Dense -> Output
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


# Config
EMBED_DIM = 128
HIDDEN_DIM = 64  # Reduced from 128 → 64 (bidirectional = 128 effective) to match dataset size
NUM_CLASSES = 4
BATCH_SIZE = 32
MAX_EPOCHS = 100
PATIENCE = 15
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4  # Added for regularization
LABEL_NAMES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class TextDataset(Dataset):
    def __init__(self, indices, labels, return_lengths=False):
        self.indices = torch.tensor(indices, dtype=torch.long)
        self.labels = torch.tensor(labels, dtype=torch.long)
        self.return_lengths = return_lengths

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        if self.return_lengths:
            length = (self.indices[idx] != 0).sum().item()
            return self.indices[idx], self.labels[idx], length
        return self.indices[idx], self.labels[idx]


# === Models ===

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
        # x: (batch, seq_len)
        emb = self.embedding(x)  # (batch, seq_len, embed_dim)
        emb = emb.transpose(1, 2)  # (batch, embed_dim, seq_len)

        conv_outputs = []
        for conv in self.convs:
            c = torch.relu(conv(emb))  # (batch, num_filters, seq_len - k + 1)
            c = torch.max(c, dim=2)[0]  # (batch, num_filters)
            conv_outputs.append(c)

        out = torch.cat(conv_outputs, dim=1)  # (batch, num_filters * 3)
        out = self.dropout(out)
        out = self.fc(out)
        return out


class TextRNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_dim * 2, num_classes)
        self.dropout = nn.Dropout(0.3)
        self.needs_lengths = True

    def forward(self, x, lengths=None):
        # x: (batch, seq_len)
        emb = self.embedding(x)  # (batch, seq_len, embed_dim)

        if lengths is not None:
            lengths_cpu = lengths.cpu().clamp(min=1)
            packed = nn.utils.rnn.pack_padded_sequence(
                emb, lengths_cpu, batch_first=True, enforce_sorted=False
            )
            _, (h_n, _) = self.lstm(packed)
        else:
            _, (h_n, _) = self.lstm(emb)

        # Use final hidden state (forward + backward)
        h_forward = h_n[-2]  # (batch, hidden)
        h_backward = h_n[-1]  # (batch, hidden)
        h_cat = torch.cat([h_forward, h_backward], dim=1)  # (batch, hidden*2)

        out = self.dropout(h_cat)
        out = self.fc(out)
        return out


class PositionalEncoding(nn.Module):
    def __init__(self, embed_dim, max_len=128):
        super().__init__()
        pe = torch.zeros(max_len, embed_dim)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, embed_dim, 2).float() * (-math.log(10000.0) / embed_dim))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # (1, max_len, embed_dim)
        self.register_buffer("pe", pe)

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
        # x: (batch, seq_len)
        emb = self.embedding(x)  # (batch, seq_len, embed_dim)
        emb = self.pos_encoding(emb)

        # Create padding mask (True = ignore)
        padding_mask = (x == 0)  # (batch, seq_len)

        out = self.transformer(emb, src_key_padding_mask=padding_mask)  # (batch, seq_len, embed_dim)

        # Global average pooling (excluding padding)
        mask = (~padding_mask).float().unsqueeze(-1)  # (batch, seq_len, 1)
        out = (out * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1)  # (batch, embed_dim)

        out = self.dropout(out)
        out = self.fc(out)
        return out


# === Training ===

def collate_with_lengths(batch):
    """Collate for RNN: returns (indices, labels, lengths) sorted by length desc."""
    indices, labels, lengths = zip(*batch)
    indices = torch.stack(indices)
    labels = torch.stack(labels)
    lengths = torch.tensor(lengths, dtype=torch.long)
    # Sort by length descending (required for pack_padded_sequence)
    sorted_idx = lengths.argsort(descending=True)
    return indices[sorted_idx], labels[sorted_idx], lengths[sorted_idx]


def collate_no_lengths(batch):
    """Collate for CNN/Transformer: returns (indices, labels)."""
    indices, labels = zip(*batch)
    return torch.stack(indices), torch.stack(labels)


def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    correct = 0
    total = 0
    use_lengths = getattr(model, 'needs_lengths', False)

    for batch in loader:
        if use_lengths:
            inputs, labels, lengths = batch
            inputs, labels, lengths = inputs.to(device), labels.to(device), lengths.to(device)
        else:
            inputs, labels = batch
            inputs, labels = inputs.to(device), labels.to(device)

        optimizer.zero_grad()
        if use_lengths:
            outputs = model(inputs, lengths)
        else:
            outputs = model(inputs)
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
    use_lengths = getattr(model, 'needs_lengths', False)

    with torch.no_grad():
        for batch in loader:
            if use_lengths:
                inputs, labels, lengths = batch
                inputs, labels, lengths = inputs.to(device), labels.to(device), lengths.to(device)
            else:
                inputs, labels = batch
                inputs, labels = inputs.to(device), labels.to(device)

            if use_lengths:
                outputs = model(inputs, lengths)
            else:
                outputs = model(inputs)
            loss = criterion(outputs, labels)

            total_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            correct += predicted.eq(labels).sum().item()
            total += labels.size(0)

    return total_loss / total, correct / total


def train_model(model, train_loader, val_loader, criterion, optimizer, model_name, project_root):
    """Train with early stopping, checkpoint best epoch."""
    best_val_loss = float("inf")
    best_epoch = 0
    patience_counter = 0

    train_losses = []
    val_losses = []
    train_accs = []
    val_accs = []

    print(f"\n=== Training {model_name} ===")

    for epoch in range(1, MAX_EPOCHS + 1):
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, DEVICE)
        val_loss, val_acc = evaluate(model, val_loader, criterion, DEVICE)

        train_losses.append(train_loss)
        val_losses.append(val_loss)
        train_accs.append(train_acc)
        val_accs.append(val_acc)

        if epoch % 10 == 0 or epoch <= 5:
            print(f"  Epoch {epoch:3d}: train_loss={train_loss:.4f} train_acc={train_acc:.4f} val_loss={val_loss:.4f} val_acc={val_acc:.4f}")

        # Early stopping
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_epoch = epoch
            patience_counter = 0
            # Checkpoint
            ckpt_path = project_root / f"data/processed/{model_name}_best.pt"
            torch.save(model.state_dict(), ckpt_path)
        else:
            patience_counter += 1
            if patience_counter >= PATIENCE:
                print(f"  Early stopping at epoch {epoch}. Best epoch: {best_epoch}")
                break

    # Load best checkpoint
    ckpt_path = project_root / f"data/processed/{model_name}_best.pt"
    model.load_state_dict(torch.load(ckpt_path, weights_only=True))

    print(f"  Best epoch: {best_epoch}, best val_loss: {best_val_loss:.4f}")

    return {
        "best_epoch": best_epoch,
        "best_val_loss": best_val_loss,
        "train_losses": train_losses,
        "val_losses": val_losses,
        "train_accs": train_accs,
        "val_accs": val_accs,
    }


def main():
    project_root = Path(__file__).resolve().parents[3]

    # Load text features
    with open(project_root / "data/processed/text_features.json", "r", encoding="utf-8") as f:
        text_data = json.load(f)

    vocab_size = text_data["vocab_size"]
    max_seq_len = text_data["max_seq_len"]

    # Prepare data loaders
    def make_loader(split_name, shuffle=False, return_lengths=False):
        indices = text_data["splits"][split_name]["indices"]
        labels = text_data["splits"][split_name]["labels"]
        # Map string labels to integers
        label_map = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
        labels_int = [label_map[l] for l in labels]
        dataset = TextDataset(indices, labels_int, return_lengths=return_lengths)
        collate_fn = collate_with_lengths if return_lengths else collate_no_lengths
        return DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=shuffle, collate_fn=collate_fn)

    # CNN/Transformer loaders (no lengths)
    train_loader = make_loader("train", shuffle=True)
    val_loader = make_loader("val", shuffle=False)
    # RNN loaders (with lengths, sorted descending)
    rnn_train_loader = make_loader("train", shuffle=True, return_lengths=True)
    rnn_val_loader = make_loader("val", shuffle=False, return_lengths=True)

    # Class weights (inversely proportional to frequency)
    all_labels = text_data["splits"]["train"]["labels"]
    label_counter = Counter(all_labels)
    total = len(all_labels)
    num_classes = 4
    class_weights = torch.tensor([
        total / (num_classes * label_counter.get(LABEL_NAMES[i], 1))
        for i in range(num_classes)
    ], dtype=torch.float).to(DEVICE)

    print(f"Class weights: {class_weights.tolist()}")
    print(f"Vocabulary size: {vocab_size}")
    print(f"Max sequence length: {max_seq_len}")
    print(f"Device: {DEVICE}")

    criterion = nn.CrossEntropyLoss(weight=class_weights)

    results = {}

    # Train CNN
    cnn = TextCNN(vocab_size, EMBED_DIM, NUM_CLASSES).to(DEVICE)
    cnn_optimizer = optim.Adam(cnn.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    cnn_results = train_model(cnn, train_loader, val_loader, criterion, cnn_optimizer, "cnn", project_root)
    results["cnn"] = cnn_results

    # Train RNN (LSTM)
    rnn = TextRNN(vocab_size, EMBED_DIM, HIDDEN_DIM, NUM_CLASSES).to(DEVICE)
    rnn_optimizer = optim.Adam(rnn.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    rnn_results = train_model(rnn, rnn_train_loader, rnn_val_loader, criterion, rnn_optimizer, "rnn", project_root)
    results["rnn"] = rnn_results

    # Train Transformer
    transformer = TextTransformer(vocab_size, EMBED_DIM, NUM_CLASSES).to(DEVICE)
    transformer_optimizer = optim.Adam(transformer.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    transformer_results = train_model(transformer, train_loader, val_loader, criterion, transformer_optimizer, "transformer", project_root)
    results["transformer"] = transformer_results

    # Save all results
    output_path = project_root / "data/processed/text_model_training.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nTraining results saved to: {output_path}")

    # Summary
    print(f"\n=== Training Summary ===")
    for name in ["cnn", "rnn", "transformer"]:
        r = results[name]
        print(f"  {name.upper():12s}: best_epoch={r['best_epoch']:3d}, best_val_loss={r['best_val_loss']:.4f}, final_val_acc={r['val_accs'][-1]:.4f}")


if __name__ == "__main__":
    main()
