"""
BreachShield AI Threat Analysis & Phishing Classifier Module
"""
from .feature_extractor import URLFeatureExtractor
from .phishing_classifier import PhishingURLClassifier
from .cnn_model import CNNPhishingClassifier
from .rnn_model import RNNPhishingClassifier
from .transformer_model import TransformerPhishingClassifier
from .threat_analyzer import OSINTThreatAnalyzer
from .entity_correlator import EntityCorrelator
from .model_manager import ModelManager

__all__ = [
    "URLFeatureExtractor",
    "PhishingURLClassifier",
    "CNNPhishingClassifier",
    "RNNPhishingClassifier",
    "TransformerPhishingClassifier",
    "OSINTThreatAnalyzer",
    "EntityCorrelator",
    "ModelManager"
]
