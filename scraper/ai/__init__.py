"""
BreachShield AI Threat Analysis & Phishing Classifier Module
Heavy ML imports are lazy to avoid blocking startup.
"""

class _LazyImport:
    """Defers import until attribute access."""
    def __init__(self, module_path, attr_name):
        self._module_path = module_path
        self._attr_name = attr_name
        self._obj = None

    def _load(self):
        if self._obj is None:
            import importlib
            mod = importlib.import_module(self._module_path, package='ai')
            self._obj = getattr(mod, self._attr_name)
        return self._obj

    def __call__(self, *args, **kwargs):
        return self._load()(*args, **kwargs)

    def __getattr__(self, name):
        return getattr(self._load(), name)


# Lightweight core modules (import immediately)
from .feature_extractor import URLFeatureExtractor
from .phishing_classifier import PhishingURLClassifier
from .threat_analyzer import OSINTThreatAnalyzer

# Lazy heavy imports (sentence-transformers, torch, xgboost, etc.)
EntityCorrelator = _LazyImport('.entity_correlator', 'EntityCorrelator')
CNNPhishingClassifier = _LazyImport('.cnn_model', 'CNNPhishingClassifier')
RNNPhishingClassifier = _LazyImport('.rnn_model', 'RNNPhishingClassifier')
TransformerPhishingClassifier = _LazyImport('.transformer_model', 'TransformerPhishingClassifier')
XGBoostPhishingClassifier = _LazyImport('.xgboost_model', 'XGBoostPhishingClassifier')
ModelManager = _LazyImport('.model_manager', 'ModelManager')

# Ollama LLM (lightweight — import immediately)
from .ollama_client import OllamaClient
from .llm_threat_analyzer import LLMThreatAnalyzer

_MODELS_AVAILABLE = True
_OLLAMA_AVAILABLE = True

__all__ = [
    "URLFeatureExtractor",
    "PhishingURLClassifier",
    "OSINTThreatAnalyzer",
    "EntityCorrelator",
    "CNNPhishingClassifier",
    "RNNPhishingClassifier",
    "TransformerPhishingClassifier",
    "XGBoostPhishingClassifier",
    "ModelManager",
    "OllamaClient",
    "LLMThreatAnalyzer",
]
