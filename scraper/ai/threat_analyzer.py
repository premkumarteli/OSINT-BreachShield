import time


class OSINTThreatAnalyzer:
    """
    Unified AI Threat Intelligence & Analysis Engine.
    Runs all 5 models (HF urlbert, CNN, RNN, Transformer, entity correlator)
    and produces an ensemble verdict.
    Heavy model imports are deferred until first use.
    """

    def __init__(self):
        self._phishing_classifier = None
        self._entity_correlator = None
        self._severity_classifier = None
        self._cnn = None
        self._rnn = None
        self._transformer = None
        self._xgboost = None

    @property
    def phishing_classifier(self):
        if self._phishing_classifier is None:
            from .phishing_classifier import PhishingURLClassifier
            self._phishing_classifier = PhishingURLClassifier()
        return self._phishing_classifier

    @property
    def entity_correlator(self):
        if self._entity_correlator is None:
            from .entity_correlator import EntityCorrelator
            self._entity_correlator = EntityCorrelator()
        return self._entity_correlator

    @property
    def severity_classifier(self):
        if self._severity_classifier is None:
            from .severity_classifier import SeverityClassifier
            self._severity_classifier = SeverityClassifier()
        return self._severity_classifier

    @property
    def cnn(self):
        if self._cnn is None:
            try:
                from .cnn_model import CNNPhishingClassifier
                self._cnn = CNNPhishingClassifier()
            except Exception:
                self._cnn = None
        return self._cnn

    @property
    def rnn(self):
        if self._rnn is None:
            try:
                from .rnn_model import RNNPhishingClassifier
                self._rnn = RNNPhishingClassifier()
            except Exception:
                self._rnn = None
        return self._rnn

    @property
    def transformer(self):
        if self._transformer is None:
            try:
                from .transformer_model import TransformerPhishingClassifier
                self._transformer = TransformerPhishingClassifier()
            except Exception:
                self._transformer = None
        return self._transformer

    @property
    def xgboost(self):
        if self._xgboost is None:
            try:
                from .xgboost_model import XGBoostPhishingClassifier
                self._xgboost = XGBoostPhishingClassifier()
            except Exception:
                self._xgboost = None
        return self._xgboost

    def analyze_threat_payload(self, text: str, query: str = "") -> dict:
        """Process raw OSINT text and produce AI threat intelligence."""
        start_t = time.perf_counter()

        url_analyses = self.phishing_classifier.analyze_message_urls(text)
        valid_probs = [u["phishing_probability"] for u in url_analyses if u.get("phishing_probability") is not None]
        max_phish_prob = max(valid_probs, default=0.0)
        has_phishing_url = any(u.get("classification") in ["PHISHING", "SUSPICIOUS"] for u in url_analyses)

        entities = self.entity_correlator.extract_entities(text)

        severity = self.severity_classifier.classify(text, query=query)
        severity_analysis = severity if severity.get("success") else None

        latency_ms = int((time.perf_counter() - start_t) * 1000)

        return {
            "query": query,
            "url_analyses": url_analyses,
            "max_phishing_probability": round(float(max_phish_prob), 4),
            "has_phishing_url": has_phishing_url,
            "extracted_entities": entities,
            "severity_analysis": severity_analysis,
            "inference_latency_ms": max(1, latency_ms)
        }

    def compare_models(self, url: str) -> dict:
        """Run all 5 ML models on a single URL and return ensemble verdict.

        The ensemble verdict averages probabilities from the 4 validated models
        (HF UrlBERT, CNN, RNN, Transformer). The synthetic XGBoost model is
        included in the results for comparison but its probability is NOT folded
        into the ensemble average, because it was trained on 20 hardcoded URLs
        with no held-out test set and its accuracy is unknown.
        """
        start_t = time.perf_counter()
        results = {}
        phishing_count = 0
        total_prob = 0.0
        total_models = 0

        # Models whose probabilities feed the ensemble verdict (validated models only)
        ensemble_model_keys = {"hf_urlbert", "cnn", "rnn", "transformer"}

        models = [
            ("hf_urlbert", self.phishing_classifier),
            ("cnn", self.cnn),
            ("rnn", self.rnn),
            ("transformer", self.transformer),
            ("xgboost", self.xgboost),
        ]

        for key, model in models:
            if model is None:
                continue
            try:
                # PhishingURLClassifier uses analyze_url(); CNN/RNN/Transformer/XGBoost use predict()
                if hasattr(model, 'analyze_url'):
                    result = model.analyze_url(url)
                else:
                    result = model.predict(url)
                results[key] = result
                # Only include validated models in the ensemble average
                if key in ensemble_model_keys:
                    prob = result.get("phishing_probability") or result.get("confidence") or 0
                    total_prob += prob
                    total_models += 1
                    if result.get("classification") in ("PHISHING", "SUSPICIOUS"):
                        phishing_count += 1
            except Exception as e:
                results[key] = {"error": str(e)}

        avg_prob = total_prob / max(total_models, 1)
        if avg_prob >= 0.65:
            ensemble_class = "PHISHING"
        elif avg_prob >= 0.40:
            ensemble_class = "SUSPICIOUS"
        else:
            ensemble_class = "SAFE"

        latency_ms = int((time.perf_counter() - start_t) * 1000)

        return {
            "url": url,
            "models": results,
            "ensemble": {
                "classification": ensemble_class,
                "phishing_probability": round(avg_prob, 4),
                "model_count": total_models,
                "phishing_votes": phishing_count,
                "note": "Ensemble averages 4 validated models (HF UrlBERT, CNN, RNN, Transformer). XGBoost shown separately — trained on synthetic data with no validated accuracy.",
            },
            "inference_latency_ms": latency_ms,
        }
