"""
STEP 2: Text preparation for CNN/RNN/Transformer models.

Pipeline:
1. Strip HTML tags/links from Description
2. Tokenize (whitespace + lowercase, no external tokenizer)
3. Build vocabulary from training set only
4. Pad/truncate to fixed sequence length
5. Same train/val/test split as the rest of the dataset

Output:
- data/processed/text_features.json — tokenized data + vocabulary
"""

import json
import re
from pathlib import Path
from collections import Counter


# Config
MAX_SEQ_LEN = 128  # Truncate/pad all descriptions to this length
MIN_FREQ = 2       # Minimum frequency to include word in vocab
UNK_TOKEN = "<unk>"
PAD_TOKEN = "<pad>"
SOS_TOKEN = "<sos>"
EOS_TOKEN = "<eos>"


def strip_html(text: str) -> str:
    """Remove HTML tags and links from text."""
    # Remove <a> tags but keep link text
    text = re.sub(r'<a[^>]*>(.*?)</a>', r'\1', text, flags=re.DOTALL)
    # Remove all other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Remove URLs
    text = re.sub(r'https?://\S+', '', text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def tokenize(text: str) -> list[str]:
    """Simple whitespace + lowercase tokenization."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)  # Keep only alphanumeric
    text = re.sub(r'\s+', ' ', text).strip()
    return text.split()


def build_vocab(tokenized_texts: list[list[str]], min_freq: int = MIN_FREQ) -> dict:
    """Build vocabulary from training set only."""
    counter = Counter()
    for tokens in tokenized_texts:
        counter.update(tokens)

    # Build vocab: special tokens + words meeting min_freq
    vocab = {
        PAD_TOKEN: 0,
        UNK_TOKEN: 1,
        SOS_TOKEN: 2,
        EOS_TOKEN: 3,
    }

    idx = 4
    for word, freq in counter.most_common():
        if freq >= min_freq:
            vocab[word] = idx
            idx += 1

    return vocab


def encode_tokens(tokens: list[str], vocab: dict, max_len: int) -> list[int]:
    """Encode tokens to indices, pad/truncate to max_len."""
    indices = []
    for t in tokens:
        indices.append(vocab.get(t, vocab[UNK_TOKEN]))

    # Truncate
    indices = indices[:max_len]

    # Pad
    while len(indices) < max_len:
        indices.append(vocab[PAD_TOKEN])

    return indices


def load_split(project_root: Path, split_name: str) -> list[dict]:
    with open(project_root / f"data/processed/{split_name}.json", "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    project_root = Path(__file__).resolve().parents[3]

    # Load splits
    train_records = load_split(project_root, "train")
    val_records = load_split(project_root, "val")
    test_records = load_split(project_root, "test")

    print(f"Loaded splits: train={len(train_records)}, val={len(val_records)}, test={len(test_records)}")

    # Step 1: Strip HTML and show raw -> cleaned examples
    print(f"\n=== HTML stripping examples ===")
    for r in train_records[:3]:
        raw = r.get("Description", "")
        cleaned = strip_html(raw)
        print(f"\n  Name: {r['Name']}")
        print(f"  Raw (first 200 chars): {raw[:200]}")
        print(f"  Cleaned (first 200 chars): {cleaned[:200]}")

    # Step 2: Tokenize all descriptions
    train_descs = [strip_html(r.get("Description", "")) for r in train_records]
    val_descs = [strip_html(r.get("Description", "")) for r in val_records]
    test_descs = [strip_html(r.get("Description", "")) for r in test_records]

    train_tokens = [tokenize(d) for d in train_descs]
    val_tokens = [tokenize(d) for d in val_descs]
    test_tokens = [tokenize(d) for d in test_descs]

    # Step 3: Build vocabulary from training set only
    vocab = build_vocab(train_tokens, min_freq=MIN_FREQ)
    print(f"\nVocabulary size: {len(vocab)} (min_freq={MIN_FREQ})")

    # Step 4: Encode
    train_indices = [encode_tokens(t, vocab, MAX_SEQ_LEN) for t in train_tokens]
    val_indices = [encode_tokens(t, vocab, MAX_SEQ_LEN) for t in val_tokens]
    test_indices = [encode_tokens(t, vocab, MAX_SEQ_LEN) for t in test_tokens]

    # Step 5: Show 3 example tokenized descriptions
    LABEL_NAMES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    print(f"\n=== 3 example tokenized descriptions ===")
    for i in range(3):
        r = train_records[i]
        tokens = train_tokens[i]
        indices = train_indices[i]
        # Show first 20 tokens
        print(f"\n  [{i}] {r['Name']} (severity={r['severity']})")
        print(f"      Tokens ({len(tokens)} total): {tokens[:20]}{'...' if len(tokens) > 20 else ''}")
        print(f"      Indices (first 20): {indices[:20]}")

    # Step 6: Sequence length statistics
    lengths = [len(t) for t in train_tokens]
    print(f"\n=== Sequence length statistics (training set) ===")
    print(f"  Mean: {sum(lengths)/len(lengths):.1f}")
    print(f"  Median: {sorted(lengths)[len(lengths)//2]}")
    print(f"  Max: {max(lengths)}")
    print(f"  Min: {min(lengths)}")
    print(f"  Truncated to {MAX_SEQ_LEN}: {sum(1 for l in lengths if l > MAX_SEQ_LEN)} records")

    # Save
    output = {
        "vocab": vocab,
        "vocab_size": len(vocab),
        "max_seq_len": MAX_SEQ_LEN,
        "min_freq": MIN_FREQ,
        "special_tokens": {
            "pad": PAD_TOKEN,
            "unk": UNK_TOKEN,
            "sos": SOS_TOKEN,
            "eos": EOS_TOKEN,
        },
        "splits": {
            "train": {
                "indices": train_indices,
                "labels": [r["severity"] for r in train_records],
                "names": [r["Name"] for r in train_records],
            },
            "val": {
                "indices": val_indices,
                "labels": [r["severity"] for r in val_records],
                "names": [r["Name"] for r in val_records],
            },
            "test": {
                "indices": test_indices,
                "labels": [r["severity"] for r in test_records],
                "names": [r["Name"] for r in test_records],
            },
        },
    }

    output_path = project_root / "data/processed/text_features.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f)
    print(f"\nSaved to: {output_path}")


if __name__ == "__main__":
    main()
