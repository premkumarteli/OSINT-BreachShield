import time
from .phishing_classifier import PhishingURLClassifier
from .entity_correlator import EntityCorrelator
from .model_manager import ModelManager

class OSINTThreatAnalyzer:
    """
    Unified AI Threat Intelligence & Analysis Engine.
    Executes ML phishing detection, entity extraction, and comparative model analysis.
    """

    def __init__(self):
        self.phishing_classifier = PhishingURLClassifier()
        self.entity_correlator = EntityCorrelator()
        self.model_manager = ModelManager()

    def analyze_threat_payload(self, text: str, query: str = "") -> dict:
        """Process raw OSINT text and produce comprehensive AI threat intelligence."""
        start_t = time.perf_counter()

        # 1. URL Phishing Detection
        url_analyses = self.phishing_classifier.analyze_message_urls(text)
        max_phish_prob = max([u["phishing_probability"] for u in url_analyses], default=0.0)
        has_phishing_url = any(u["classification"] in ["PHISHING", "SUSPICIOUS"] for u in url_analyses)

        # 2. Entity Extraction
        entities = EntityCorrelator.extract_entities(text)

        # 3. Model Comparison Metrics (CNN vs RNN vs Transformer)
        test_url = url_analyses[0]["url"] if url_analyses else (f"http://{query}" if "@" in query or "." in query else "http://suspicious-verify-bank.com")
        model_comparison = self.model_manager.compare_architectures(test_url)

        latency_ms = int((time.perf_counter() - start_t) * 1000)

        return {
            "query": query,
            "url_analyses": url_analyses,
            "max_phishing_probability": round(float(max_phish_prob), 4),
            "has_phishing_url": has_phishing_url,
            "extracted_entities": entities,
            "model_comparison": model_comparison,
            "inference_latency_ms": max(1, latency_ms)
        }
