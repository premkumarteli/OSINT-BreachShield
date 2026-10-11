import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import { checkProtectedGuard } from '../lib/authGuards';
import { CyberAlertIcon } from '../components/CyberShieldIcon';
import '../App.css';
import '../auth.css';
import './search_concept.css';
import '../results.css';

const bgVideo3 = '/bg3.mp4';
const MIN_SCAN_TIME_MS = 1000;

const SCAN_STEPS = [
  'Correlating multi-source breach intelligence feeds...',
  'Scanning dark web dumps, infostealer logs & Telegram channels...',
  'Cross-referencing compromised credential archives for target...',
  'Compiling threat assessment & finalizing intelligence report...'
];

export default function ScanningPage() {
  const navigate = useNavigate();

  // Run Route Guard first
  const guard = checkProtectedGuard();
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [scanStep, setScanStep] = useState(0);

  // Cycle through scanning status steps every 2.5s while searching
  useEffect(() => {
    const interval = setInterval(() => {
      setScanStep((prev) => (prev + 1) % SCAN_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Explicitly ensure page scrolling is unblocked on mount
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflowY;
    const prevBodyHeight = document.body.style.height;
    const prevHtmlOverflow = document.documentElement.style.overflowY;
    const prevHtmlHeight = document.documentElement.style.height;

    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.overflowY = 'auto';
    document.documentElement.style.height = 'auto';

    return () => {
      document.body.style.overflowY = prevBodyOverflow;
      document.body.style.height = prevBodyHeight;
      document.documentElement.style.overflowY = prevHtmlOverflow;
      document.documentElement.style.height = prevHtmlHeight;
    };
  }, []);

  // StrictMode double-execution & in-flight request guard
  const requestFiredRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (!guard.allow) return;
    if (requestFiredRef.current) return;
    requestFiredRef.current = true;

    const controller = new AbortController();
    const startTime = Date.now();

    async function executeScan() {
      setError(null);
      const verifiedTarget = sessionStorage.getItem('osint_verified_email') || '';
      const token = sessionStorage.getItem('osint_token');
      const isPhone = !verifiedTarget.includes('@');
      const searchType = isPhone ? 'Phone' : 'Email';

      const payload = {
        query: verifiedTarget,
        searchType,
        osintType: 'MOBILE_OSINT'
      };
      if (token) payload.token = token;

      try {
        const res = await api.post('/api/search', payload, {
          signal: controller.signal
        });

        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, MIN_SCAN_TIME_MS - elapsed);
        if (delay > 0) {
          await new Promise((r) => setTimeout(r, delay));
        }

        if (controller.signal.aborted || !isMountedRef.current) return;

        if (res.data && res.data.success) {
          navigate('/results', { replace: true, state: { result: res.data.data } });
        } else {
          setError({
            type: 'generic',
            message: res.data?.error || 'Failed to retrieve scan results.'
          });
        }
      } catch (err) {
        if (controller.signal.aborted || !isMountedRef.current) return;

        const status = err.response?.status;
        const serverMsg = err.response?.data?.error || err.message || 'Error communicating with intelligence feeds.';

        if (status === 403) {
          sessionStorage.removeItem('osint_token');
          sessionStorage.removeItem('osint_verified_email');
          // 403 -> redirect /verify with server message
          navigate('/verify', { replace: true, state: { error: serverMsg } });
          return;
        }

        if (status === 429) {
          // Rate limit -> show error state with server message
          setError({
            type: 'rate_limit',
            message: serverMsg
          });
          return;
        }

        // Network or other generic error -> offer Retry and Back to search
        setError({
          type: 'network',
          message: serverMsg
        });
      }
    }

    executeScan();

    return () => {
      isMountedRef.current = false;
      setTimeout(() => {
        if (!isMountedRef.current) {
          controller.abort();
        }
      }, 0);
    };
  }, [guard.allow, retryCount, navigate]);

  if (!guard.allow) {
    return <Navigate to={guard.redirectTo || '/search'} replace />;
  }

  const verifiedTarget = sessionStorage.getItem('osint_verified_email') || '';

  const handleBackToSearch = () => {
    sessionStorage.removeItem('osint_target_email');
    sessionStorage.removeItem('osint_target_type');
    sessionStorage.removeItem('osint_token');
    sessionStorage.removeItem('osint_verified_email');
    navigate('/search');
  };

  const handleRetry = () => {
    requestFiredRef.current = false;
    setRetryCount((prev) => prev + 1);
  };

  return (
    <div className="concept-page-wrapper results-page-wrapper">
      {/* Background Animated Video */}
      <video
        className="concept-bg-video"
        src={bgVideo3}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onEnded={(e) => {
          e.target.currentTime = 0;
          e.target.play().catch(() => {});
        }}
        aria-hidden
      />

      {/* Cyber Ambient Layer */}
      <div className="concept-background" aria-hidden="true" />

      {/* Shared Navbar */}
      <Navbar />

      {/* Main Results Container */}
      <main className="concept-main results-main">
        {/* Minimalist Hero Section */}
        <section className="concept-hero results-hero" aria-hidden="false">
          <h1 className="concept-hero-title results-hero-title">INTELLIGENCE REPORT</h1>
          <div className="results-target-pill">
            <span className="hero-label">TARGET</span>
            <span className="hero-email">{verifiedTarget}</span>
          </div>
        </section>

        <div className="results-container">
          {error ? (
            <div className="error-card" role="status" aria-live="polite">
              <div className="error-icon" style={{ marginBottom: '14px' }}>
                <CyberAlertIcon size={38} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                {error.type === 'rate_limit' ? 'Rate Limit Exceeded' : 'Scan Failed'}
              </h2>
              <div className="error-message" style={{ marginBottom: '24px' }}>{error.message}</div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {error.type !== 'rate_limit' && (
                  <button
                    type="button"
                    className="search-btn retry-btn"
                    onClick={handleRetry}
                    style={{ minWidth: '120px' }}
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  className="search-btn"
                  onClick={handleBackToSearch}
                  style={{ minWidth: '120px' }}
                >
                  Back to search
                </button>
              </div>
            </div>
          ) : (
            <div className="loading-card scanning-card" role="status" aria-live="polite">
              {/* Biometric Thumb Icon (Clean, No Black Box, Proportional Size) */}
              <div className="thumb-scan-container">
                <div className="thumb-scan-beam" />
                <svg
                  className="thumb-scan-svg"
                  viewBox="0 0 100 125"
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-label="Scanning biometric fingerprint"
                >
                  <path d="M 12 88 C 10 60, 15 32, 30 16 C 42 4, 58 4, 70 16 C 85 32, 90 60, 88 88" />
                  <path d="M 18 95 C 16 70, 20 42, 33 25 C 43 14, 57 14, 67 25 C 80 42, 84 70, 82 95" />
                  <path d="M 24 100 C 22 78, 26 50, 37 34 C 45 23, 55 23, 63 34 C 74 50, 78 78, 76 100" />
                  <path d="M 30 105 C 29 84, 32 60, 41 44 C 47 34, 53 34, 59 44 C 68 60, 71 84, 70 105" />
                  <path d="M 37 108 C 36 90, 39 70, 45 54 C 48 45, 52 45, 55 54 C 61 70, 64 90, 63 108" />
                  <path d="M 43 111 C 43 96, 45 78, 48 64 C 49 58, 51 58, 52 64 C 55 78, 57 96, 57 111" />
                  <path d="M 50 72 L 50 112" />
                  <path d="M 8 78 C 7 62, 10 48, 18 36" />
                  <path d="M 92 78 C 93 62, 90 48, 82 36" />
                  <path d="M 14 105 C 13 95, 12 85, 13 75" />
                  <path d="M 86 105 C 87 95, 88 85, 87 75" />
                </svg>
              </div>
              <div className="loading-text">{SCAN_STEPS[scanStep]}</div>
              <div className="loading-subtext">
                Scanning dark web dumps, infostealer logs & entity correlation engines for <strong>{verifiedTarget}</strong>
              </div>
              <div className="loading-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer (Matches Header Size & Theme) */}
      <footer className="concept-footer">
        <div className="footer-left">
          <img src="/logo-icon.png" alt="" className="footer-brand-icon" aria-hidden="true" />
          <span className="footer-brand-title">
            <span className="brand-text-white">BREACH</span>
            <span className="brand-text-blue">SHIELD</span>
          </span>
          <span className="footer-divider">•</span>
          <span className="footer-copyright">© 2026 BreachShield. All rights reserved.</span>
        </div>
        <div className="footer-links">
          <a href="#privacy" className="footer-link">Privacy Policy</a>
          <span className="footer-link-divider">|</span>
          <a href="#terms" className="footer-link">Terms of Use</a>
          <span className="footer-link-divider">|</span>
          <a href="#disclaimer" className="footer-link">Disclaimer</a>
        </div>
        <div className="footer-right">
          <span className="footer-pillars-tagline">
            Privacy First &nbsp;•&nbsp; AI Risk Analysis &nbsp;•&nbsp; Audit Integrity
          </span>
        </div>
      </footer>
    </div>
  );
}
