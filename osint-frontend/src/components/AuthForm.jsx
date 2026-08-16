import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import '../auth.css';

export default function AuthForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // States for 3-step OTP flow
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer: 5 minutes = 300s
  const [timeLeft, setTimeLeft] = useState(300);
  // Resend cooldown: 30s
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);
  const cooldownRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startTimers = () => {
    setTimeLeft(300);
    setCooldown(30);

    if (timerRef.current) clearInterval(timerRef.current);
    if (cooldownRef.current) clearInterval(cooldownRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill in username, email, and password first');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setSuccessMsg('');
      setLoading(true);

      const res = await api.post('/api/auth/send-otp', { username, email });
      setOtpSent(true);
      setSuccessMsg(res.data?.message || 'OTP sent to your email successfully!');
      startTimers();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    try {
      setError('');
      setSuccessMsg('');
      setLoading(true);

      const res = await api.post('/api/auth/verify-otp', { email, otp });
      setIsVerified(true);
      setSuccessMsg(res.data?.message || '✓ Email verified successfully! You can now complete registration.');
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Registration
  const handleRegister = async () => {
    if (!isVerified) {
      setError('Please verify your email before registering.');
      return;
    }

    try {
      setError('');
      setSuccessMsg('');
      setLoading(true);

      await api.post('/api/auth/register', { username, email, password });
      setSuccessMsg('Account created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/search', { replace: true });
      }, 1000);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card slide-in">
      <h2 className="auth-title">[ CREATE OSINT ACCOUNT ]</h2>
      <div className="auth-subtitle">Encrypted Identity Vault Access</div>

      {/* Alerts */}
      {error && <div className="auth-alert error-alert">⚠️ {error}</div>}
      {successMsg && <div className="auth-alert success-alert">{successMsg}</div>}

      {/* Step 1: Input Details */}
      <div className="auth-form-fields">
        <label className="field-label">Operator Handle / Username</label>
        <input
          className="glass-input"
          placeholder="e.g. shadow_analyst"
          value={username}
          disabled={isVerified}
          onChange={e => setUsername(e.target.value)}
        />

        <label className="field-label">Official Email Address</label>
        <div className="input-group">
          <input
            className="glass-input"
            type="email"
            placeholder="name@example.com"
            value={email}
            disabled={isVerified}
            onChange={e => setEmail(e.target.value)}
          />
          {isVerified && <span className="verified-badge">✓ Verified</span>}
        </div>

        <label className="field-label">Master Password (min 6 characters)</label>
        <input
          className="glass-input"
          type="password"
          placeholder="••••••••••••"
          value={password}
          disabled={isVerified}
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      {/* Send OTP Trigger */}
      {!otpSent && !isVerified && (
        <button
          className="neon-btn"
          onClick={handleSendOtp}
          disabled={loading || !username.trim() || !email.trim() || password.length < 6}
        >
          {loading ? 'Transmitting OTP...' : '⚡ Send Verification OTP'}
        </button>
      )}

      {/* Step 2: OTP Verification Box */}
      {otpSent && !isVerified && (
        <div className="otp-verification-box">
          <div className="otp-header">
            <span className="otp-title">ENTER 6-DIGIT EMAIL CODE</span>
            <span className={`otp-timer ${timeLeft < 60 ? 'timer-urgent' : ''}`}>
              ⏱ {formatTimer(timeLeft)}
            </span>
          </div>

          <input
            className="glass-input otp-large-input"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
          />

          <button
            className="neon-btn verify-btn"
            onClick={handleVerifyOtp}
            disabled={loading || otp.length !== 6 || timeLeft === 0}
          >
            {loading ? 'Verifying...' : '✓ Verify Email OTP'}
          </button>

          <div className="resend-row">
            <span>Didn't receive the email?</span>
            <button
              className="link-btn resend-btn"
              onClick={handleSendOtp}
              disabled={loading || cooldown > 0}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Register Button (Enabled ONLY when email is verified) */}
      {isVerified && (
        <button
          className="neon-btn register-active-btn"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? 'Securing Identity...' : '🛡 Complete Account Registration'}
        </button>
      )}

      <div className="auth-switch">
        Already registered? <Link to="/login">Sign In to Dashboard</Link>
      </div>
    </div>
  );
}
