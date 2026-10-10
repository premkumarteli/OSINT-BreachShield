import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { buildSendOtpPayload } from '../lib/otpPayload';
import Navbar from '../components/Navbar';
import './search_concept.css';

const bgVideo1 = '/bg1.mp4';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

export default function SearchPage() {
  const navigate = useNavigate();
  const [identifierType, setIdentifierType] = useState('email');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateInput = (type, val) => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    if (type === 'phone') {
      const cleanDigits = trimmed.replace(/[\s-]/g, '');
      if (!PHONE_REGEX.test(cleanDigits)) {
        return 'Please enter a valid phone number (10 to 15 digits)';
      }
      return '';
    } else {
      if (!EMAIL_REGEX.test(trimmed)) {
        return 'Please enter a valid email address';
      }
      return '';
    }
  };

  const isFormValid = () => {
    const trimmed = email.trim();
    if (!trimmed) return false;
    if (identifierType === 'phone') {
      return PHONE_REGEX.test(trimmed.replace(/[\s-]/g, ''));
    }
    return EMAIL_REGEX.test(trimmed);
  };

  const handleTypeSelect = (newType) => {
    setIdentifierType(newType);
    setDropdownOpen(false);
    setApiError('');
    if (email.trim()) {
      setValidationError(validateInput(newType, email));
    } else {
      setValidationError('');
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setApiError('');
    setValidationError(validateInput(identifierType, val));
  };

  const handleGenerateOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanTarget = email.trim();
    const isPhoneType = identifierType === 'phone';
    const err = validateInput(identifierType, cleanTarget);

    if (err || !cleanTarget) {
      setValidationError(err || (isPhoneType ? 'Please enter a valid phone number' : 'Please enter a valid email address'));
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const payload = buildSendOtpPayload(cleanTarget, identifierType);

      const res = await api.post('/api/auth/send-otp', payload);
      if (res.data && res.data.success === true) {
        const storedTarget = isPhoneType ? cleanTarget.replace(/[\s-]/g, '') : cleanTarget.toLowerCase();
        sessionStorage.setItem('osint_target_email', storedTarget);
        sessionStorage.setItem('osint_target_type', identifierType);
        navigate('/verify', { state: { email: storedTarget, identifierType } });
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

      {/* Subtle Atmospheric Depth Tint */}
      <div className="concept-background" aria-hidden="true" />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Body - Centered Title + Minimal Card */}
      <main className="concept-main">
        <section className="concept-hero">
          <h1 className="concept-hero-title">OSINT SEARCH</h1>
        </section>

        <div className="concept-search-card" role="search">
          <form onSubmit={handleGenerateOtp} noValidate>
            {/* Field 1: Identifier Type */}
            <div className="form-field-group">
              <label htmlFor="identifier-type-select" className="form-label">
                Search by
              </label>
              <div className="custom-dropdown-wrap" ref={dropdownRef}>
                <button
                  type="button"
                  id="identifier-type-select"
                  className={`concept-select glass-dropdown-btn ${dropdownOpen ? 'active' : ''}`}
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  disabled={loading}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                >
                  <div className="dropdown-btn-left">
                    {identifierType === 'phone' ? (
                      <svg className="field-icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    ) : (
                      <svg className="field-icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    )}
                    <span>{identifierType === 'email' ? 'Email Address' : 'Phone Number'}</span>
                  </div>
                  <svg className={`dropdown-chevron ${dropdownOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="dropdown-menu" role="listbox">
                    <div
                      className={`dropdown-item ${identifierType === 'email' ? 'selected' : ''}`}
                      role="option"
                      aria-selected={identifierType === 'email'}
                      onClick={() => handleTypeSelect('email')}
                    >
                      <span>Email Address</span>
                      {identifierType === 'email' && <span className="dropdown-check">✓</span>}
                    </div>
                    <div
                      className={`dropdown-item ${identifierType === 'phone' ? 'selected' : ''}`}
                      role="option"
                      aria-selected={identifierType === 'phone'}
                      onClick={() => handleTypeSelect('phone')}
                    >
                      <span>Phone Number</span>
                      {identifierType === 'phone' && <span className="dropdown-check">✓</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Field 2: Target Identifier */}
            <div className="form-field-group">
              <label htmlFor="target-identifier-input" className="form-label">
                {identifierType === 'phone' ? 'Your phone number' : 'Your email address'}
              </label>
              <div className="input-with-icon">
                {identifierType === 'phone' ? (
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                ) : (
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                )}
                <input
                  id="target-identifier-input"
                  className="concept-input"
                  type={identifierType === 'phone' ? 'tel' : 'email'}
                  placeholder={identifierType === 'phone' ? 'Enter phone number (e.g. 7337771210 or +91 9876543210)' : 'Enter email address (e.g. user@example.com)'}
                  value={email}
                  onChange={handleInputChange}
                  aria-label="email-input"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              className="concept-cta-btn"
              disabled={loading || !isFormValid()}
              aria-label="generate-otp-button"
            >
              <svg className="btn-icon-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>{loading ? 'Transmitting OTP...' : 'Generate Secure OTP'}</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </button>
          </form>

          {/* Validation & Error Alerts */}
          {validationError && (
            <div className="concept-alert error" role="alert">
              {validationError}
            </div>
          )}

          {apiError && (
            <div className="concept-alert error" role="alert">
              ⚠ {apiError}
            </div>
          )}

          <div className="card-footer-reassurance">
            We'll send a one-time code to verify it's you.
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
