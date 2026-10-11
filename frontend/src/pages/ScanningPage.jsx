import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import { checkProtectedGuard } from '../lib/authGuards';
import './search_concept.css';

const bgVideo1 = '/bg1.mp4';
const MIN_SCAN_TIME_MS = 1000;

export default function ScanningPage() {
  const navigate = useNavigate();

  // Run Route Guard first
  const guard = checkProtectedGuard();
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

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
    <div className="concept-page-wrapper">
      {/* Background Animated Video */}
      <video
        src={bgVideo1}
        className="concept-bg-video"
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

      {/* Atmospheric Depth Tint */}
      <div className="concept-background" aria-hidden="true" />

      {/* Top Shared Navbar */}
      <Navbar />

      {/* Main Full-screen Centered Content */}
      <main className="concept-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          className="concept-search-card"
          role="status"
          aria-live="polite"
          style={{ textAlign: 'center', padding: '40px 32px', maxWidth: '440px', width: '100%' }}
        >
          {error ? (
            <div className="scanning-error-state">
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                {error.type === 'rate_limit' ? 'Rate Limit Exceeded' : 'Scan Failed'}
              </h2>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '24px' }}>
                {error.message}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {error.type !== 'rate_limit' && (
                  <button
                    type="button"
                    className="concept-cta-btn"
                    onClick={handleRetry}
                    style={{ minWidth: '120px' }}
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  className="concept-cta-btn"
                  onClick={handleBackToSearch}
                  style={{
                    minWidth: '120px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  Back to search
                </button>
              </div>
            </div>
          ) : (
            <div className="scanning-active-state">
              {/* Honest Indeterminate Indicator */}
              <div
                className="scanning-spinner"
                aria-label="Checking breach sources spinner"
                style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 24px',
                  borderRadius: '50%',
                  border: '3px solid rgba(0, 240, 255, 0.15)',
                  borderTopColor: '#00f0ff',
                  animation: 'concept-spin 1s linear infinite'
                }}
              />
              <style>{`
                @keyframes concept-spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#f8fafc',
                  margin: 0,
                  letterSpacing: '0.02em'
                }}
              >
                Checking breach sources...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
