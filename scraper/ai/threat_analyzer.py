import time
from .phishing_classifier import PhishingURLClassifier
from .entity_correlator import EntityCorrelator

class OSINTThreatAnalyzer:
    """
    Unified AI Threat Intelligence & Analysis Engine.
    Executes ML phishing detection via HuggingFace urlbert and entity extraction.
    """

    def __init__(self):
        self.phishing_classifier = PhishingURLClassifier()
        self.entity_correlator = EntityCorrelator()

    def analyze_threat_payload(self, text: str, query: str = "") -> dict:
        """Process raw OSINT text and produce AI threat intelligence."""
        start_t = time.perf_counter()

        # 1. Real HF URL Phishing Detection
        url_analyses = self.phishing_classifier.analyze_message_urls(text)
        valid_probs = [u["phishing_probability"] for u in url_analyses if u.get("phishing_probability") is not None]
        max_phish_prob = max(valid_probs, default=0.0)
        has_phishing_url = any(u.get("classification") in ["PHISHING", "SUSPICIOUS"] for u in url_analyses)

        # 2. Entity Extraction
        entities = EntityCorrelator.extract_entities(text)

        latency_ms = int((time.perf_counter() - start_t) * 1000)

        return {
            "query": query,
            "url_analyses": url_analyses,
            "max_phishing_probability": round(float(max_phish_prob), 4),
            "has_phishing_url": has_phishing_url,
            "extracted_entities": entities,
            "inference_latency_ms": max(1, latency_ms)
        }
