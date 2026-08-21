import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import api from '../lib/api';
import BreachTimeline from '../components/BreachTimeline';
import bgVideo2 from '../bg2.mp4';
import '../App.css';
import '../auth.css';

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // If state explicitly passed verified: false, treat as unverified
  const stateVerified = location.state?.verified !== false;
  const verifiedEmail = (stateVerified && (location.state?.email || sessionStorage.getItem('osint_verified_email'))) || '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'timeline' | 'terminal'
  const [redirectVerify, setRedirectVerify] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!verifiedEmail) return;

    let isMounted = true;

    async function fetchResults() {
      setLoading(true);
      setError('');

      try {
        const token = sessionStorage.getItem('osint_token');
        const payload = {
          query: verifiedEmail,
          searchType: 'Email',
          osintType: 'MOBILE_OSINT'
        };
        if (token) payload.token = token;

        const res = await api.post('/api/search', payload);

        if (isMounted) {
          if (res.data && res.data.success) {
            setData(res.data.data);
          } else {
            setError(res.data?.error || 'Failed to retrieve scan results.');
          }
        }
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 403) {
            sessionStorage.removeItem('osint_verified_email');
            setRedirectVerify(true);
            return;
          }
          setError(err.response?.data?.error || err.message || 'Error communicating with intelligence feeds.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [verifiedEmail]);

  if (redirectVerify) {
    return <Navigate to="/verify-otp" replace />;
  }

  if (!verifiedEmail) {
    return <Navigate to="/" replace />;
  }

  const handleNewSearch = () => {
    sessionStorage.removeItem('osint_verified_email');
    sessionStorage.removeItem('osint_target_email');
    sessionStorage.removeItem('osint_token');
    navigate('/');
  };

  const exposure = data?.analytics?.exposure || {
    score: 0,
    riskLevel: 'LOW',
    riskColor: '#00ff66',
    breakdown: [],
    entities: {}
  };

  const timelineEvents = data?.analytics?.timeline || [];
  const packets = data?.packets || [];
  const records = data?.records || [];

  const handleCopyTerminal = () => {
    const text = packets.map(p => p.info || '').join('\n\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="auth-screen results-screen">
      <video className="bg-video" autoPlay muted loop playsInline aria-hidden>
        <source src={bgVideo2} type="video/mp4" />
      </video>

      <div className="hero" aria-hidden="false">
        <h1 className="hero-title">INTELLIGENCE REPORT</h1>
        <div className="hero-credit">Target: <strong>{verifiedEmail}</strong></div>
      </div>

      <div className="results-container">
        {loading ? (
          <div className="loading-card" style={{ textAlign: 'center', padding: '40px', color: '#00eaff' }}>
            <div className="spinner"></div>
            <p style={{ fontFamily: 'monospace', marginTop: '16px' }}>Correlating multi-source breach intelligence feeds...</p>
          </div>
        ) : error ? (
          <div className="search-card error-card">
            <div className="auth-alert error-alert">⚠ {error}</div>
            <button className="search-btn" onClick={handleNewSearch} aria-label="new-search">
              Start New Search
            </button>
          </div>
        ) : (
          <>
            {/* Risk Gauge & Summary Header */}
            <div className="exposure-summary-card">
              <div className="score-badge-circle" style={{ borderColor: exposure.riskColor || '#00ff66' }}>
                <span className="score-num">{exposure.score}</span>
                <span className="score-max">/100</span>
              </div>
              <div className="exposure-meta">
                <div className="risk-level-tag" style={{ color: exposure.riskColor || '#00ff66' }}>
                  THREAT LEVEL: {exposure.riskLevel}
                </div>
                <div className="entities-summary">
                  {exposure.entities?.hasDocument && (
                    <span className="entity-chip alert-chip">National Document / Aadhaar Exposed</span>
                  )}
                  {exposure.entities?.passwordCount > 0 && (
                    <span className="entity-chip warn-chip">
                      {exposure.entities.passwordCount} Password(s) Leaked
                    </span>
                  )}
                  {exposure.entities?.phoneCount > 0 && (
                    <span className="entity-chip info-chip">
                      {exposure.entities.phoneCount} Phone(s) Linked
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Risk Factor Breakdown */}
            {exposure.breakdown && exposure.breakdown.length > 0 && (
              <div className="factors-card">
                <h3>Identified Threat Vectors</h3>
                <ul className="factors-list">
                  {exposure.breakdown.map((item, idx) => (
                    <li key={idx} className="factor-item">
                      <span>{item.factor}</span>
                      <span className="factor-pts">+{item.points} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* View Mode Switcher */}
            <div className="view-mode-bar">
              <button
                className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                aria-label="cards-view"
              >
                🗂️ Breach Cards ({records.length})
              </button>
              <button
                className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setViewMode('timeline')}
                aria-label="timeline-view"
              >
                ⏳ Timeline View
              </button>
              <button
                className={`view-btn ${viewMode === 'terminal' ? 'active' : ''}`}
                onClick={() => setViewMode('terminal')}
                aria-label="terminal-view"
              >
                💻 Raw Terminal
              </button>
              <button
                className="view-btn new-search-btn"
                onClick={handleNewSearch}
                aria-label="new-search"
              >
                🔍 New Search
              </button>
            </div>

            {/* Content View: Cards View */}
            {viewMode === 'cards' && (
              <div className="breach-cards-view-wrapper">
                {records.length > 0 ? (
                  <div className="breach-cards-grid">
                    {records.map((rec) => (
                      <div key={rec.id} className="breach-card slide-in">
                        <div className="card-header">
                          <div>
                            <div className="card-title">💾 {rec.title}</div>
                            <div className="card-category-tag">{rec.category}</div>
                          </div>
                          <span className="card-year-badge">{rec.year}</span>
                        </div>

                        <div className="card-pills-row">
                          {rec.dataClasses.map((dc, dcIdx) => (
                            <span key={dcIdx} className="data-pill">
                              {dc.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>

                        <p className="card-details-text">{rec.details}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="factors-card" style={{ textAlign: 'center', padding: '32px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛡️</div>
                    <h3 style={{ color: '#00ff66', margin: '0 0 8px 0' }}>Clean Profile Detected</h3>
                    <p style={{ color: '#94a3b8', margin: 0, fontFamily: 'monospace', fontSize: '0.86rem' }}>
                      No public credential leaks or infostealer infections detected in primary intelligence feeds.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Content View: Timeline View */}
            {viewMode === 'timeline' && (
              <div className="timeline-view-wrapper slide-in">
                <BreachTimeline events={timelineEvents} />
              </div>
            )}

            {/* Content View: Terminal View */}
            {viewMode === 'terminal' && (
              <div className="terminal-view-wrapper slide-in">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <button
                    onClick={handleCopyTerminal}
                    style={{
                      background: 'rgba(0, 234, 255, 0.15)',
                      border: '1px solid rgba(0, 234, 255, 0.4)',
                      color: '#00eaff',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace'
                    }}
                  >
                    {copied ? '✔ Copied!' : '📋 Copy Logs'}
                  </button>
                </div>
                {packets.map((pkt, pIdx) => (
                  <pre key={pIdx} className="terminal-output">
                    {pkt.info || 'No breach details available.'}
                  </pre>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
