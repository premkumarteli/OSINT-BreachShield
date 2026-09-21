"""
Production severity classifier backed by the REAL trained text models.

Loads the genuine CNN / RNN / Transformer checkpoints that were trained on
breach description text (4-class severity: LOW/MEDIUM/HIGH/CRITICAL) and
produces an ensemble verdict. Architectures and tokenizer exactly mirror
scraper/ai/data/train_text_models.py and prepare_text.py so that the saved
state dicts load cleanly.

Model quality is honest but modest (test/val accuracy ~45-73%). These results
are reported alongside predictions so consumers can weigh confidence.
"""

import json
import math
import re
import time
import warnings
from pathlib import Path

# PyTorch ≥2.3 emits a prototype warning when TransformerEncoder uses nested
# tensors (it does this whenever a src_key_padding_mask is passed). Harmless.
warnings.filterwarnings("ignore", message=".*nested tensors.*", category=UserWarning)
warnings.filterwarnings("ignore", message=".*layout=torch.jagged.*", category=UserWarning)

LABEL_NAMES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
LABEL_MAP = {name: i for i, name in enumerate(LABEL_NAMES)}

# Verified on real checkpoints during audit (data/processed/*_best.pt)
MODEL_METADATA = {
    "cnn": {
        "checkpoint": "cnn_best.pt",
        "best_val_acc": 0.7338,
        "note": "TextCNN, 64 filters, kernels (3,4,5)",
    },
    "rnn": {
        "checkpoint": "rnn_fixed_best.pt",
        "test_acc": 0.4459,
        "macro_f1": 0.3397,
        "note": "TextRNN (LSTM), hidden=64 bidirectional, correct pack/grad-clip retrain",
    },
    "transformer": {
        "checkpoint": "transformer_best.pt",
        "best_val_acc": 0.6753,
        "note": "TextTransformer, embed=128, 4 heads, 2 layers",
    },
}


class SeverityClassifier:
    """
    Loads the real trained CNN/RNN/Transformer weights and classifies breach
    text severity. Heavy imports (torch) deferred until first use so the
    service still boots when torch is unavailable.
    """

    def __init__(self):
        self._torch = None
        self._nn = None
        self._vocab = None
        self._max_seq_len = None
        self._models = None
        self._loaded = False
        self._device = None
        self._text_features_path = self._pa_path() / "data" / "processed" / "text_features.json"
        self._checkpoint_dir = self._pa_path() / "data" / "processed"

    @staticmethod
    def _pa_path():
        # scraper/ai/severity_classifier.py -> project root (parents[2])
        return Path(__file__).resolve().parents[2]

    @staticmethod
    def strip_html(text):
        text = re.sub(r"<a[^>]*>(.*?)</a>", r"\1", text, flags=re.DOTALL)
        text = re.sub(r"<[^>]+>", "", text)
        text = re.sub(r"https?://\S+", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    @staticmethod
    def tokenize(text):
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text.split()

    def encode_tokens(self, tokens):
        indices = [self._vocab.get(t, self._vocab["<unk>"]) for t in tokens]
        indices = indices[: self._max_seq_len]
        indices += [self._vocab["<pad>"]] * (self._max_seq_len - len(indices))
        return indices

    def _available(self):
        self._ensure_loaded()
        return self._models is not None

    def _ensure_loaded(self):
        if not self._loaded:
            self._loaded = True
            self._load()

    def _load(self):
        if self._models is not None:
            return
        try:
            import torch
            import torch.nn as nn
            import torch.nn.functional as F  # noqa: F401
            torch = torch
            self._torch = torch
            self._nn = nn
        except Exception:
            self._models = None
            return

        try:
            with open(self._text_features_path, "r", encoding="utf-8") as f:
                text_data = json.load(f)
            self._vocab = text_data["vocab"]
            self._max_seq_len = text_data["max_seq_len"]
            self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        except Exception:
            self._models = None
            return

        nn = self._nn
        vocab_size = len(self._vocab)
        embed_dim = 128
        hidden_dim = 64
        num_classes = 4

        class TextCNN(nn.Module):
            def __init__(self):
                super().__init__()
                self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
                self.convs = nn.ModuleList([nn.Conv1d(embed_dim, 64, k) for k in (3, 4, 5)])
                self.fc = nn.Linear(64 * 3, num_classes)
                self.dropout = nn.Dropout(0.3)

            def forward(self, x):
                emb = self.embedding(x).transpose(1, 2)
                conv_outputs = []
                for conv in self.convs:
                    c = torch.relu(conv(emb))
                    conv_outputs.append(torch.max(c, dim=2)[0])
                out = self.dropout(torch.cat(conv_outputs, dim=1))
                return self.fc(out)

        class TextRNN(nn.Module):
            def __init__(self):
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
            def __init__(self, dim, max_len=128):
                super().__init__()
                pe = torch.zeros(max_len, dim)
                position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
                div_term = torch.exp(torch.arange(0, dim, 2).float() * (-math.log(10000.0) / dim))
                pe[:, 0::2] = torch.sin(position * div_term)
                pe[:, 1::2] = torch.cos(position * div_term)
                pe = pe.unsqueeze(0)
                self.register_buffer("pe", pe)

            def forward(self, x):
                return x + self.pe[:, : x.size(1)]

        class TextTransformer(nn.Module):
            def __init__(self):
                super().__init__()
                self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
                self.pos_encoding = PositionalEncoding(embed_dim)
                encoder_layer = nn.TransformerEncoderLayer(
                    d_model=embed_dim, nhead=4, dim_feedforward=embed_dim * 4,
                    dropout=0.1, batch_first=True,
                )
                self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=2)
                self.fc = nn.Linear(embed_dim, num_classes)
                self.dropout = nn.Dropout(0.3)

            def forward(self, x):
                emb = self.pos_encoding(self.embedding(x))
                padding_mask = x == 0
                if padding_mask.any():
                    out = self.transformer(emb, src_key_padding_mask=padding_mask)
                else:
                    out = self.transformer(emb)
                mask = (~padding_mask).float().unsqueeze(-1)
                out = (out * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1)
                return self.fc(self.dropout(out))

        definitions = [("cnn", TextCNN, "cnn_best.pt"), ("rnn", TextRNN, "rnn_fixed_best.pt"), ("transformer", TextTransformer, "transformer_best.pt")]
        models = {}
        for name, cls, ckpt in definitions:
            try:
                model = cls().to(self._device)
                ckpt_path = self._checkpoint_dir / ckpt
                if not ckpt_path.exists():
                    continue
                state = torch.load(ckpt_path, map_location=self._device, weights_only=True)
                model.load_state_dict(state)
                model.eval()
                models[name] = model
            except Exception:
                continue
        self._models = models if models else None

    def classify(self, text, query=""):
        """Return severity verdict for breach description text."""
        self._ensure_loaded()
        if self._models is None:
            return {
                "success": False,
                "available": False,
                "reason": "trained severity checkpoints unavailable (torch/vocab/weights missing)",
            }
        start_t = time.perf_counter()
        if not text or not text.strip():
            return {"success": False, "available": True, "reason": "empty text"}

        seq = self._torch.tensor(
            [self.encode_tokens(self.tokenize(self.strip_html(text)))], dtype=self._torch.long, device=self._device
        )

        per_model = {}
        votes = [0.0] * len(LABEL_NAMES)
        with self._torch.no_grad():
            for name, model in self._models.items():
                logits = model(seq)
                probs = self._torch.softmax(logits, dim=-1)[0]
                idx = int(probs.argmax())
                per_model[name] = {
                    "severity": LABEL_NAMES[idx],
                    "probabilities": {LABEL_NAMES[i]: round(float(probs[i]), 4) for i in range(len(LABEL_NAMES))},
                    "checkpoint": MODEL_METADATA[name]["checkpoint"],
                }
                votes[idx] += float(probs[idx])

        ensemble_idx = max(range(len(votes)), key=lambda i: votes[i])
        latency_ms = int((time.perf_counter() - start_t) * 1000)

        return {
            "success": True,
            "available": True,
            "query": query,
            "ensemble": {
                "severity": LABEL_NAMES[ensemble_idx],
                "confidence_sum": round(sum(votes), 4),
                "model_count": len(self._models),
            },
            "per_model": per_model,
            "model_metadata": {k: v for k, v in MODEL_METADATA.items() if k in self._models},
            "inference_latency_ms": max(1, latency_ms),
        }


_severity_classifier = None


def get_severity_classifier():
    global _severity_classifier
    if _severity_classifier is None:
        _severity_classifier = SeverityClassifier()
    return _severity_classifier