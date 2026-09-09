import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import UserMenu from './components/UserMenu';
import AIIntelligenceCards from './components/AIIntelligenceCards';
import { checkKAnonymity } from './lib/kAnonymity';
import './App.css';

const bgVideo1 = '/bg1.mp4';
const bgVideo2 = '/bg2.mp4';
const bgVideo3 = '/bg3.mp4';

// Prefer env var, fallback to local backend for dev
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
if (!process.env.REACT_APP_API_BASE) {
  // eslint-disable-next-line no-console
  console.warn('REACT_APP_API_BASE not set; defaulting to', API_BASE);
}

function App() {
  const location = useLocation?.() || { pathname: window?.location?.pathname || '' };
  const globalBgActive = (typeof window !== 'undefined') && Boolean(window.__GLOBAL_BG_ACTIVE);
  const shouldHideLocalBackground = globalBgActive && location.pathname !== '/search';
  const [query, setQuery] = useState('');
  const [osintType] = useState('MOBILE_OSINT');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [terminalText, setTerminalText] = useState('');
  
  // Search & OTP state
  const [searchType, setSearchType] = useState('Email');
  const [validationError, setValidationError] = useState('');
  const [isValidInput, setIsValidInput] = useState(false);
  const [showSearchingAnimation, setShowSearchingAnimation] = useState(false);
  
  // In-place OTP Verification state
  const [step, setStep] = useState('input'); // 'input' | 'otp' | 'results'
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins
  const [cooldown, setCooldown] = useState(30);   // 30s resend
  const [token, setToken] = useState(() => sessionStorage.getItem('osint_token') || '');
  
  // Pagination state
  const [breaches, setBreaches] = useState([]); // Array to store all fetched pages
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const [totalPages, setTotalPages] = useState(null);

  // k-Anonymity state
  const [kAnonResult, setKAnonResult] = useState(null);
  const [loadingPrevPage, setLoadingPrevPage] = useState(false);

  const typingRef = useRef(null);
  const bg2Ref = useRef(null);
  const bg1Ref = useRef(null);
  const bg3Ref = useRef(null);
  const [useBg2, setUseBg2] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [bg2Failed, setBg2Failed] = useState(false);
  const [useBg3, setUseBg3] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [bg3Failed, setBg3Failed] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showWaitHint, setShowWaitHint] = useState(false);
  // Derived UI state: hide certain UI while searching (bg3 phase)
  // eslint-disable-next-line no-unused-vars
  const isSearchingUI = Boolean((showSearchingAnimation || loading || useBg3) && !result);
  // keep track of a fallback timer that shows a safe result after 20s
  const fallbackTimerRef = useRef(null);
  // indicates an active search in progress so the fallback only triggers while searching
  const searchingRef = useRef(false);
  // timer for showing a wait hint if response is slow
  const waitHintTimerRef = useRef(null);
  // Track which texts have fully finished typing so we don't re-type on prev/next
  const typedKeysRef = useRef(new Set());
  // Track which page indices have been visited once; subsequent visits show instantly
  const visitedPagesRef = useRef(new Set());

  // Initialize validation on component mount
  useEffect(() => {
    setIsValidInput(false);
  }, []);

  // Helper: detect and normalize "no results" responses into a friendly message
  const normalizeResultData = (data) => {
    if (!data || typeof data !== 'object') return data;
    if (!Array.isArray(data.packets)) return data;

    const isNoResultText = (txt) =>
      typeof txt === 'string' && /no\s*results?(\s*found)?/i.test(txt);

    const safeMsg = '  Your data is safe — no results found.';
    const copy = { ...data, packets: data.packets.map(p => ({ ...(p || {}) })) };

    copy.packets = copy.packets.map((p) => {
      if (p && isNoResultText(p.info)) {
        return { ...p, info: safeMsg };
      }
      return p;
    });

    return copy;
  };

  // Validation functions
  const validateInput = (value, type) => {
    switch (type) {
      case 'Email':
        if (!value.includes('@') || value.indexOf('@') === 0 || value.indexOf('@') === value.length - 1) {
          return 'Type a correct email address';
        }
        const emailParts = value.split('@');
        if (emailParts.length !== 2 || !emailParts[1].includes('.')) {
          return 'Type a correct email address';
        }
        return '';
      case 'Mobile':
        if (value.length === 0) return 'Type a correct number';
        if (value.startsWith('+91')) {
          const phoneNumber = value.slice(3);
          if (phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
            return 'Type a correct number';
          }
          return '';
        }
        if (!/\d/.test(value)) return 'Type a correct number';
        return '';
      case 'Other':
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (value) => {
    setQuery(value);
    const error = validateInput(value, searchType);
    setValidationError(error);
    setIsValidInput(!error && value.trim() !== '');
  };

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    setValidationError('');
    if (type === 'Mobile') {
      setQuery('+91');
      setIsValidInput(false);
    } else {
      setQuery('');
      setIsValidInput(false);
    }
  };

  const stopTyping = () => {
    if (typingRef.current) {
      clearInterval(typingRef.current);
      typingRef.current = null;
    }
  };

  const startTyping = (fullText, onComplete) => {
    stopTyping();
    if (!fullText) return;
    setTerminalText('');
    const totalLen = fullText.length;
    const chunkSize = Math.max(12, Math.ceil(totalLen / 30));
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
  };

  // OTP Countdown Timers
  useEffect(() => {
    if (step !== 'otp' || timeLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    if (step !== 'otp' || cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, cooldown]);

  useEffect(() => {
    if (!result) return undefined;
    try {
      const text = (result.packets || [])
        .map(p => p.info || (`[ MOBILE: ${p.mobile || 'N/A'} ]\n[ NAME: ${p.name || 'N/A'} ]\n[ ADDRESS: ${p.address || 'N/A'} ]\n`))
        .filter(Boolean)
        .join('\n\n');
      if (visitedPagesRef.current.has(currentPage)) {
        stopTyping();
        setTerminalText(text || '');
        return undefined;
      }
      visitedPagesRef.current.add(currentPage);
      const startDelay = setTimeout(() => startTyping(text), 250);
      return () => { clearTimeout(startDelay); stopTyping(); };
    } catch (e) { /* ignore */ }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, currentPage]);

  useEffect(() => {
    return () => {
      stopTyping();
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (waitHintTimerRef.current) {
        clearTimeout(waitHintTimerRef.current);
        waitHintTimerRef.current = null;
      }
      searchingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (result) {
      setOverlayActive(true);
    } else {
      setOverlayActive(false);
    }
  }, [result]);

  const closeResults = () => {
    stopTyping();
    setResult(null);
    setTerminalText('');
    setShowSearch(true);
    setStep('input');
    setOtp('');
    setOtpError('');
    setQuery('');
    setIsValidInput(false);
    setLoading(false);
    setShowSearchingAnimation(false);
    setUseBg2(false);
    setBg2Failed(false);
    setUseBg3(false);
    setBg3Failed(false);
    searchingRef.current = false;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (waitHintTimerRef.current) {
      clearTimeout(waitHintTimerRef.current);
      waitHintTimerRef.current = null;
    }
    setShowWaitHint(false);
    setBreaches([]);
    setCurrentPage(0);
    setLoadingNextPage(false);
    setLoadingPrevPage(false);
    if (typedKeysRef.current) typedKeysRef.current.clear();
    if (visitedPagesRef.current) visitedPagesRef.current.clear();
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const authToken = sessionStorage.getItem('osint_token') || '';
      const res = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          query: email || 'Target Query',
          content: (terminalLines && terminalLines.length > 0 ? terminalLines.join('\n') : (summary || 'OSINT Breach Intelligence Scan complete.'))
        })
      });
      if (!res.ok) {
        const t = await res.text();
        setResult(prev => ({ ...prev, error: `Download failed: ${t || res.status}` }));
        return;
      }
      const cd = res.headers.get('Content-Disposition') || '';
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
      const filename = decodeURIComponent(match?.[1] || match?.[2] || 'result.html');
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
      setResult(prev => ({ ...prev, error: `Download error: ${e.message}` }));
    } finally { setDownloading(false); }
  };

  // Step 1: Send OTP to target
  const handleGenerateOtp = async (e) => {
    if (e) e.preventDefault();
    if (!query || !isValidInput || otpLoading) return;
    setOtpLoading(true);
    setOtpError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: query, target: query, type: searchType })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setOtpError(data.error || 'Failed to send verification code.');
      } else {
        setStep('otp');
        setTimeLeft(300);
        setCooldown(30);
        setOtp('');
      }
    } catch (err) {
      setOtpError('Failed to send verification code. Please check server connection.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 2: Verify OTP code and execute authorized search
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6 || otpLoading) return;
    setOtpLoading(true);
    setOtpError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: query, target: query, otp })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpError(data.error || 'Invalid or expired verification code.');
      } else {
        const authToken = data.token || '';
        if (authToken) {
          setToken(authToken);
          sessionStorage.setItem('osint_token', authToken);
        }
        setStep('results');
        handleSearch(authToken);
      }
    } catch (err) {
      setOtpError('Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3: Execute authorized search query
  const handleSearch = async (overrideToken) => {
    const currentToken = overrideToken || token || sessionStorage.getItem('osint_token') || '';
    setLoading(true);
    setResult(null);
    setKAnonResult(null);
    setShowSearchingAnimation(true);
    setUseBg3(true);

    // Run k-anonymity check in parallel with main search
    const kAnonPromise = checkKAnonymity(query).catch(() => null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
      };

      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ query, osintType, searchType, token: currentToken })
      });

      const data = await res.json();

      if (!res.ok || (data && !data.success)) {
        if (res.status === 403) {
          setStep('input');
          setOtpError('Email verification required. Please generate a code.');
          setShowSearchingAnimation(false);
          setLoading(false);
          return;
        }
        throw new Error(data?.error || `Server error: ${res.status}`);
      }

      const resultDataRaw = data && data.data ? data.data : { packets: [{}, { info: 'Try another query.' }] };
      const resultData = normalizeResultData(resultDataRaw);
      if (data && data.data && data.data.pagination) {
        // eslint-disable-next-line no-unused-vars
        const { current, total } = data.data.pagination;
        if (total && total > 1) setTotalPages(total);
        else setTotalPages(null);
      } else { setTotalPages(null); }

      searchingRef.current = false;
      if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
      if (waitHintTimerRef.current) { clearTimeout(waitHintTimerRef.current); waitHintTimerRef.current = null; }
      setShowWaitHint(false);

      setBreaches([resultData]);
      setCurrentPage(0);
      setResult(resultData);
      setKAnonResult(await kAnonPromise);
      setShowSearchingAnimation(false);
      setUseBg3(false);
      setUseBg2(true);
      try { if (bg2Ref.current) { bg2Ref.current.currentTime = 0; bg2Ref.current.play().catch(()=>{}); } } catch(e){}
      prefetchNextPages(1, currentToken);
    } catch (err) {
      searchingRef.current = false;
      if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
      if (waitHintTimerRef.current) { clearTimeout(waitHintTimerRef.current); waitHintTimerRef.current = null; }
      setShowWaitHint(false);

      let errorMessage = '❌ Server is down, please try after sometime.';
      try {
        const sanitized = await (async () => {
          const m = err && err.message ? String(err.message) : '';
          if (/^\s*</.test(m) || m.toLowerCase().includes('unexpected token') || m.toLowerCase().includes('<!doctype')) {
            return 'Server returned an unexpected response (HTML). Please try again later.';
          }
          return m || errorMessage;
        })();
        if (sanitized) errorMessage = sanitized;
      } catch (e) { /* ignore */ }

      const errorResult = { error: errorMessage };
      setBreaches([errorResult]);
      setCurrentPage(0);
      setResult(errorResult);
      setShowSearchingAnimation(false);
      setUseBg3(true);
    }

    setLoading(false);
  };

  const prefetchNextPages = async (startIndex = 1, currentToken) => {
    const seen = new Set();
    const tokenToUse = currentToken || token || sessionStorage.getItem('osint_token') || '';

    for (let pageIdx = startIndex; pageIdx < 10; pageIdx += 1) {
      try {
        const res = await fetch(`${API_BASE}/api/telegram-page`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(tokenToUse ? { 'Authorization': `Bearer ${tokenToUse}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify({ query, searchType, osintType })
        });

        const data = await res.json();
        if (!res.ok || !data || !data.data) break;

        const pageDataRaw = data.data;
        const pageData = normalizeResultData(pageDataRaw);
        if (data && data.data && data.data.pagination && data.data.pagination.total > 1) {
          setTotalPages(data.data.pagination.total);
        } else if (data && data.data && data.data.pagination && data.data.pagination.total <= 1) {
          setTotalPages(null);
        }

        if (!pageData || (pageData.packets && pageData.packets.length === 0)) break;

        const key = JSON.stringify(pageData);
        if (seen.has(key)) break;
        seen.add(key);

        setBreaches(prev => [...prev, pageData]);
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        break;
      }
    }
  };

  const handleNextPage = async () => {
    if (loadingNextPage) return;
    const nextIndex = currentPage + 1;
    if (breaches && breaches[nextIndex]) {
      setCurrentPage(nextIndex);
      setResult(breaches[nextIndex]);
      return;
    }

    setLoadingNextPage(true);
    try {
      const currentToken = token || sessionStorage.getItem('osint_token') || '';
      const res = await fetch(`${API_BASE}/api/telegram-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ query, searchType, osintType })
      });

      const data = await res.json();
      if (!res.ok || !data || !data.data) {
        setResult(prev => ({ ...prev, error: 'No more pages available.' }));
        setLoadingNextPage(false);
        return;
      }

      const nextPageDataRaw = data.data;
      const nextPageData = normalizeResultData(nextPageDataRaw);
      if (data && data.data && data.data.pagination && data.data.pagination.total > 1) {
        setTotalPages(data.data.pagination.total);
      } else if (data && data.data && data.data.pagination && data.data.pagination.total <= 1) {
        setTotalPages(null);
      }

      setBreaches(prev => {
        const isDup = prev.some(p => JSON.stringify(p) === JSON.stringify(nextPageData));
        if (isDup) {
          setResult(prevRes => ({ ...prevRes, error: 'No more pages available.' }));
          return prev;
        }
        const updated = [...prev, nextPageData];
        setCurrentPage(updated.length - 1);
        setResult(nextPageData);
        return updated;
      });
    } catch (err) {
      setResult({ error: `❌ Failed to fetch next page: ${err.message}` });
    }
    setLoadingNextPage(false);
  };

  const handlePrevPage = async () => {
    if (loadingPrevPage) return;
    if (currentPage > 0) {
      const prevPageIndex = currentPage - 1;
      setCurrentPage(prevPageIndex);
      setResult(breaches[prevPageIndex]);
      return;
    }

    setLoadingPrevPage(true);
    try {
      const currentToken = token || sessionStorage.getItem('osint_token') || '';
      const res = await fetch(`${API_BASE}/api/telegram-prev-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
        },
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data || !data.data) {
        setResult(prev => ({ ...prev, error: 'No previous pages available.' }));
        setLoadingPrevPage(false);
        return;
      }

      const prevPageDataRaw = data.data;
      const prevPageData = normalizeResultData(prevPageDataRaw);
      if (data && data.data && data.data.pagination && data.data.pagination.total > 1) {
        setTotalPages(data.data.pagination.total);
      } else if (data && data.data && data.data.pagination && data.data.pagination.total <= 1) {
        setTotalPages(null);
      }

      const newBreaches = [prevPageData, ...breaches];
      setBreaches(newBreaches);
      setCurrentPage(0);
      setResult(prevPageData);
    } catch (err) {
      setResult({ error: `❌ Failed to fetch previous page: ${err.message}` });
    }
    setLoadingPrevPage(false);
  };

  return (
    <div className="dashboard">
      {!isSearchingUI && <UserMenu />}

      {!shouldHideLocalBackground && (
        <video
          ref={bg1Ref}
          className={`bg-video ${useBg2 && bg2Failed ? 'bg-fallback-zoom' : ''}`}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        >
          <source src={bgVideo1} type="video/mp4" />
        </video>
      )}

      {!shouldHideLocalBackground && (
        <video
          ref={bg3Ref}
          className={`bg-video bg3 ${useBg3 ? 'visible zoom' : ''}`}
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          aria-hidden
        >
          <source src={bgVideo3} type="video/mp4" />
        </video>
      )}

      {!shouldHideLocalBackground && (
        <video
          ref={bg2Ref}
          className={`bg-video bg2 ${useBg2 ? 'visible zoom' : ''}`}
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          aria-hidden
        >
          <source src={bgVideo2} type="video/mp4" />
        </video>
      )}

      <div className={`video-overlay ${overlayActive ? 'active' : ''}`} aria-hidden="true" />

      {showSearch && !loading && !result && (
        <div className="hero" aria-hidden="false">
          <h1 className="hero-title">OSINT SEARCH</h1>
          <div className="hero-credit">Developed by <strong>PhishBreach Guardians</strong></div>
        </div>
      )}

      {showSearch && !loading && !result && step === 'input' && (
        <div className="search-card" role="search">
          <form onSubmit={handleGenerateOtp} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className={`search-row centered ${loading ? 'search-anim' : ''}`}>
              <select 
                className="search-type-select"
                value={searchType}
                onChange={e => handleSearchTypeChange(e.target.value)}
                disabled={loading || otpLoading}
                aria-label="search-type-select"
              >
                <option value="Email">Email</option>
                <option value="Mobile">Mobile</option>
                <option value="Other">Other</option>
              </select>
              <input
                className="search-input"
                type="text"
                placeholder={searchType === 'Email' ? "Enter email (e.g. test@example.com)" :
                  searchType === 'Mobile' ? "Enter mobile (e.g. +919876543210)" :
                  "Enter any query (e.g. name, account)"}
                value={query}
                onChange={e => handleInputChange(e.target.value)}
                onFocus={() => setOverlayActive(true)}
                onBlur={() => setOverlayActive(false)}
                aria-label="search-input"
                disabled={loading || otpLoading}
                autoFocus
              />
              <button 
                type="submit"
                className="search-btn" 
                disabled={loading || otpLoading || !isValidInput} 
                aria-label="generate-otp-button"
              >
                {otpLoading ? '[ SENDING… ]' : '[ GENERATE OTP ⚡ ]'}
              </button>
            </div>
          </form>
          {validationError && (
            <div className="validation-error">{validationError}</div>
          )}
          {otpError && (
            <div className="validation-error">{otpError}</div>
          )}
          <div className="inline-disclaimer" role="note">
            🔒 Disclaimer: Prototype link is for evaluation purpose only. Please do not share, project is under active development.
          </div>
        </div>
      )}

      {showSearch && !loading && !result && step === 'otp' && (
        <div className="search-card" role="region" aria-label="otp-verification">
          <div className="otp-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, color: '#00eaff', fontFamily: 'Orbitron, monospace', fontSize: '0.85rem', width: '100%' }}>
            <span>VERIFICATION CODE SENT TO: <strong style={{ color: '#fff' }}>{query}</strong></span>
            <span style={{ color: timeLeft <= 60 ? '#ff3366' : '#00eaff' }}>⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>

          <form onSubmit={handleVerifyOtp} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="search-row centered">
              <input
                className="search-input"
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                aria-label="otp-input"
                autoFocus
                style={{ letterSpacing: '6px', fontSize: '1.25rem', textAlign: 'center' }}
              />
              <button 
                type="submit"
                className="search-btn" 
                disabled={otpLoading || otp.length !== 6 || timeLeft <= 0} 
                aria-label="verify-otp-button"
              >
                {otpLoading ? '[ SCANNING… ]' : '[ VERIFY & SCAN 🔍 ]'}
              </button>
            </div>
          </form>

          {otpError && (
            <div className="validation-error">{otpError}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: '0.85rem', width: '100%' }}>
            <button
              type="button"
              onClick={handleGenerateOtp}
              disabled={cooldown > 0 || otpLoading}
              style={{ background: 'transparent', border: 'none', color: cooldown > 0 ? '#666' : '#00eaff', cursor: cooldown > 0 ? 'not-allowed' : 'pointer', textDecoration: 'underline' }}
            >
              {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Code'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('input'); setOtp(''); setOtpError(''); }}
              style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer' }}
            >
              ← Change Target
            </button>
          </div>
        </div>
      )}

      {showSearchingAnimation && (
        <div className="searching-animation">
          <div className="searching-text">Searching<span className="dots"></span></div>
          {showWaitHint && (
            <div className="searching-hint">wait for few seconds…</div>
          )}
        </div>
      )}

      {!showSearchingAnimation && (
        <div className="results results-redesigned">
          {result && result.packets && (() => {
            const preferredPacket = (result.packets[1] !== undefined) ? result.packets[1] : result.packets[0];
            const infoText = preferredPacket && typeof preferredPacket.info === 'string' ? preferredPacket.info : '';
            const isNoResult = /no\s*results?(\s*found)?/i.test(infoText || '');
            const effectiveTotal = (typeof totalPages === 'number' && totalPages > 0)
              ? totalPages
              : (result && result.pagination && typeof result.pagination.total === 'number')
                ? result.pagination.total
                : (breaches && breaches.length ? breaches.length : 1);
            
            const hasPagination = Number(effectiveTotal) > 1 && 
                                 (result && result.pagination && result.pagination.total > 1);
            const analytics = result.analytics || {};
            const exposure = analytics.exposure || { score: 0, riskLevel: 'LOW', riskColor: '#00ff66', breakdown: [], entities: {} };
            const records = result.records || [];
            const auditData = result.blockchainAudit || null;

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
                case 'CRITICAL': return '\u{1F6A8}';
                case 'HIGH': return '\u26A0\uFE0F';
                case 'MEDIUM': return '\u26A1';
                default: return '\u{1F6E1}\uFE0F';
              }
            };

            return (
              <div className="packet-redesigned" key={0}>
                {/* Header Bar */}
                <div className="results-header-bar">
                  <h2 className="results-title">INTELLIGENCE REPORT</h2>
                  <div className="header-buttons">
                    {!isNoResult && (
                      <button className="header-btn" onClick={handleDownload} aria-label="download-html" disabled={downloading}>
                        {downloading ? 'Downloading...' : 'Download'}
                      </button>
                    )}
                    <button className="header-btn" onClick={closeResults} aria-label="new-search">Try another query</button>
                  </div>
                </div>

                {/* k-Anonymity Privacy Badge */}
                {kAnonResult && (
                  <div className={`k-anon-badge ${kAnonResult.isPwned ? 'pwned' : 'safe'}`}>
                    <div className="k-anon-icon">{kAnonResult.isPwned ? '\u{1F534}' : '\u{1F7E2}'}</div>
                    <div className="k-anon-info">
                      <div className="k-anon-title">
                        k-Anonymity Check: {kAnonResult.isPwned ? 'BREACH DETECTED' : 'CLEAN'}
                      </div>
                      <div className="k-anon-details">
                        Hash: <code>{kAnonResult.prefix}...{kAnonResult.suffix.slice(0, 8)}</code>
                        {kAnonResult.isPwned && (
                          <span> | Exposures: {kAnonResult.exposureCount} | Sources: {kAnonResult.sources.join(', ')}</span>
                        )}
                      </div>
                      <div className="k-anon-privacy">
                        Your raw email never left this browser — only the SHA-256 prefix was queried.
                      </div>
                    </div>
                  </div>
                )}

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
                      {exposure.riskLevel} RISK
                    </div>
                    <div className="risk-subtitle">Threat Assessment for <strong>{query || 'target'}</strong></div>
                    <div className="entity-chips">
                      {exposure.entities?.hasDocument && (
                        <span className="entity-chip alert-chip">National ID Exposed</span>
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
                      <span className="section-icon">{'\u{1F50D}'}</span>
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

                {/* AI Intelligence Cards */}
                {(result.analytics || auditData) && (
                  <AIIntelligenceCards analytics={result.analytics} blockchainAudit={auditData} token={token} />
                )}

                {/* Breach Records */}
                {records.length > 0 && (
                  <div className="breach-records-section">
                    <h3 className="section-title">
                      <span className="section-icon">{'\u{1F4BE}'}</span>
                      Breach Records ({records.length})
                    </h3>
                    <div className="breach-cards-grid">
                      {records.map((rec) => (
                        <div key={rec.id || rec.title || `breach-${records.indexOf(rec)}`} className="breach-card">
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
                  </div>
                )}

                {/* Raw Terminal */}
                <div className="terminal-section">
                  <div className="terminal-header">
                    <div className="terminal-dots">
                      <span className="dot red"></span>
                      <span className="dot yellow"></span>
                      <span className="dot green"></span>
                    </div>
                    <span className="terminal-title">breach_intel@osint ~ $</span>
                    <button className="copy-btn" onClick={() => {
                      const text = result.packets.map(p => p.info || '').join('\n\n');
                      navigator.clipboard?.writeText(text);
                    }}>
                      {'\u{1F4CB}'} Copy
                    </button>
                  </div>
                  <div className="terminal-body">
                    <pre className="terminal-output">{infoText || 'No breach details available.'}</pre>
                  </div>
                </div>

                {/* Pagination */}
                {hasPagination && (
                  <div className="pagination-controls">
                    <button 
                      className="pagination-btn prev-btn"
                      onClick={handlePrevPage}
                      disabled={loadingPrevPage}
                      aria-label="previous-page"
                    >
                      {loadingPrevPage ? 'Loading...' : '\u25C0 Prev'}
                    </button>
                    <span className="page-indicator">
                      Page {Math.max(1, currentPage + 1)} of {effectiveTotal}
                    </span>
                    <button 
                      className="pagination-btn next-btn"
                      onClick={handleNextPage}
                      disabled={loadingNextPage || (typeof effectiveTotal === 'number' && (currentPage + 1) >= effectiveTotal)}
                      aria-label="next-page"
                    >
                      {loadingNextPage ? 'Loading...' : 'Next \u25B6'}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
          {result && result.error && <div className="error">{result.error}</div>}
        </div>
      )}
    </div>
  );
}

export default App;
