import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
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
      const payload = isPhoneType
        ? { target: cleanTarget.replace(/[\s-]/g, ''), phone: cleanTarget.replace(/[\s-]/g, ''), email: cleanTarget.replace(/[\s-]/g, '') }
        : { email: cleanTarget.toLowerCase() };

      const res = await api.post('/api/auth/send-otp', payload);
      if (res.data && res.data.success === true) {
        const storedTarget = isPhoneType ? cleanTarget.replace(/[\s-]/g, '') : cleanTarget.toLowerCase();
        sessionStorage.setItem('osint_target_email', storedTarget);
        sessionStorage.setItem('osint_target_type', identifierType);
        navigate('/verify-otp', { state: { email: storedTarget, identifierType } });
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
          <a href="/" className="nav-link-item active">Home</a>
          <a href="#about" className="nav-link-item">About</a>
          <a href="#features" className="nav-link-item">Features</a>
          <a href="#contact" className="nav-link-item">Contact</a>
        </nav>

        <div className="system-status-pill">
          <span className="status-dot"></span>
          <span>System Online</span>
        </div>
      </header>

      {/* Main Body */}
      <main className="concept-main">
        {/* Hero Section */}
        <section className="concept-hero">
          <h1 className="concept-hero-title">OSINT SEARCH</h1>
          <p className="concept-hero-subtitle">
            Search public breach intelligence sources securely using privacy-preserving lookup techniques.
          </p>
          <div className="concept-hero-tags">
            PRIVACY &nbsp;•&nbsp; INTELLIGENCE &nbsp;•&nbsp; A SAFER TOMORROW
          </div>
        </section>

        {/* Central Search Card */}
        <div className="concept-search-card" role="search">
          <div className="card-header-row">
            <div className="search-icon-circle" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <div className="card-header-text">
              <h2>Search Breach Intelligence</h2>
              <p>Check whether your email or phone number appears in known public breach datasets without exposing the full identifier.</p>
            </div>
          </div>

          <form onSubmit={handleGenerateOtp} noValidate>
            {/* Field 1: Identifier Type */}
            <div className="form-field-group">
              <label htmlFor="identifier-type-select" className="form-label">
                Identifier Type
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
                Target Identifier
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
            You will receive a one-time password (OTP) to verify your identity.
          </div>
        </div>

        {/* Feature Pillars (3 Bottom Cards) */}
        <section className="concept-pillars-grid" aria-label="Core Technology Pillars">
          {/* Pillar 1: Privacy First */}
          <div className="pillar-card cyan">
            <div className="pillar-icon-box" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="pillar-text">
              <h3>Privacy First</h3>
              <p>k-Anonymity based lookup keeps your data private.</p>
            </div>
          </div>

          {/* Pillar 2: AI Risk Analysis */}
          <div className="pillar-card purple">
            <div className="pillar-icon-box" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <div className="pillar-text">
              <h3>AI Risk Analysis</h3>
              <p>Machine learning powered exposure scoring.</p>
            </div>
          </div>

          {/* Pillar 3: Audit Integrity */}
          <div className="pillar-card green">
            <div className="pillar-icon-box" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </div>
            <div className="pillar-text">
              <h3>Audit Integrity</h3>
              <p>Blockchain-backed immutable audit logs.</p>
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
