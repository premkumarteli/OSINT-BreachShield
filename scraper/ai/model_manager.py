import time
from .cnn_model import CNNPhishingClassifier
from .rnn_model import RNNPhishingClassifier
from .transformer_model import TransformerPhishingClassifier

class ModelManager:
    """
    Manages and compares CNN, RNN/BiLSTM, and Transformer models for empirical evaluation.
    """

    def __init__(self):
        self.cnn_model = CNNPhishingClassifier()
        self.rnn_model = RNNPhishingClassifier()
        self.transformer_model = TransformerPhishingClassifier()

        # Benchmarking test set
        self.benchmark_urls = [
            "https://paypal-security-update-verify.com/login",
            "http://192.168.1.1/admin/auth.php",
            "http://apple-id-verify-account.xyz/index.html",
            "https://www.google.com/search?q=cybersecurity",
            "https://github.com/premkumarteli/OSINT-BreachShield",
            "http://free-crypto-airdrop-claim.top/auth",
            "https://wikipedia.org/wiki/Main_Page",
            "http://banking-login-secure.online/portal"
        ]
        self.benchmark_labels = [1, 1, 1, 0, 0, 1, 0, 1]

    def compare_architectures(self, test_url: str) -> dict:
        """Run single inference across all 3 architectures and return comparison results."""
        cnn_pred = self.cnn_model.predict(test_url)
        rnn_pred = self.rnn_model.predict(test_url)
        transformer_pred = self.transformer_model.predict(test_url)

        return {
            "test_url": test_url,
            "predictions": {
                "CNN": cnn_pred,
                "RNN": rnn_pred,
                "Transformer": transformer_pred
            },
            "best_architecture": "Transformer" if transformer_pred["confidence"] >= cnn_pred["confidence"] else "CNN"
        }

    def run_benchmark_evaluation(self) -> dict:
        """Calculate Accuracy, Precision, Recall, F1, Confusion Matrix, and Latency for all 3 models."""
        cnn_metrics = self.cnn_model.evaluate_dataset(self.benchmark_urls, self.benchmark_labels)
        rnn_metrics = self.rnn_model.evaluate_dataset(self.benchmark_urls, self.benchmark_labels)
        transformer_metrics = self.transformer_model.evaluate_dataset(self.benchmark_urls, self.benchmark_labels)

        return {
            "benchmark_dataset_size": len(self.benchmark_urls),
            "evaluations": [
                cnn_metrics,
                rnn_metrics,
                transformer_metrics
            ]
        }
