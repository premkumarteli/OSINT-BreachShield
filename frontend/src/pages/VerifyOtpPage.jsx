import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import { buildSendOtpPayload } from '../lib/otpPayload';
import { maskIdentifier } from '../lib/maskIdentifier';
import './search_concept.css';

const bgVideo1 = '/bg1.mp4';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const hiddenInputRef = useRef(null);

  const targetEmail = sessionStorage.getItem('osint_target_email') || '';
  const targetType = sessionStorage.getItem('osint_target_type') || (targetEmail.includes('@') ? 'email' : 'phone');

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
  }, [cooldown > 0]);

  // 5-minute expiry timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft > 0]);

  // Route Guard: redirect to /search if pending identifier is missing
  if (!targetEmail) {
    return <Navigate to="/search" replace />;
  }

  const maskedTarget = maskIdentifier(targetEmail, targetType);

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    setApiError('');
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6 || loading) return;

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
        const errorMsg = res.data?.error || 'Invalid verification code.';
        setApiError(errorMsg);
        setOtp('');
        hiddenInputRef.current?.focus();
      }
    } catch (err) {
      const errData = err.response?.data;
      const baseErr = errData?.error || err.message || 'Verification failed. Please try again.';
      if (errData?.attemptsRemaining !== undefined) {
        setApiError(`${baseErr} (${errData.attemptsRemaining} attempts remaining)`);
      } else {
        setApiError(baseErr);
      }
      setOtp('');
      hiddenInputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if ((cooldown > 0 && timeLeft > 0) || resending || loading) return;

    setResending(true);
    setApiError('');

    try {
      const payload = buildSendOtpPayload(targetEmail, targetType);
      const res = await api.post('/api/auth/send-otp', payload);
      if (res.data && res.data.success !== false) {
        setCooldown(30);
        setTimeLeft(300);
        setOtp('');
        hiddenInputRef.current?.focus();
      } else {
        setApiError(res.data?.error || 'Failed to resend verification code.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to resend verification code.';
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
      {/* Background Video */}
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
      <Navbar />

      {/* Main Content */}
      <main className="concept-main">
        {/* Hero Section */}
        <section className="concept-hero">
          <h1 className="concept-hero-title">Enter your code</h1>
        </section>

        {/* Verification Card */}
        <div className="concept-search-card" role="region" aria-label="otp-verification-card">
          <p className="verify-destination-text" style={{ fontSize: '14px', color: '#B8C7DB', textAlign: 'center', margin: '0 0 16px 0' }}>
            We sent a verification code to <strong className="verify-destination-highlight" style={{ color: '#22D3EE' }}>{maskedTarget}</strong>
          </p>

          <form onSubmit={handleVerify} noValidate>
            <div className="form-field-group">
              <label htmlFor="otp-digit-input" className="form-label" style={{ fontSize: '14px', color: '#B8C7DB', textAlign: 'center', display: 'block' }}>
                6-digit code
              </label>

              {/* 6 Visual OTP Boxes */}
              <div
                className="otp-boxes-wrapper"
                onClick={() => hiddenInputRef.current?.focus()}
                role="group"
                aria-label="6-digit verification code"
              >
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const char = otp[index] || '';
                  const isActive = otp.length === index || (index === 5 && otp.length === 6);
                  return (
                    <div
                      key={index}
                      className={`otp-box-cell ${char ? 'filled' : ''} ${isActive ? 'focused' : ''}`}
                    >
                      {char}
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

            {/* Inline Error Alert */}
            {apiError && (
              <div className="concept-alert error" role="alert" style={{ margin: '12px 0', fontSize: '14px' }}>
                <span>⚠ {apiError}</span>
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              className="concept-cta-btn"
              disabled={loading || otp.length !== 6}
              aria-label="verify-otp-button"
              style={{ marginTop: '12px' }}
            >
              <span>{loading ? 'Verifying...' : 'Verify'}</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </button>
          </form>

          {/* Resend Row with Countdown */}
          <div className="otp-meta-glass-row" style={{ marginTop: '16px' }}>
            <span className="otp-timer-glass-pill" aria-label="Countdown Timer" style={{ fontSize: '14px' }}>
              {timeLeft <= 0 ? (
                <span style={{ color: '#F87171', fontWeight: 600 }}>Code expired</span>
              ) : (
                <>
                  <span>Expires in:</span>
                  <strong style={{ marginLeft: '4px', color: '#22D3EE' }}>{formatTime(timeLeft)}</strong>
                </>
              )}
            </span>
            <button
              type="button"
              className="otp-resend-glass-btn"
              disabled={(cooldown > 0 && timeLeft > 0) || resending || loading}
              onClick={handleResend}
              aria-label="resend-otp-button"
              style={{ fontSize: '14px' }}
            >
              {resending ? 'Sending...' : cooldown > 0 && timeLeft > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>

          {/* Change Email/Number Link */}
          <div className="otp-change-email-wrap" style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              className="otp-change-email-link"
              onClick={() => {
                sessionStorage.removeItem('osint_target_email');
                sessionStorage.removeItem('osint_target_type');
                navigate('/search');
              }}
              style={{ fontSize: '14px', color: '#22D3EE', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Change email or phone number
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
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
      </footer>
    </div>
  );
}
