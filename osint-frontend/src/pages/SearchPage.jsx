import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import bgVideo1 from '../bg1.mp4';
import '../App.css';
import '../auth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SearchPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [overlayActive, setOverlayActive] = useState(false);

  const isValidEmail = EMAIL_REGEX.test(email.trim());

  const handleInputChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setApiError('');

    if (!val.trim()) {
      setValidationError('');
    } else if (!EMAIL_REGEX.test(val.trim())) {
      setValidationError('Please enter a valid email address');
    } else {
      setValidationError('');
    }
  };

  const handleGenerateOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const res = await api.post('/api/auth/send-otp', { email: cleanEmail });
      if (res.data && res.data.success !== false) {
        sessionStorage.setItem('osint_target_email', cleanEmail);
        navigate('/verify-otp', { state: { email: cleanEmail } });
      } else {
        setApiError(res.data?.error || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to send OTP. Please try again.';
      setApiError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <video className="bg-video" autoPlay muted loop playsInline aria-hidden>
        <source src={bgVideo1} type="video/mp4" />
      </video>

      <div className={`video-overlay ${overlayActive ? 'active' : ''}`} aria-hidden="true" />

      <div className="hero" aria-hidden="false">
        <h1 className="hero-title">OSINT SEARCH</h1>
        <div className="hero-credit">Developed by <strong>PhishBreach Guardians</strong></div>
      </div>

      <div className="search-card" role="search">
        <form onSubmit={handleGenerateOtp} style={{ width: '100%' }}>
          <div className={`search-row centered ${loading ? 'search-anim' : ''}`}>
            <input
              className="search-input"
              type="email"
              placeholder="Enter email to check breaches (e.g. test@example.com)"
              value={email}
              onChange={handleInputChange}
              onFocus={() => setOverlayActive(true)}
              onBlur={() => setOverlayActive(false)}
              aria-label="email-input"
              aria-busy={loading}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              className="search-btn"
              disabled={loading || !isValidEmail}
              aria-label="generate-otp-button"
            >
              {loading ? '[ TRANSMITTING... ]' : '[ GENERATE OTP ⚡ ]'}
            </button>
          </div>
        </form>

        {validationError && (
          <div className="validation-error">{validationError}</div>
        )}

        {apiError && (
          <div className="auth-alert error-alert" style={{ width: '100%', maxWidth: '640px', marginTop: '8px' }}>
            ⚠ {apiError}
          </div>
        )}

        <div className="inline-disclaimer" role="note">
          🔒 Disclaimer: Prototype link is for evaluation purpose only. Please do not share, project is under active development.
        </div>
      </div>
    </div>
  );
}
