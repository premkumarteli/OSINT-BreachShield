import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import api from '../lib/api';
import bgVideo1 from '../bg1.mp4';
import '../App.css';
import '../auth.css';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="auth-screen">
      <video className="bg-video" autoPlay muted loop playsInline aria-hidden>
        <source src={bgVideo1} type="video/mp4" />
      </video>

      <div className="hero" aria-hidden="false">
        <h1 className="hero-title">AUTHENTICATION REQUIRED</h1>
        <div className="hero-credit">Identity verification for <strong>{targetEmail}</strong></div>
      </div>

      <div className="search-card" role="region" aria-label="otp-verification-card">
        <form onSubmit={handleVerify} style={{ width: '100%' }}>
          <div className="search-row centered">
            <input
              className="search-input otp-digit-input"
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-Digit OTP"
              value={otp}
              onChange={handleOtpChange}
              aria-label="otp-input"
              aria-busy={loading}
              disabled={loading}
              autoFocus
              maxLength={6}
            />
            <button
              type="submit"
              className="search-btn"
              disabled={loading || otp.length !== 6}
              aria-label="verify-otp-button"
            >
              {loading ? '[ VERIFYING... ]' : '[ AUTHORIZE SCAN ⚡ ]'}
            </button>
          </div>
        </form>

        <div className="otp-meta-row">
          <span className="otp-expiry-hint" aria-label="Countdown Timer">
            ⏳ Code expires in: <strong>{formatTime(timeLeft)}</strong>
          </span>
          <button
            type="button"
            className="otp-resend-btn"
            disabled={cooldown > 0 || resending}
            onClick={handleResend}
            aria-label="resend-otp-button"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>

        {apiError && (
          <div className="auth-alert error-alert" style={{ width: '100%', maxWidth: '640px', marginTop: '12px' }}>
            ⚠ {apiError}
          </div>
        )}

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            className="change-target-btn"
            onClick={() => {
              sessionStorage.removeItem('osint_target_email');
              navigate('/');
            }}
          >
            ← Enter a different email
          </button>
        </div>
      </div>
    </div>
  );
}
