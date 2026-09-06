import time
from .feature_extractor import URLFeatureExtractor

try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    import torch
    HF_TRANSFORMERS_AVAILABLE = True
except ImportError:
    HF_TRANSFORMERS_AVAILABLE = False


class PhishingURLClassifier:
    """
    URL Phishing Detection Engine using CrabInHoney/urlbert-tiny-v4-phishing-classifier.
    LABEL_0: good / safe
    LABEL_1: fish / phishing
    """

    def __init__(self, model_repo: str = "CrabInHoney/urlbert-tiny-v4-phishing-classifier"):
        self.model_repo = model_repo
        self.version = "1.3.0"
        self.hf_tokenizer = None
        self.hf_model = None

        if HF_TRANSFORMERS_AVAILABLE:
            try:
                self.hf_tokenizer = AutoTokenizer.from_pretrained(model_repo)
                self.hf_model = AutoModelForSequenceClassification.from_pretrained(model_repo)
                self.hf_model.eval()
            except Exception as e:
                self.hf_tokenizer = None
                self.hf_model = None
                print(f"[PhishingURLClassifier Warning] Failed to load model {model_repo}: {e}")

    def analyze_url(self, url: str) -> dict:
        """Classify a single URL using CrabInHoney/urlbert-tiny-v4-phishing-classifier."""
        start_t = time.perf_counter()
        normalized = URLFeatureExtractor.normalize_url(url)

        if not normalized:
            return {
                "url": url,
                "normalized_url": "",
                "classification": "SAFE",
                "confidence": 1.0,
                "phishing_probability": 0.0,
                "model": self.model_repo,
                "model_version": self.version,
                "inference_latency_ms": 0,
                "error": None
            }

        # Model must be loaded; if not, return explicit error/null
        if not (self.hf_model and self.hf_tokenizer):
            return {
                "url": url,
                "normalized_url": normalized,
                "classification": None,
                "confidence": None,
                "phishing_probability": None,
                "model": self.model_repo,
                "model_version": self.version,
                "inference_latency_ms": 0,
                "error": "Hugging Face model failed to load or is unavailable"
            }

        try:
            inputs = self.hf_tokenizer(normalized, return_tensors="pt", truncation=True, max_length=128)
            with torch.no_grad():
                logits = self.hf_model(**inputs).logits
                probs = torch.softmax(logits, dim=-1).squeeze().tolist()
                
                # Label mapping: LABEL_0 = safe, LABEL_1 = phishing
                safe_prob = float(probs[0])
                phish_prob = float(probs[1])

            if phish_prob >= 0.65:
                classification = "PHISHING"
                confidence = phish_prob
            elif phish_prob >= 0.40:
                classification = "SUSPICIOUS"
                confidence = phish_prob
            else:
                classification = "SAFE"
                confidence = safe_prob

            latency_ms = int((time.perf_counter() - start_t) * 1000)
            return {
                "url": url,
                "normalized_url": normalized,
                "classification": classification,
                "confidence": round(confidence, 4),
                "phishing_probability": round(phish_prob, 4),
                "model": self.model_repo,
                "model_version": self.version,
                "inference_latency_ms": max(1, latency_ms),
                "error": None
            }
        except Exception as e:
            return {
                "url": url,
                "normalized_url": normalized,
                "classification": None,
                "confidence": None,
                "phishing_probability": None,
                "model": self.model_repo,
                "model_version": self.version,
                "inference_latency_ms": int((time.perf_counter() - start_t) * 1000),
                "error": f"Inference error: {str(e)}"
            }

    def analyze_message_urls(self, text: str) -> list[dict]:
        """Extract and analyze all URLs present in a raw OSINT message."""
        urls = URLFeatureExtractor.extract_urls(text)
        results = []
        for u in urls:
            results.append(self.analyze_url(u))
        return results
