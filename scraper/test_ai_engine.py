import pytest
import time
from ai.feature_extractor import URLFeatureExtractor
from ai.phishing_classifier import PhishingURLClassifier
from ai.cnn_model import CNNPhishingClassifier
from ai.rnn_model import RNNPhishingClassifier
from ai.transformer_model import TransformerPhishingClassifier
from ai.entity_correlator import EntityCorrelator
from ai.threat_analyzer import OSINTThreatAnalyzer
from ai.model_manager import ModelManager


def test_url_feature_extractor():
    url = "http://paypal-verify-login.xyz/auth?user=test"
    norm = URLFeatureExtractor.normalize_url(url)
    assert norm.startswith("http://")
    
    feats = URLFeatureExtractor.extract_lexical_features(url)
    assert feats['has_suspicious_tld'] == 1.0
    assert feats['keyword_hits'] >= 2
    
    vec = URLFeatureExtractor.get_feature_vector(url)
    assert len(vec) == 17
    
    seq = URLFeatureExtractor.encode_char_sequence(url, max_len=128)
    assert len(seq) == 128


def test_cnn_classifier():
    cnn = CNNPhishingClassifier()
    res = cnn.predict("http://paypal-verify-login.xyz/auth")
    assert res["architecture"] == "CNN"
    assert res["classification"] in ["PHISHING", "SUSPICIOUS", "SAFE"]
    assert "inference_latency_ms" in res
    assert res["parameter_count"] > 0


def test_rnn_classifier():
    rnn = RNNPhishingClassifier()
    res = rnn.predict("http://paypal-verify-login.xyz/auth")
    assert res["architecture"] == "RNN"
    assert res["classification"] in ["PHISHING", "SUSPICIOUS", "SAFE"]
    assert "inference_latency_ms" in res
    assert res["parameter_count"] > 0


def test_transformer_classifier():
    tr = TransformerPhishingClassifier()
    res = tr.predict("http://paypal-verify-login.xyz/auth")
    assert res["architecture"] == "Transformer"
    assert res["classification"] in ["PHISHING", "SUSPICIOUS", "SAFE"]
    assert "inference_latency_ms" in res
    assert res["parameter_count"] > 0


def test_phishing_url_classifier():
    clf = PhishingURLClassifier()
    res = clf.analyze_url("http://apple-id-verify.top/login")
    assert res["classification"] in ["PHISHING", "SUSPICIOUS", "SAFE"]
    assert "confidence" in res
    assert "inference_latency_ms" in res


def test_entity_correlator():
    correlator = EntityCorrelator()
    rec_a = {"text": "Target email: victim@example.com, Phone: +919876543210, Breach: Canva"}
    rec_b = {"text": "Victim email: victim@example.com, Phone: +919876543210, Breach: Dominos"}
    
    res = correlator.correlate_records(rec_a, rec_b)
    assert res["correlation_level"] in ["RELATED", "POSSIBLY_RELATED", "UNRELATED"]
    assert res["correlation_score"] >= 0.50
    assert len(res["matched_fields"]) >= 1


def test_model_manager_benchmarks():
    mgr = ModelManager()
    eval_res = mgr.run_benchmark_evaluation()
    assert eval_res["benchmark_dataset_size"] == 8
    assert len(eval_res["evaluations"]) == 3
    
    for ev in eval_res["evaluations"]:
        assert "accuracy" in ev
        assert "precision" in ev
        assert "recall" in ev
        assert "f1_score" in ev
        assert "confusion_matrix" in ev
        assert "avg_latency_ms" in ev
