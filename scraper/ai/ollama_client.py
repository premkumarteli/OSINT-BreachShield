import os
import json
import time
import asyncio
from typing import Optional

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False


OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "phi3")
OLLAMA_TIMEOUT = float(os.environ.get("OLLAMA_TIMEOUT", "30"))


class OllamaClient:
    """
    Lightweight client for local Ollama API.
    Zero external API calls — everything runs on-device.
    """

    def __init__(self, model: str = None):
        self.base_url = OLLAMA_BASE_URL.rstrip("/")
        self.model = model or OLLAMA_MODEL
        self.timeout = OLLAMA_TIMEOUT
        self._available: Optional[bool] = None

    def set_model(self, model: str):
        """Switch to a different model at runtime."""
        self.model = model
        self._available = None  # reset cache

    def list_models(self) -> list:
        """List all locally installed Ollama models."""
        try:
            import urllib.request
            req = urllib.request.Request(f"{self.base_url}/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                models = []
                for m in data.get("models", []):
                    name = m.get("name", "")
                    size = m.get("size", 0)
                    modified = m.get("modified_at", "")
                    models.append({"name": name, "size_bytes": size, "modified": modified})
                return models
        except Exception:
            return []

    def is_available(self) -> bool:
        """Check if Ollama server is running and model is loaded."""
        if self._available is not None:
            return self._available
        try:
            import urllib.request
            req = urllib.request.Request(f"{self.base_url}/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode())
                models = [m.get("name", "") for m in data.get("models", [])]
                self._available = any(self.model in m for m in models)
                if not self._available and models:
                    self._available = True
                return self._available
        except Exception:
            self._available = False
            return False

    def generate(self, prompt: str, system: str = "", temperature: float = 0.3) -> dict:
        """
        Send a prompt to local Ollama and return the response.
        Uses synchronous urllib to avoid dependency on httpx for this path.
        """
        start_t = time.perf_counter()

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": 1024,
            }
        }
        if system:
            payload["system"] = system

        try:
            import urllib.request
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                f"{self.base_url}/api/generate",
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                result = json.loads(resp.read().decode())

            latency_ms = int((time.perf_counter() - start_t) * 1000)

            return {
                "success": True,
                "response": result.get("response", ""),
                "model": result.get("model", self.model),
                "total_duration_ms": latency_ms,
                "eval_count": result.get("eval_count", 0),
                "done": result.get("done", True),
            }
        except Exception as e:
            latency_ms = int((time.perf_counter() - start_t) * 1000)
            return {
                "success": False,
                "error": str(e),
                "model": self.model,
                "total_duration_ms": latency_ms,
                "response": "",
            }

    async def generate_async(self, prompt: str, system: str = "", temperature: float = 0.3) -> dict:
        """Async version using httpx if available, falls back to sync."""
        if not HTTPX_AVAILABLE:
            return self.generate(prompt, system, temperature)

        start_t = time.perf_counter()
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": 1024,
            }
        }
        if system:
            payload["system"] = system

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(f"{self.base_url}/api/generate", json=payload)
                result = resp.json()

            latency_ms = int((time.perf_counter() - start_t) * 1000)
            return {
                "success": True,
                "response": result.get("response", ""),
                "model": result.get("model", self.model),
                "total_duration_ms": latency_ms,
                "eval_count": result.get("eval_count", 0),
                "done": result.get("done", True),
            }
        except Exception as e:
            latency_ms = int((time.perf_counter() - start_t) * 1000)
            return {
                "success": False,
                "error": str(e),
                "model": self.model,
                "total_duration_ms": latency_ms,
                "response": "",
            }
