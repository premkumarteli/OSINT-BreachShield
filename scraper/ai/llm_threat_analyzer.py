import json
import time
import re
from .ollama_client import OllamaClient


SYSTEM_PROMPT = """You are a cybersecurity threat intelligence analyst specializing in OSINT breach analysis.
Analyze the provided text and return a structured JSON response.
You MUST return valid JSON only — no markdown, no explanation outside the JSON.
The JSON schema:
{
  "threat_summary": "1-2 sentence summary of the threat",
  "risk_level": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
  "entities": {
    "emails": [],
    "phones": [],
    "names": [],
    "ips": [],
    "domains": [],
    "credentials": []
  },
  "breach_type": "PHISHING|DATA_LEAK|CREDENTIAL_STUFFING|DOXING|OTHER",
  "recommended_actions": ["action1", "action2"],
  "confidence": 0.0 to 1.0,
  "reasoning": "Why you classified it this way"
}"""


class LLMThreatAnalyzer:
    """
    Uses local Ollama LLM for deep threat analysis, entity extraction,
    and phishing explanation — all fully offline.
    """

    def __init__(self):
        self.client = OllamaClient()
        self._available = None

    def is_available(self) -> bool:
        if self._available is not None:
            return self._available
        self._available = self.client.is_available()
        return self._available

    def analyze_threat_text(self, text: str, query: str = "") -> dict:
        """Full LLM-powered threat analysis of raw breach text."""
        start_t = time.perf_counter()

        if not self.is_available():
            return {
                "success": False,
                "error": "Ollama not available — install Ollama and pull a model (e.g. `ollama pull phi3`)",
                "model": self.client.model,
                "inference_latency_ms": 0,
            }

        prompt = f"""Analyze this OSINT breach intelligence text and extract threat information.

Query target: {query or "N/A"}

Text to analyze:
{text[:3000]}

Return ONLY valid JSON matching the schema. No markdown fences, no extra text."""

        result = self.client.generate(prompt, system=SYSTEM_PROMPT, temperature=0.2)
        latency_ms = int((time.perf_counter() - start_t) * 1000)

        if not result["success"]:
            return {
                "success": False,
                "error": result.get("error", "Generation failed"),
                "model": result.get("model", self.client.model),
                "inference_latency_ms": latency_ms,
            }

        raw_response = result["response"].strip()
        parsed = self._parse_json_response(raw_response)

        return {
            "success": True,
            "model": result.get("model", self.client.model),
            "analysis": parsed,
            "raw_response": raw_response,
            "inference_latency_ms": latency_ms,
            "eval_count": result.get("eval_count", 0),
        }

    def explain_phishing(self, url: str, classification: str, probability: float) -> dict:
        """Use LLM to explain why a URL was classified as phishing."""
        start_t = time.perf_counter()

        if not self.is_available():
            return {
                "success": False,
                "error": "Ollama not available",
                "model": self.client.model,
                "inference_latency_ms": 0,
            }

        prompt = f"""A phishing detection model classified this URL:
URL: {url}
Classification: {classification}
Confidence: {probability * 100:.1f}%

Explain in 2-3 sentences WHY this URL is likely phishing or safe.
Focus on: domain reputation, URL structure, suspicious patterns, visual indicators.
Return ONLY valid JSON:
{{
  "explanation": "your explanation here",
  "key_indicators": ["indicator1", "indicator2", "indicator3"],
  "severity_justification": "why this severity level"
}}"""

        result = self.client.generate(prompt, temperature=0.3)
        latency_ms = int((time.perf_counter() - start_t) * 1000)

        if not result["success"]:
            return {
                "success": False,
                "error": result.get("error", "Generation failed"),
                "model": result.get("model", self.client.model),
                "inference_latency_ms": latency_ms,
            }

        raw = result["response"].strip()
        parsed = self._parse_json_response(raw)

        return {
            "success": True,
            "model": result.get("model", self.client.model),
            "explanation": parsed,
            "inference_latency_ms": latency_ms,
        }

    def extract_entities(self, text: str) -> dict:
        """Use LLM for deeper entity extraction than regex-based methods."""
        start_t = time.perf_counter()

        if not self.is_available():
            return {
                "success": False,
                "error": "Ollama not available",
                "model": self.client.model,
                "inference_latency_ms": 0,
            }

        prompt = f"""Extract ALL entities from this breach intelligence text.
Be thorough — find emails, phone numbers, names, IPs, domains, passwords/hashes, addresses.

Text:
{text[:3000]}

Return ONLY valid JSON:
{{
  "emails": ["found emails"],
  "phones": ["found phone numbers"],
  "names": ["found personal names"],
  "ips": ["found IP addresses"],
  "domains": ["found domains"],
  "credentials": ["found passwords or hashes"],
  "addresses": ["found physical addresses"],
  "other": ["any other PII found"]
}}"""

        result = self.client.generate(prompt, temperature=0.1)
        latency_ms = int((time.perf_counter() - start_t) * 1000)

        if not result["success"]:
            return {
                "success": False,
                "error": result.get("error", "Generation failed"),
                "model": result.get("model", self.client.model),
                "inference_latency_ms": latency_ms,
            }

        raw = result["response"].strip()
        parsed = self._parse_json_response(raw)

        return {
            "success": True,
            "model": result.get("model", self.client.model),
            "entities": parsed,
            "inference_latency_ms": latency_ms,
        }

    def _parse_json_response(self, raw: str) -> dict:
        """Extract JSON from LLM response, handling markdown fences."""
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            cleaned = "\n".join(lines)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r'\{[\s\S]*\}', cleaned)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
            return {"raw_text": cleaned, "parse_error": "Could not extract JSON from LLM response"}
