import re
import math
import urllib.parse

class URLFeatureExtractor:
    """
    Extracts URLs from raw text, normalizes them, and builds numeric lexical & sequence feature vectors
    for ML / Deep Learning models (CNN, RNN, Transformer).
    """

    SUSPICIOUS_KEYWORDS = [
        'login', 'verify', 'account', 'update', 'banking', 'secure', 'signin', 
        'webmail', 'confirm', 'paypal', 'apple', 'google', 'microsoft', 'wallet',
        'crypto', 'free', 'bonus', 'claim', 'support', 'service', 'token', 'auth'
    ]

    SUSPICIOUS_TLDS = ['.xyz', '.top', '.club', '.online', '.site', '.work', '.info', '.cc', '.cn', '.tk', '.ga', '.cf', '.gq', '.ml']

    @staticmethod
    def extract_urls(text: str) -> list[str]:
        """Extract all raw URLs from text safely."""
        if not text or not isinstance(text, str):
            return []
        url_regex = r'https?://[^\s<>"]+|www\.[^\s<>"]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s<>"]*)?'
        raw_matches = re.findall(url_regex, text)
        cleaned = []
        for m in raw_matches:
            url = m.strip('.,;:\'\"()[]{}')
            if len(url) > 4 and '.' in url:
                if not url.startswith(('http://', 'https://')):
                    url = 'http://' + url
                cleaned.append(url)
        return list(dict.fromkeys(cleaned))  # Deduplicate preserving order

    @staticmethod
    def normalize_url(url: str) -> str:
        """Safely normalize malformed URLs."""
        if not url:
            return ""
        url = url.strip()
        if not (url.startswith("http://") or url.startswith("https://")):
            url = "http://" + url
        try:
            parsed = urllib.parse.urlparse(url)
            scheme = parsed.scheme.lower()
            netloc = parsed.netloc.lower()
            path = parsed.path
            query = f"?{parsed.query}" if parsed.query else ""
            fragment = f"#{parsed.fragment}" if parsed.fragment else ""
            return f"{scheme}://{netloc}{path}{query}{fragment}"
        except Exception:
            return url.lower()

    @classmethod
    def calculate_entropy(cls, string: str) -> float:
        """Calculate Shannon entropy of a string."""
        if not string:
            return 0.0
        prob = [float(string.count(c)) / len(string) for c in set(string)]
        return -sum([p * math.log(p, 2) for p in prob])

    @classmethod
    def extract_lexical_features(cls, url: str) -> dict:
        """Extract 16 structured lexical & statistical features from a URL."""
        normalized = cls.normalize_url(url)
        try:
            parsed = urllib.parse.urlparse(normalized)
            domain = parsed.netloc.split(':')[0]
            path = parsed.path
        except Exception:
            domain, path = normalized, ""

        length = len(normalized)
        domain_length = len(domain)
        path_length = len(path)

        num_dots = normalized.count('.')
        num_hyphens = normalized.count('-')
        num_at = normalized.count('@')
        num_question = normalized.count('?')
        num_equal = normalized.count('=')
        num_digits = sum(c.isdigit() for c in normalized)
        digit_ratio = num_digits / max(1, length)

        # IP in domain check
        has_ip = 1.0 if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain) else 0.0

        # Subdomain count
        subdomains = [s for s in domain.split('.') if s]
        subdomain_count = max(0, len(subdomains) - 2)

        # Suspicious keyword count
        keyword_hits = sum(1 for kw in cls.SUSPICIOUS_KEYWORDS if kw in normalized.lower())

        # Suspicious TLD check
        has_suspicious_tld = 1.0 if any(domain.endswith(tld) for tld in cls.SUSPICIOUS_TLDS) else 0.0

        # Entropy of domain & URL
        domain_entropy = cls.calculate_entropy(domain)
        url_entropy = cls.calculate_entropy(normalized)

        is_https = 1.0 if normalized.startswith('https://') else 0.0

        return {
            'length': float(length),
            'domain_length': float(domain_length),
            'path_length': float(path_length),
            'num_dots': float(num_dots),
            'num_hyphens': float(num_hyphens),
            'num_at': float(num_at),
            'num_question': float(num_question),
            'num_equal': float(num_equal),
            'num_digits': float(num_digits),
            'digit_ratio': float(digit_ratio),
            'has_ip': has_ip,
            'subdomain_count': float(subdomain_count),
            'keyword_hits': float(keyword_hits),
            'has_suspicious_tld': has_suspicious_tld,
            'domain_entropy': float(domain_entropy),
            'url_entropy': float(url_entropy),
            'is_https': is_https
        }

    @classmethod
    def get_feature_vector(cls, url: str) -> list[float]:
        """Convert lexical features into a flat numeric list for scikit-learn models."""
        feats = cls.extract_lexical_features(url)
        return [
            feats['length'], feats['domain_length'], feats['path_length'],
            feats['num_dots'], feats['num_hyphens'], feats['num_at'],
            feats['num_question'], feats['num_equal'], feats['num_digits'],
            feats['digit_ratio'], feats['has_ip'], feats['subdomain_count'],
            feats['keyword_hits'], feats['has_suspicious_tld'],
            feats['domain_entropy'], feats['url_entropy'], feats['is_https']
        ]

    @classmethod
    def encode_char_sequence(cls, url: str, max_len: int = 128) -> list[int]:
        """Convert URL to character indices (ASCII/UTF-8 integers) for Deep Learning models."""
        normalized = cls.normalize_url(url)
        indices = [ord(c) if ord(c) < 256 else 1 for c in normalized[:max_len]]
        if len(indices) < max_len:
            indices += [0] * (max_len - len(indices))
        return indices
