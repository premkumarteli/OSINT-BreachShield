import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import api from '../lib/api';
import BreachTimeline from '../components/BreachTimeline';
import AIIntelligenceCards from '../components/AIIntelligenceCards';
import bgVideo2 from '../bg2.mp4';
import '../App.css';
import '../auth.css';
import '../results.css';

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const stateVerified = location.state?.verified !== false;
  const verifiedEmail = (stateVerified && (location.state?.email || sessionStorage.getItem('osint_verified_email'))) || '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('overview');
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
        const payload = { query: verifiedEmail, searchType: 'Email', osintType: 'MOBILE_OSINT' };
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
    return () => { isMounted = false; };
  }, [verifiedEmail]);

  if (redirectVerify) return <Navigate to="/verify-otp" replace />;
  if (!verifiedEmail) return <Navigate to="/" replace />;

  const handleNewSearch = () => {
    sessionStorage.removeItem('osint_verified_email');
    sessionStorage.removeItem('osint_target_email');
    sessionStorage.removeItem('osint_token');
    navigate('/');
  };

  const exposure = data?.analytics?.exposure || { score: 0, riskLevel: 'LOW', riskColor: '#00ff66', breakdown: [], entities: {} };
  const timelineEvents = data?.analytics?.timeline || [];
  const packets = data?.packets || [];
  const records = data?.records || [];
  const auditData = data?.blockchainAudit || null;

  const getRiskGradient = (level) => {
    switch (level) {
      case 'CRITICAL': return 'linear-gradient(135deg, #ff003c 0%, #ff6b6b 100%)';
      case 'HIGH': return 'linear-gradient(135deg, #ff3b3b 0%, #ff8c42 100%)';
      case 'MEDIUM': return 'linear-gradient(135deg, #ffd166 0%, #ffb347 100%)';
      default: return 'linear-gradient(135deg, #00ff66 0%, #00eaff 100%)';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '⚡';
      default: return '🛡️';
    }
  };

  const handleCopyTerminal = () => {
    const text = packets.map(p => p.info || '').join('\n\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dashboard results-screen">
      <video className="bg-video" autoPlay muted loop playsInline aria-hidden>
        <source src={bgVideo2} type="video/mp4" />
      </video>

      <div className="hero" aria-hidden="false">
        <h1 className="hero-title">INTELLIGENCE REPORT</h1>
        <div className="hero-credit">
          <span className="hero-label">TARGET</span>
          <span className="hero-email">{verifiedEmail}</span>
        </div>
      </div>

      <div className="results-container">
        {loading ? (
          <div className="loading-card">
            <div className="spinner"></div>
            <div className="loading-text">Correlating multi-source breach intelligence feeds...</div>
            <div className="loading-dots"><span>.</span><span>.</span><span>.</span></div>
          </div>
        ) : error ? (
          <div className="error-card">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{error}</div>
            <button className="search-btn" onClick={handleNewSearch} aria-label="new-search">
              Start New Search
            </button>
          </div>
        ) : (
          <>
            {/* Risk Score Hero */}
            <div className="risk-hero" style={{ '--risk-color': exposure.riskColor || '#00ff66' }}>
              <div className="risk-glow" style={{ background: getRiskGradient(exposure.riskLevel) }}></div>
              <div className="risk-score-ring" style={{ borderColor: exposure.riskColor || '#00ff66' }}>
                <span className="risk-icon">{getRiskIcon(exposure.riskLevel)}</span>
                <span className="risk-score-num">{exposure.score}</span>
                <span className="risk-score-max">/100</span>
              </div>
              <div className="risk-info">
                <div className="risk-level-badge" style={{ background: getRiskGradient(exposure.riskLevel) }}>
                  THREAT LEVEL: {exposure.riskLevel}
                </div>
                <div className="risk-subtitle">Threat Assessment for <strong>{verifiedEmail}</strong></div>
                <div className="entity-chips">
                  {exposure.entities?.hasDocument && (
                    <span className="entity-chip alert-chip">National Document / Aadhaar Exposed</span>
                  )}
                  {exposure.entities?.passwordCount > 0 && (
                    <span className="entity-chip warn-chip">{exposure.entities.passwordCount} Password(s) Leaked</span>
                  )}
                  {exposure.entities?.phoneCount > 0 && (
                    <span className="entity-chip info-chip">{exposure.entities.phoneCount} Phone(s) Linked</span>
                  )}
                  {exposure.entities?.recordCount > 0 && (
                    <span className="entity-chip info-chip">{exposure.entities.recordCount} Record(s) Found</span>
                  )}
                </div>
              </div>
            </div>

            {/* Threat Factors */}
            {exposure.breakdown && exposure.breakdown.length > 0 && (
              <div className="threat-factors">
                <h3 className="section-title">
                  <span className="section-icon">🔍</span>
                  Identified Threat Vectors
                </h3>
                <div className="factors-grid">
                  {exposure.breakdown.map((item, idx) => (
                    <div key={idx} className="factor-card">
                      <div className="factor-bar" style={{ width: `${Math.min(100, item.points * 2)}%` }}></div>
                      <div className="factor-content">
                        <span className="factor-text">{item.factor}</span>
                        <span className="factor-pts">+{item.points}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View Navigation */}
            <div className="view-nav">
              {[
                { id: 'overview', label: 'Overview', icon: '📊', ariaLabel: 'overview-view' },
                { id: 'cards', label: `Breach Cards (${records.length})`, icon: '🗂️', ariaLabel: 'cards-view' },
                { id: 'timeline', label: 'Timeline', icon: '⏳', ariaLabel: 'timeline-view' },
                { id: 'terminal', label: 'Raw Data', icon: '💻', ariaLabel: 'terminal-view' }
              ].map(v => (
                <button
                  key={v.id}
                  className={`view-nav-btn ${viewMode === v.id ? 'active' : ''}`}
                  onClick={() => setViewMode(v.id)}
                  aria-label={v.ariaLabel}
                >
                  <span className="nav-icon">{v.icon}</span>
                  <span className="nav-label">{v.label}</span>
                </button>
              ))}
              <button className="view-nav-btn new-search" aria-label="new-search" onClick={handleNewSearch}>
                <span className="nav-icon">🔍</span>
                <span className="nav-label">New Search</span>
              </button>
            </div>

            {/* Overview View */}
            {viewMode === 'overview' && (
              <div className="overview-section">
                {/* Breach Summary */}
                <div className="summary-grid">
                  <div className="summary-stat">
                    <div className="stat-value">{records.length}</div>
                    <div className="stat-label">Breach Records</div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-value">{exposure.entities?.recordCount || 0}</div>
                    <div className="stat-label">Data Points</div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-value">{timelineEvents.length}</div>
                    <div className="stat-label">Timeline Events</div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-value">{exposure.score}/100</div>
                    <div className="stat-label">Risk Score</div>
                  </div>
                </div>

                {/* AI Intelligence Cards */}
                <AIIntelligenceCards
                  analytics={data?.analytics}
                  auditLedger={data?.auditLedger}
                  blockchainAudit={auditData}
                  token={sessionStorage.getItem('osint_token')}
                />

                {/* Quick Breach Preview */}
                {records.length > 0 && (
                  <div className="quick-preview">
                    <h3 className="section-title">
                      <span className="section-icon">💾</span>
                      Latest Breach Records
                    </h3>
                    <div className="preview-list">
                      {records.slice(0, 3).map((rec) => (
                        <div key={rec.id || `rec-${records.indexOf(rec)}`} className="preview-item">
                          <div className="preview-header">
                            <span className="preview-title">{rec.title}</span>
                            <span className="preview-year">{rec.year}</span>
                          </div>
                          <div className="preview-tags">
                            {(rec.dataClasses || []).slice(0, 4).map((dc, i) => (
                              <span key={i} className="preview-tag">{dc.replace(/_/g, ' ')}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {records.length > 3 && (
                      <button className="show-more-btn" onClick={() => setViewMode('cards')}>
                        View all {records.length} records →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="cards-section">
                {records.length > 0 ? (
                  <div className="breach-cards-grid">
                    {records.map((rec) => (
                      <div key={rec.id} className="breach-card slide-in">
                        <div className="card-header">
                          <div>
                            <div className="card-title">{rec.title}</div>
                            <div className="card-category-tag">{rec.category}</div>
                          </div>
                          <span className="card-year-badge">{rec.year}</span>
                        </div>
                        <div className="card-pills-row">
                          {(rec.dataClasses || []).map((dc, dcIdx) => (
                            <span key={dcIdx} className="data-pill">{dc.replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                        <p className="card-details-text">{rec.details}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🛡️</div>
                    <h3>Clean Profile Detected</h3>
                    <p>No public credential leaks or infostealer infections detected in primary intelligence feeds.</p>
                  </div>
                )}
              </div>
            )}

            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <div className="timeline-section">
                <BreachTimeline events={timelineEvents} />
              </div>
            )}

            {/* Terminal View */}
            {viewMode === 'terminal' && (
              <div className="terminal-section">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <span className="terminal-title">breach_intel@osint ~ $</span>
                  <button className="copy-btn" onClick={handleCopyTerminal}>
                    {copied ? '✔ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <div className="terminal-body">
                  {packets.map((pkt, pIdx) => (
                    <pre key={pIdx} className="terminal-output">
                      {pkt.info || 'No breach details available.'}
                    </pre>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
