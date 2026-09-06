import pytest
import time
from ai.feature_extractor import URLFeatureExtractor
from ai.phishing_classifier import PhishingURLClassifier
from ai.cnn_model import CNNPhishingClassifier
from ai.rnn_model import RNNPhishingClassifier
from ai.transformer_model import TransformerPhishingClassifier
from ai.entity_correlator import EntityCorrelator
from ai.threat_analyzer import OSINTThreatAnalyzer


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


def test_phishing_url_classifier_real_model():
    clf = PhishingURLClassifier()
    assert clf.hf_model is not None, "Real Hugging Face model must be loaded"
    
    # Legitimate URL test
    res_safe = clf.analyze_url("https://www.google.com")
    assert res_safe["classification"] == "SAFE"
    assert res_safe["phishing_probability"] < 0.40
    
    # Phishing URL test
    res_phish = clf.analyze_url("http://paypa1-secure-login.tk/verify-account")
    assert res_phish["classification"] == "PHISHING"
    assert res_phish["phishing_probability"] > 0.65


def test_entity_correlator():
    correlator = EntityCorrelator()
    rec_a = {"text": "Target email: victim@example.com, Phone: +919876543210, Breach: Canva"}
    rec_b = {"text": "Victim email: victim@example.com, Phone: +919876543210, Breach: Dominos"}
    
    res = correlator.correlate_records(rec_a, rec_b)
    assert res["correlation_level"] in ["RELATED", "POSSIBLY_RELATED", "UNRELATED"]
    assert res["correlation_score"] >= 0.50
    assert len(res["matched_fields"]) >= 1


def test_threat_analyzer():
    analyzer = OSINTThreatAnalyzer()
    res = analyzer.analyze_threat_payload(
        "Phishing link detected: http://paypa1-secure-login.tk/verify-account for victim user@example.com",
        query="user@example.com"
    )
    assert res["has_phishing_url"] is True
    assert res["max_phishing_probability"] > 0.65
    assert len(res["url_analyses"]) >= 1
