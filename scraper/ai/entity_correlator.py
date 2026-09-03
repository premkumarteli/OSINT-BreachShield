import re
import time
import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False


class EntityCorrelator:
    """
    Identity Resolution & Cross-Breach Semantic Correlation Engine.
    Combines structured field matching with SentenceTransformer dense embeddings.
    """

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.encoder = None
        
        # Configurable similarity thresholds
        self.THRESHOLD_RELATED = 0.75
        self.THRESHOLD_POSSIBLY_RELATED = 0.50

        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.encoder = SentenceTransformer(model_name)
            except Exception:
                self.encoder = None

    @staticmethod
    def extract_entities(text: str) -> dict:
        """Extract structured identity indicators from text."""
        if not text or not isinstance(text, str):
            return {"emails": [], "phones": [], "domains": [], "ips": [], "passwords": []}

        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        phone_pattern = r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b'
        domain_pattern = r'\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b'
        ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
        pwd_pattern = r'(?:password|passwd|pwd|hash|md5|sha1)[\s:=]+([^\s\n,]+)'

        emails = list(set(re.findall(email_pattern, text)))
        phones = list(set(re.findall(phone_pattern, text)))
        ips = list(set(re.findall(ip_pattern, text)))
        domains = [d for d in set(re.findall(domain_pattern, text)) if d not in ips and not d.endswith('.png')]
        passwords = [m[0] if isinstance(m, tuple) else m for m in re.findall(pwd_pattern, text, re.IGNORECASE)]

        return {
            "emails": emails,
            "phones": phones,
            "domains": domains,
            "ips": ips,
            "passwords": list(set(passwords))
        }

    def compute_cosine_similarity(self, text1: str, text2: str) -> float:
        """Compute Cosine Similarity using SentenceTransformers or character n-gram TF-IDF fallback."""
        if not text1 or not text2:
            return 0.0

        if self.encoder:
            try:
                embeddings = self.encoder.encode([text1, text2])
                v1, v2 = embeddings[0], embeddings[1]
                dot = np.dot(v1, v2)
                norm1, norm2 = np.linalg.norm(v1), np.linalg.norm(v2)
                if norm1 > 0 and norm2 > 0:
                    return float(dot / (norm1 * norm2))
            except Exception:
                pass

        # Fallback: Character 3-gram Cosine Similarity
        def get_ngrams(s, n=3):
            s_clean = re.sub(r'\s+', ' ', s.lower().strip())
            return set([s_clean[i:i+n] for i in range(len(s_clean) - n + 1)])

        set1 = get_ngrams(text1)
        set2 = get_ngrams(text2)
        if not set1 or not set2:
            return 0.0
        intersection = len(set1.intersection(set2))
        return float(intersection / (math.sqrt(len(set1)) * math.sqrt(len(set2))))

    def correlate_records(self, record_a: dict, record_b: dict) -> dict:
        """
        Perform analytical correlation between two breach records.
        Returns similarity score, matched fields, confidence, and correlation level.
        """
        start_t = time.perf_counter()
        
        text_a = str(record_a.get("text") or record_a.get("info") or str(record_a))
        text_b = str(record_b.get("text") or record_b.get("info") or str(record_b))

        ent_a = self.extract_entities(text_a)
        ent_b = self.extract_entities(text_b)

        matched_fields = []

        # 1. Field Matches
        common_emails = set(ent_a["emails"]).intersection(set(ent_b["emails"]))
        if common_emails:
            matched_fields.append(f"email ({', '.join(common_emails)})")

        common_phones = set(ent_a["phones"]).intersection(set(ent_b["phones"]))
        if common_phones:
            matched_fields.append(f"phone ({', '.join(common_phones)})")

        common_ips = set(ent_a["ips"]).intersection(set(ent_b["ips"]))
        if common_ips:
            matched_fields.append(f"ip ({', '.join(common_ips)})")

        common_passwords = set(ent_a["passwords"]).intersection(set(ent_b["passwords"]))
        if common_passwords:
            matched_fields.append("password_hash")

        # 2. Semantic Embedding Similarity
        semantic_sim = self.compute_cosine_similarity(text_a, text_b)

        # 3. Hybrid Confidence Calculation
        field_bonus = len(matched_fields) * 0.30
        overall_score = min(1.0, semantic_sim * 0.50 + field_bonus)

        if overall_score >= self.THRESHOLD_RELATED:
            level = "RELATED"
        elif overall_score >= self.THRESHOLD_POSSIBLY_RELATED:
            level = "POSSIBLY_RELATED"
        else:
            level = "UNRELATED"

        latency_ms = int((time.perf_counter() - start_t) * 1000)

        return {
            "record_a_summary": text_a[:100],
            "record_b_summary": text_b[:100],
            "matched_fields": matched_fields,
            "semantic_similarity": round(float(semantic_sim), 4),
            "correlation_score": round(float(overall_score), 4),
            "confidence": round(float(overall_score), 4),
            "correlation_level": level,
            "thresholds_used": {
                "related": self.THRESHOLD_RELATED,
                "possibly_related": self.THRESHOLD_POSSIBLY_RELATED
            },
            "model": self.model_name,
            "latency_ms": max(1, latency_ms)
        }
