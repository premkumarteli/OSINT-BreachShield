import time
from .feature_extractor import URLFeatureExtractor
from .cnn_model import CNNPhishingClassifier
from .rnn_model import RNNPhishingClassifier
from .transformer_model import TransformerPhishingClassifier

try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    import torch
    HF_TRANSFORMERS_AVAILABLE = True
except ImportError:
    HF_TRANSFORMERS_AVAILABLE = False


class PhishingURLClassifier:
    """
    Main URL Phishing Detection Engine incorporating HuggingFace Transformers & CNN/RNN/Transformer Models.
    """

    def __init__(self, model_repo: str = "nhellyercreek/url-phishing-classifier"):
        self.model_repo = model_repo
        self.version = "1.2.0"
        self.hf_tokenizer = None
        self.hf_model = None

        # Instantiate architectural components
        self.cnn_engine = CNNPhishingClassifier()
        self.rnn_engine = RNNPhishingClassifier()
        self.transformer_engine = TransformerPhishingClassifier()

        # Try initializing pretrained HuggingFace classifier if available
        if HF_TRANSFORMERS_AVAILABLE:
            try:
                self.hf_tokenizer = AutoTokenizer.from_pretrained(model_repo)
                self.hf_model = AutoModelForSequenceClassification.from_pretrained(model_repo)
                self.hf_model.eval()
            except Exception:
                self.hf_tokenizer = None
                self.hf_model = None

    def analyze_url(self, url: str) -> dict:
        """Classify a single URL and return structured evaluation results."""
        start_t = time.perf_counter()
        normalized = URLFeatureExtractor.normalize_url(url)

        if not normalized:
            return {
                "url": url,
                "normalized_url": "",
                "classification": "SAFE",
                "confidence": 1.0,
                "phishing_probability": 0.0,
                "model": "Rules-Sanitizer",
                "model_version": self.version,
                "inference_latency_ms": 0
            }

        # 1. Check Pretrained HuggingFace Model
        if self.hf_model and self.hf_tokenizer:
            try:
                inputs = self.hf_tokenizer(normalized, return_tensors="pt", truncation=True, max_length=128)
                with torch.no_grad():
                    logits = self.hf_model(**inputs).logits
                    probs = torch.softmax(logits, dim=-1).squeeze().tolist()
                    phish_prob = float(probs[1]) if isinstance(probs, list) else 0.5

                classification = "PHISHING" if phish_prob >= 0.65 else ("SUSPICIOUS" if phish_prob >= 0.40 else "SAFE")
                latency_ms = int((time.perf_counter() - start_t) * 1000)
                return {
                    "url": url,
                    "normalized_url": normalized,
                    "classification": classification,
                    "confidence": round(phish_prob if classification != "SAFE" else 1.0 - phish_prob, 4),
                    "phishing_probability": round(phish_prob, 4),
                    "model": self.model_repo,
                    "model_version": self.version,
                    "inference_latency_ms": max(1, latency_ms)
                }
            except Exception:
                pass  # Fallback to internal neural models

        # 2. Ensemble prediction across Transformer, CNN, and RNN
        tr_res = self.transformer_engine.predict(normalized)
        cnn_res = self.cnn_engine.predict(normalized)
        rnn_res = self.rnn_engine.predict(normalized)

        ensemble_prob = float(0.50 * tr_res["phishing_probability"] + 0.30 * cnn_res["phishing_probability"] + 0.20 * rnn_res["phishing_probability"])
        classification = "PHISHING" if ensemble_prob >= 0.65 else ("SUSPICIOUS" if ensemble_prob >= 0.40 else "SAFE")
        latency_ms = int((time.perf_counter() - start_t) * 1000)

        return {
            "url": url,
            "normalized_url": normalized,
            "classification": classification,
            "confidence": round(ensemble_prob if classification != "SAFE" else 1.0 - ensemble_prob, 4),
            "phishing_probability": round(ensemble_prob, 4),
            "model": "BreachShield-NeuralEnsemble",
            "model_version": self.version,
            "inference_latency_ms": max(1, latency_ms)
        }

    def analyze_message_urls(self, text: str) -> list[dict]:
        """Extract and analyze all URLs present in a raw OSINT message."""
        urls = URLFeatureExtractor.extract_urls(text)
        results = []
        for u in urls:
            results.append(self.analyze_url(u))
        return results
