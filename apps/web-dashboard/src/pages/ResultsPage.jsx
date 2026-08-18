import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import BreachTimeline from '../components/BreachTimeline';
import { checkKAnonymity } from '../lib/kAnonymity';
import bgVideo2 from '../bg2.mp4';
import bgVideo3 from '../bg3.mp4';
import '../App.css';
import '../auth.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = (location.state?.email || sessionStorage.getItem('osint_verified_email') || '').trim().toLowerCase();
  const isVerified = Boolean(location.state?.verified || sessionStorage.getItem('osint_verified_email'));

  const [result, setResult] = useState(null);
  const [kAnon, setKAnon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWaitHint, setShowWaitHint] = useState(false);
  const [viewMode, setViewMode] = useState('terminal');
  const [terminalText, setTerminalText] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Pagination state
  const [breaches, setBreaches] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(null);

  // Video refs
  const bg2Ref = useRef(null);
  const bg3Ref = useRef(null);
  const [useBg2, setUseBg2] = useState(false);
  const [useBg3, setUseBg3] = useState(true);

  // Typing effect refs
  const typingRef = useRef(null);
  const visitedPagesRef = useRef(new Set());
  const waitHintTimerRef = useRef(null);
  const searchExecutedRef = useRef(false);

  // Guard: Redirect to / if unverified or no email
  useEffect(() => {
    if (!email || !isVerified) {
      navigate('/', { replace: true });
    }
  }, [email, isVerified, navigate]);

  // Normalize result data
  const normalizeResultData = useCallback((data) => {
    if (!data || typeof data !== 'object') return data;
    if (!Array.isArray(data.packets)) return data;

    const isNoResultText = (txt) =>
      typeof txt === 'string' && /no\s*results?(\s*found)?/i.test(txt);

    const safeMsg = '  Your data is safe — no results found.';
    const copy = { ...data, packets: data.packets.map((p) => ({ ...(p || {}) })) };

    copy.packets = copy.packets.map((p) => {
      if (p && isNoResultText(p.info)) {
        return { ...p, info: safeMsg };
      }
      return p;
    });

    return copy;
  }, []);

  const stopTyping = useCallback(() => {
    if (typingRef.current) {
      clearInterval(typingRef.current);
      typingRef.current = null;
    }
  }, []);

  const startTyping = useCallback((fullText, onComplete) => {
    stopTyping();
    if (!fullText) return;
    setTerminalText('');
    const totalLen = fullText.length;
    // Calculate dynamic chunk size so animation completes smoothly within ~350ms
    const chunkSize = Math.max(15, Math.ceil(totalLen / 30));
    let index = 0;
    typingRef.current = setInterval(() => {
      index += chunkSize;
      if (index >= totalLen) {
        setTerminalText(fullText);
        stopTyping();
        if (typeof onComplete === 'function') onComplete();
      } else {
        setTerminalText(fullText.slice(0, index));
      }
    }, 12);
  }, [stopTyping]);

  // Prefetch subsequent pages if paginated
  const prefetchNextPages = useCallback(async (startIndex = 1) => {
    const MAX_PREFETCH = 10;
    let pageCount = startIndex;

    for (; pageCount <= MAX_PREFETCH; pageCount += 1) {
      try {
        const res = await api.post('/api/telegram-page');
        if (!res.data || res.data.success === false) break;

        const data = res.data;
        const pageDataRaw = data && data.data ? data.data : null;
        const pageData = pageDataRaw ? normalizeResultData(pageDataRaw) : null;

        if (data?.data?.pagination?.total > 1) {
          setTotalPages(data.data.pagination.total);
        } else if (data?.data?.pagination?.total <= 1) {
          setTotalPages(null);
        }

        if (!pageData || (pageData.packets && pageData.packets.length === 0)) break;

        setBreaches((prev) => [...prev, pageData]);
      } catch (e) {
        break;
      }
    }
  }, [normalizeResultData]);

  // Auto-execute search on mount
  useEffect(() => {
    if (!email || !isVerified || searchExecutedRef.current) return;
    searchExecutedRef.current = true;

    let isMounted = true;
    setLoading(true);
    setUseBg3(true);
    setUseBg2(false);

    // Play bg3 video
    if (bg3Ref.current) {
      try {
        bg3Ref.current.currentTime = 0;
        bg3Ref.current.play().catch(() => {});
      } catch (_) {}
    }

    waitHintTimerRef.current = setTimeout(() => {
      if (isMounted) setShowWaitHint(true);
    }, 10000);

    const executeSearch = async () => {
      try {
        // Trigger parallel k-Anonymity zero-knowledge range query
        checkKAnonymity(email).then((kData) => {
          if (isMounted) setKAnon(kData);
        }).catch(() => {});

        const res = await api.post('/api/search', {
          query: email,
          searchType: 'Email',
          osintType: 'MOBILE_OSINT'
        });

        if (!isMounted) return;

        if (waitHintTimerRef.current) clearTimeout(waitHintTimerRef.current);
        setShowWaitHint(false);

        const data = res.data;
        if (!data || data.success === false) {
          throw new Error(data?.error || 'Search failed');
        }

        const resultDataRaw = data?.data || { packets: [{}, { info: 'No breach records located.' }] };
        const resultData = normalizeResultData(resultDataRaw);

        if (data?.data?.pagination?.total > 1) {
          setTotalPages(data.data.pagination.total);
        } else {
          setTotalPages(null);
        }

        setBreaches([resultData]);
        setCurrentPage(0);
        setResult(resultData);
        setLoading(false);
        setUseBg3(false);
        setUseBg2(true);

        if (bg2Ref.current) {
          try {
            bg2Ref.current.currentTime = 0;
            bg2Ref.current.play().catch(() => {});
          } catch (_) {}
        }

        // Prefetch any additional pages
        prefetchNextPages(1);
      } catch (err) {
        if (!isMounted) return;
        if (waitHintTimerRef.current) clearTimeout(waitHintTimerRef.current);
        setShowWaitHint(false);

        if (err.response?.status === 403) {
          const errMsg = err.response?.data?.error || 'Verification required';
          if (errMsg.includes('only search the email/phone you verified')) {
            const errorResult = { error: `⛔ Access Denied: ${errMsg}` };
            setBreaches([errorResult]);
            setCurrentPage(0);
            setResult(errorResult);
            setLoading(false);
            setUseBg3(true);
            setUseBg2(false);
            return;
          }
          sessionStorage.removeItem('osint_verified_email');
          navigate('/verify-otp', { state: { email } });
          return;
        }

        const errorMsg = err.response?.data?.error || err.message || 'Server error occurred while scanning breaches.';
        const errorResult = { error: `❌ ${errorMsg}` };
        setBreaches([errorResult]);
        setCurrentPage(0);
        setResult(errorResult);
        setLoading(false);
        setUseBg3(true);
        setUseBg2(false);
      }
    };

    executeSearch();

    return () => {
      isMounted = false;
      if (waitHintTimerRef.current) clearTimeout(waitHintTimerRef.current);
      stopTyping();
    };
  }, [email, isVerified, navigate, normalizeResultData, prefetchNextPages, stopTyping]);

  // Terminal typewriter effect upon result/page change
  useEffect(() => {
    if (!result) return undefined;
      const text = (result.packets || [])
        .map(p => p.info || (`[ TARGET: ${email} ]\n[ MOBILE: ${p.mobile || 'N/A'} ]\n[ NAME: ${p.name || 'N/A'} ]\n[ ADDRESS: ${p.address || 'N/A'} ]\n`))
        .filter(Boolean)
        .join('\n\n');

      if (visitedPagesRef.current.has(currentPage)) {
        stopTyping();
        setTerminalText(text || '');
        return undefined;
      }

      visitedPagesRef.current.add(currentPage);
      const startDelay = setTimeout(() => startTyping(text), 250);
      return () => {
        clearTimeout(startDelay);
        stopTyping();
      };
    } catch (_) {}
    return undefined;
  }, [result, currentPage, email, startTyping, stopTyping]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const preferredPacket = (result?.packets && result.packets[1] !== undefined) ? result.packets[1] : result?.packets?.[0];
      const content = terminalText || preferredPacket?.info || JSON.stringify(result || {});

      const res = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: email, content })
      });

      if (!res.ok) {
        const t = await res.text();
        setResult((prev) => ({ ...prev, error: `❌ Download failed: ${t || res.status}` }));
        return;
      }

      const cd = res.headers.get('Content-Disposition') || '';
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
      const filename = decodeURIComponent(match?.[1] || match?.[2] || `breach_report_${email.replace(/[@.]/g, '_')}.html`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setResult((prev) => ({ ...prev, error: `❌ Download error: ${e.message}` }));
    } finally {
      setDownloading(false);
    }
  };

  const handleNewSearch = () => {
    stopTyping();
    sessionStorage.removeItem('osint_target_email');
    sessionStorage.removeItem('osint_verified_email');
    sessionStorage.removeItem('osint_token');
    navigate('/');
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const prevIdx = currentPage - 1;
      setCurrentPage(prevIdx);
      if (breaches[prevIdx]) {
        setResult(breaches[prevIdx]);
      }
    }
  };

  const handleNextPage = () => {
    const nextIdx = currentPage + 1;
    if (breaches[nextIdx]) {
      setCurrentPage(nextIdx);
      setResult(breaches[nextIdx]);
    }
  };

  if (!email || !isVerified) return null;

  return (
    <div className="auth-screen">
      {/* Searching Background Video (bg3) */}
      <video
        ref={bg3Ref}
        className={`bg-video bg3 ${useBg3 ? 'visible zoom' : ''}`}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      >
        <source src={bgVideo3} type="video/mp4" />
      </video>

      {/* Results Background Video (bg2) */}
      <video
        ref={bg2Ref}
        className={`bg-video bg2 ${useBg2 ? 'visible zoom' : ''}`}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      >
        <source src={bgVideo2} type="video/mp4" />
      </video>

      <div className="video-overlay active" aria-hidden="true" />

      {/* Loading Animation */}
      {loading && (
        <div className="searching-animation">
          <div className="searching-text">Scanning Breach Repositories<span className="dots"></span></div>
          {showWaitHint && (
            <div className="searching-hint">Cross-referencing intelligence archives, please wait…</div>
          )}
        </div>
      )}

      {/* Results Presentation */}
      {!loading && (
        <div className="results">
          {result && result.packets && (() => {
            const preferredPacket = (result.packets[1] !== undefined) ? result.packets[1] : result.packets[0];
            const infoText = preferredPacket && typeof preferredPacket.info === 'string' ? preferredPacket.info : '';
            const isNoResult = /no\s*results?(\s*found)?/i.test(infoText || '');

            const effectiveTotal = (typeof totalPages === 'number' && totalPages > 0)
              ? totalPages
              : (result?.pagination?.total && typeof result.pagination.total === 'number')
                ? result.pagination.total
                : (breaches && breaches.length ? breaches.length : 1);

            const hasPagination = Number(effectiveTotal) > 1;

            return (
              <div className="packet" key={0}>
                {/* Exposure Score & Risk Classification Header */}
                {result?.analytics?.exposure && !isNoResult && (
                  <div className="exposure-meter-card">
                    <div className="exposure-gauge-container">
                      <div
                        className="exposure-score-circle"
                        style={{ borderColor: result.analytics.exposure.riskColor || '#00ff66' }}
                      >
                        <span className="score-num">{result.analytics.exposure.score ?? 0}</span>
                        <span className="score-label">/ 100</span>
                      </div>
                      <div className="exposure-meta">
                        <div
                          className="risk-badge"
                          style={{
                            backgroundColor: `${result.analytics.exposure.riskColor || '#00ff66'}22`,
                            color: result.analytics.exposure.riskColor || '#00ff66',
                            borderColor: result.analytics.exposure.riskColor || '#00ff66'
                          }}
                        >
                          THREAT LEVEL: {result.analytics.exposure.riskLevel || 'LOW'}
                        </div>
                        <div className="exposure-summary">
                          {result.analytics.exposure.entities?.recordCount ?? 1} records identified • {result.analytics.exposure.entities?.phoneCount ?? 0} phone numbers linked • {result.analytics.exposure.entities?.hasDocument ? '⚠️ National Document / Aadhaar Exposed' : 'Digital Exposure Detected'}
                        </div>
                      </div>
                    </div>

                    {/* Factor Breakdown Chips */}
                    {Array.isArray(result.analytics.exposure.breakdown) && result.analytics.exposure.breakdown.length > 0 && (
                      <div className="breakdown-chips">
                        {result.analytics.exposure.breakdown.map((b, idx) => (
                          <span className="breakdown-chip" key={idx}>
                            ⚡ {b?.factor || 'Threat factor'}: +{b?.points || 0} pts
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Zero-Knowledge k-Anonymity Cryptographic Verification Card */}
                {kAnon && (
                  <div className="kanon-hud-card" style={{
                    background: 'rgba(7, 10, 19, 0.75)',
                    border: '1px solid rgba(0, 243, 255, 0.4)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: '#00F3FF', fontWeight: 'bold' }}>
                        🛡️ ZERO-KNOWLEDGE k-ANONYMITY PROOF
                      </span>
                      <span style={{
                        color: kAnon.isPwned ? '#FF003C' : '#00FF66',
                        background: kAnon.isPwned ? 'rgba(255, 0, 60, 0.15)' : 'rgba(0, 255, 102, 0.15)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${kAnon.isPwned ? '#FF003C' : '#00FF66'}`
                      }}>
                        {kAnon.isPwned ? `⚠️ COMPROMISED IN ${kAnon.exposureCount} BREACH(ES)` : '✅ ZERO DIRECT LEAKS IN PARTITION'}
                      </span>
                    </div>

                    <div style={{ color: '#94A3B8', fontSize: '0.75rem', lineHeight: '1.4' }}>
                      <div>SHA-256 Hash: <span style={{ color: '#E2E8F0' }}>{kAnon.fullHash ? `${kAnon.fullHash.slice(0, 16)}...${kAnon.fullHash.slice(-8)}` : 'N/A'}</span></div>
                      <div>k-Anonymity Partition Prefix: <span style={{ color: '#00F3FF', fontWeight: 'bold' }}>{kAnon.prefix || 'N/A'}</span> (Queried 5-char hex bucket anonymously)</div>
                      {kAnon.sources && kAnon.sources.length > 0 && (
                        <div style={{ marginTop: '4px' }}>
                          Breach Sources: <span style={{ color: '#F59E0B' }}>{kAnon.sources.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="packet-header">
                  <h2>[ Target Intelligence: {email} ]</h2>

                  <div className="header-actions-group">
                    {/* View Mode Switcher */}
                    {!isNoResult && (
                      <div className="view-mode-toggle">
                        <button
                          className={`tab-toggle-btn ${viewMode === 'terminal' ? 'active' : ''}`}
                          onClick={() => setViewMode('terminal')}
                          aria-label="terminal-view"
                        >
                          [ Terminal View ]
                        </button>
                        <button
                          className={`tab-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                          onClick={() => setViewMode('timeline')}
                          aria-label="timeline-view"
                        >
                          [ Timeline View ⏱ ]
                        </button>
                      </div>
                    )}

                    <div className="header-buttons">
                      {!isNoResult && (
                        <button
                          className="header-btn"
                          onClick={handleDownload}
                          aria-label="download-html"
                          disabled={downloading}
                        >
                          {downloading ? 'Exporting…' : 'Download Report'}
                        </button>
                      )}
                      <button
                        className="header-btn"
                        onClick={handleNewSearch}
                        aria-label="new-search"
                      >
                        Try another query
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conditional View: Terminal vs Timeline */}
                {viewMode === 'terminal' ? (
                  <pre className="terminal">
                    {terminalText}
                    <span className="cursor" />
                  </pre>
                ) : (
                  <BreachTimeline events={result?.analytics?.timeline || []} />
                )}

                {/* Pagination Controls */}
                {hasPagination && (
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn prev-btn"
                      onClick={handlePrevPage}
                      disabled={currentPage <= 0}
                      aria-label="previous-page"
                    >
                      ◀ Prev
                    </button>
                    <span className="page-indicator">
                      Page {Math.max(1, currentPage + 1)} of {effectiveTotal}
                    </span>
                    <button
                      className="pagination-btn next-btn"
                      onClick={handleNextPage}
                      disabled={currentPage + 1 >= effectiveTotal}
                      aria-label="next-page"
                    >
                      Next ▶
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {result && result.error && (
            <div className="packet" style={{ maxWidth: '600px', margin: 'auto' }}>
              <div className="error">{result.error}</div>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button className="neon-btn" onClick={handleNewSearch}>
                  ← Back to Search
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
