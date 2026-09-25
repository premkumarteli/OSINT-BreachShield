import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import api from '../lib/api';
import './search_concept.css';

const bgVideo1 = '/bg1.mp4';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hiddenInputRef = useRef(null);

  const targetEmail = location.state?.email || sessionStorage.getItem('osint_target_email') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [apiError, setApiError] = useState('');
  const [cooldown, setCooldown] = useState(30);
  const [timeLeft, setTimeLeft] = useState(300);

  // 30-second resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // 5-minute expiry timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!targetEmail) {
    return <Navigate to="/" replace />;
  }

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    setApiError('');
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    setApiError('');

    try {
      const res = await api.post('/api/auth/verify-otp', {
        email: targetEmail,
        otp: otp.trim()
      });

      if (res.data && res.data.success) {
        if (res.data.token) {
          sessionStorage.setItem('osint_token', res.data.token);
        }
        sessionStorage.setItem('osint_verified_email', targetEmail);
        navigate('/results', { state: { email: targetEmail, verified: true } });
      } else {
        setApiError(res.data?.error || 'Invalid verification code.');
      }
    } catch (err) {
      const errData = err.response?.data;
      const baseErr = errData?.error || err.message || 'Verification failed. Please try again.';
      if (errData?.attemptsRemaining !== undefined && errData.attemptsRemaining > 0) {
        setApiError(`Invalid or expired OTP (${errData.attemptsRemaining} attempts remaining)`);
      } else {
        setApiError(baseErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setApiError('');

    try {
      const res = await api.post('/api/auth/send-otp', { email: targetEmail });
      if (res.data && res.data.success !== false) {
        setCooldown(30);
        setTimeLeft(300);
        setOtp('');
      } else {
        setApiError(res.data?.error || 'Failed to resend OTP.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to resend OTP.';
      setApiError(errMsg);
    } finally {
      setResending(false);
    }
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="concept-page-wrapper">
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

      {/* Top Navbar */}
      <header className="concept-navbar">
        <a href="/" className="concept-brand">
          <svg className="brand-icon-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <div className="brand-text-wrap">
            <span className="brand-name">BREACHSHIELD</span>
            <span className="brand-subtext">KNOW. STAY AHEAD.</span>
          </div>
        </a>

        <nav className="concept-nav-links" aria-label="Main Navigation">
          <a href="/" className="nav-link-item">Home</a>
          <a href="#about" className="nav-link-item">About</a>
          <a href="#features" className="nav-link-item">Features</a>
          <a href="#contact" className="nav-link-item">Contact</a>
        </nav>

        <div className="system-status-pill">
          <span className="status-dot"></span>
          <span>System Online</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="concept-main">
        {/* Hero Section */}
        <section className="concept-hero otp-hero-section">
          <div className="otp-security-status-badge">
            <span className="security-status-dot" aria-hidden="true" />
            <span>Secure Verification Channel Active</span>
          </div>
          <h1 className="concept-hero-title otp-hero-title">AUTHENTICATION REQUIRED</h1>
          <p className="concept-hero-subtitle">
            Identity verification for <strong className="otp-email-highlight">{targetEmail}</strong>
          </p>
          <div className="concept-hero-tags">
            MULTI-FACTOR &nbsp;•&nbsp; TIME-BASED TOKEN &nbsp;•&nbsp; ZERO-KNOWLEDGE
          </div>
        </section>

        {/* Central Apple-Style Glass Verification Card */}
        <div className="concept-search-card otp-card-refinement" role="region" aria-label="otp-verification-card">
          <div className="card-header-row">
            <div className="search-icon-circle" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="card-header-text">
              <h2>Authorize OSINT Search</h2>
              <p>Enter the 6-digit one-time passkey transmitted to your email to verify authorization before executing the intelligence query.</p>
            </div>
          </div>

          <form onSubmit={handleVerify} noValidate>
            <div className="form-field-group">
              <label htmlFor="otp-digit-input" className="form-label otp-input-label">
                Security Token (6 Digits)
              </label>
              
              {/* Modern 6-Segmented Glass OTP Boxes */}
              <div 
                className="otp-boxes-wrapper" 
                onClick={() => hiddenInputRef.current?.focus()}
                role="group"
                aria-label="6-digit verification code"
              >
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const char = otp[index] || '';
                  const isActive = (otp.length === index) || (index === 5 && otp.length === 6);
                  return (
                    <div
                      key={index}
                      className={`otp-box-cell ${char ? 'filled' : ''} ${isActive ? 'focused' : ''}`}
                    >
                      {char ? char : ''}
                      {!char && isActive && <span className="otp-blinking-cursor" />}
                    </div>
                  );
                })}
                <input
                  ref={hiddenInputRef}
                  id="otp-digit-input"
                  className="otp-hidden-master-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={handleOtpChange}
                  aria-label="otp-input"
                  aria-busy={loading}
                  disabled={loading}
                  autoFocus
                  maxLength={6}
                />
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              className="concept-cta-btn"
              disabled={loading || otp.length !== 6}
              aria-label="verify-otp-button"
            >
              <svg className="btn-icon-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span>{loading ? 'Validating Token...' : 'Authorize & Launch Scan'}</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </button>
          </form>

          {/* Countdown & Resend Row */}
          <div className="otp-meta-glass-row">
            <span className="otp-timer-glass-pill" aria-label="Countdown Timer">
              ⏳ Code expires in: <strong>{formatTime(timeLeft)}</strong>
            </span>
            <button
              type="button"
              className="otp-resend-glass-btn"
              disabled={cooldown > 0 || resending}
              onClick={handleResend}
              aria-label="resend-otp-button"
            >
              {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>

          {/* Validation & Error Alerts */}
          {apiError && (
            <div className="concept-alert error" role="alert">
              ⚠ {apiError}
            </div>
          )}

          {/* Back to Search Link */}
          <div className="otp-change-email-wrap">
            <button
              type="button"
              className="otp-change-email-link"
              onClick={() => {
                sessionStorage.removeItem('osint_target_email');
                navigate('/');
              }}
            >
              ← Enter a different email
            </button>
          </div>
        </div>

        {/* Feature Pillars Reassurance */}
        <section className="concept-pillars-grid" aria-label="Core Technology Pillars">
          <div className="pillar-card cyan">
            <div className="pillar-icon-box" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="pillar-text">
              <h3>Zero-Knowledge</h3>
              <p>Identifier hashes remain private during lookup.</p>
            </div>
          </div>

          <div className="pillar-card purple">
            <div className="pillar-icon-box" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div className="pillar-text">
              <h3>Rate-Limited MFA</h3>
              <p>Strict anti-brute-force request throttling.</p>
            </div>
          </div>

          <div className="pillar-card green">
            <div className="pillar-icon-box" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </div>
            <div className="pillar-text">
              <h3>Audited Session</h3>
              <p>Query authorization immutably logged.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (Matches Header Size & Theme) */}
      <footer className="concept-footer">
        <div className="footer-left">
          <span className="footer-brand-title">BREACHSHIELD</span>
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
