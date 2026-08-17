import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import bgVideo1 from '../bg1.mp4';
import '../App.css';
import '../auth.css';

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = (location.state?.email || sessionStorage.getItem('osint_target_email') || '').trim().toLowerCase();

  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300s)
  const [cooldown, setCooldown] = useState(30);  // 30s resend cooldown
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const inputRef = useRef(null);

  // Route guard: Redirect to / if no email is provided
  useEffect(() => {
    if (!email) {
      navigate('/', { replace: true });
    }
  }, [email, navigate]);

  // Main 5-minute countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 30s resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const cdTimer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(cdTimer);
  }, [cooldown]);

  // Auto-focus OTP input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    setError('');
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6 || loading || timeLeft <= 0) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/api/auth/verify-otp', {
        email,
        otp
      });

      if (res.data && res.data.success !== false) {
        if (res.data.token) {
          sessionStorage.setItem('osint_token', res.data.token);
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        }
        sessionStorage.setItem('osint_verified_email', email);
        navigate('/results', { state: { email, verified: true } });
      } else {
        setError(res.data?.error || 'Verification failed. Please try again.');
      }
    } catch (err) {
      let errMsg = err.response?.data?.error || err.message || 'Invalid or expired OTP';
      if (err.response?.data?.attemptsRemaining !== undefined) {
        errMsg += ` (${err.response.data.attemptsRemaining} attempts remaining)`;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/api/auth/send-otp', { email });
      if (res.data && res.data.success !== false) {
        setTimeLeft(300);
        setCooldown(30);
        setOtp('');
        setSuccessMsg(`New 6-digit access code dispatched to ${email}`);
        if (inputRef.current) inputRef.current.focus();
      } else {
        setError(res.data?.error || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="auth-screen">
      <video className="bg-video" autoPlay muted loop playsInline aria-hidden>
        <source src={bgVideo1} type="video/mp4" />
      </video>

      <div className="hero" aria-hidden="false">
        <h1 className="hero-title">OSINT SEARCH</h1>
        <div className="hero-credit">Developed by <strong>PhishBreach Guardians</strong></div>
      </div>

      <div className="auth-card" role="region" aria-label="OTP Verification">
        <h2 className="auth-title">[ EMAIL VERIFICATION ]</h2>
        <div className="auth-subtitle">
          Single-use access code transmitted to:<br />
          <strong style={{ color: '#00eaff' }}>{email}</strong>{' '}
          (<Link to="/" className="neon-link" style={{ fontSize: '0.8rem' }}>Change Email</Link>)
        </div>

        {error && (
          <div className="auth-alert error-alert">
            ⚠ {error}
          </div>
        )}

        {successMsg && (
          <div className="auth-alert success-alert">
            ✓ {successMsg}
          </div>
        )}

        <form onSubmit={handleVerify} className="otp-verification-box">
          <div className="otp-header">
            <span className="otp-title">ENTER 6-DIGIT CODE:</span>
            <span className={`otp-timer ${timeLeft < 60 ? 'timer-urgent' : ''}`} aria-label="Countdown Timer">
              ⏱ {formatTimer(timeLeft)}
            </span>
          </div>

          <div className="input-group">
            <input
              ref={inputRef}
              className="glass-input otp-large-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={otp}
              onChange={handleOtpChange}
              disabled={loading || timeLeft <= 0}
              aria-label="otp-input"
            />
          </div>

          <button
            type="submit"
            className="neon-btn verify-btn"
            disabled={otp.length !== 6 || loading || timeLeft <= 0}
            style={{ width: '100%', marginTop: '4px' }}
            aria-label="verify-otp-button"
          >
            {loading ? '[ VERIFYING... ]' : '[ VERIFY OTP ✓ ]'}
          </button>

          <div className="resend-row">
            <span>Didn't receive code?</span>
            <button
              type="button"
              className="link-btn resend-btn"
              onClick={handleResendOtp}
              disabled={cooldown > 0 || resending}
              aria-label="resend-otp-button"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : (resending ? 'Sending...' : 'Resend OTP ⚡')}
            </button>
          </div>
        </form>

        <div className="auth-switch">
          <Link to="/" className="neon-link">← Back to Search</Link>
        </div>
      </div>
    </div>
  );
}
