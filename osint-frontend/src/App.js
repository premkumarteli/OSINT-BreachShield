
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './App.css';
import bgVideo1 from './bg1.mp4';
import bgVideo2 from './bg2.mp4';
import bgVideo3 from './bg3.mp4';
import UserMenu from './components/UserMenu';
import DarkWebTicker from './components/DarkWebTicker';
import BreachTimeline from './components/BreachTimeline';

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
  const [terminalText, setTerminalText] = useState('');
  
  // New states for dropdown and validation
  const [searchType, setSearchType] = useState('Email');
  const [validationError, setValidationError] = useState('');
  const [isValidInput, setIsValidInput] = useState(false);
  const [showSearchingAnimation, setShowSearchingAnimation] = useState(false);
  // OTP removed: no OTP flow required for Email
  
  // Pagination state
  const [breaches, setBreaches] = useState([]); // Array to store all fetched pages
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const [loadingPrevPage, setLoadingPrevPage] = useState(false);
  const [totalPages, setTotalPages] = useState(null);

  const typingRef = useRef(null);
  const bg2Ref = useRef(null);
  const bg1Ref = useRef(null);
  const bg3Ref = useRef(null);
  const [useBg2, setUseBg2] = useState(false);
  const [bg2Failed, setBg2Failed] = useState(false);
  const [useBg3, setUseBg3] = useState(false);
  const [bg3Failed, setBg3Failed] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showWaitHint, setShowWaitHint] = useState(false);
  // Derived UI state: hide certain UI while searching (bg3 phase)
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
    setIsValidInput(false); // Start with invalid state until user inputs valid data
  }, []);

  // Helper: detect and normalize "no results" responses into a friendly message
  const normalizeResultData = (data) => {
    if (!data || typeof data !== 'object') return data;
    if (!Array.isArray(data.packets)) return data;

    const isNoResultText = (txt) =>
      typeof txt === 'string' && /no\s*results?(\s*found)?/i.test(txt);

    const safeMsg = '  Your data is safe — no results found.';

    // Create a shallow copy to avoid mutating original
    const copy = { ...data, packets: data.packets.map(p => ({ ...(p || {}) })) };

    // If any packet advertises no results, override its info with safe message
    copy.packets = copy.packets.map((p) => {
      if (p && isNoResultText(p.info)) {
        return { ...p, info: safeMsg };
      }
      return p;
    });

    return copy;
  };

  // Sanitize server/fetch errors so HTML responses or raw parse errors don't show raw HTML or 'Unexpected token' messages
  const sanitizeError = async (err, res) => {
    try {
      if (res && typeof res.text === 'function') {
        const ct = res.headers.get('content-type') || '';
        if (!/application\/json/i.test(ct)) {
          const txt = await res.text();
          if (/^\s*<(!doctype|html)/i.test(txt)) return 'Server returned an HTML error. Please try again later.';
          return txt.length > 240 ? txt.slice(0, 240) + '...' : txt || 'Unexpected server response';
        }
      }
    } catch (e) {
      // ignore
    }
    const m = err && err.message ? String(err.message) : '';
    if (/^\s*</.test(m) || m.toLowerCase().includes('<!doctype') || m.toLowerCase().includes('unexpected token')) {
      return 'Server returned an unexpected response. Try again later.';
    }
    return m || 'An unknown error occurred.';
  };

  // Validation functions
  const validateInput = (value, type) => {
    switch (type) {
      case 'Email':
        if (!value.includes('@') || value.indexOf('@') === 0 || value.indexOf('@') === value.length - 1) {
          return 'Type a correct email address';
        }
        // Basic email format check
        const emailParts = value.split('@');
        if (emailParts.length !== 2 || !emailParts[1].includes('.')) {
          return 'Type a correct email address';
        }
        return '';
      case 'Mobile':
        // Allow various mobile number formats
        if (value.length === 0) {
          return 'Type a correct number';
        }
        
        // If it starts with +91, validate Indian format
        if (value.startsWith('+91')) {
          const phoneNumber = value.slice(3);
          if (phoneNumber.length === 0) {
            return 'Type a correct number';
          }
          if (!/^\d+$/.test(phoneNumber)) {
            return 'Type a correct number';
          }
          if (phoneNumber.length < 10 || phoneNumber.length > 10) {
            return 'Type a correct number';
          }
          return '';
        }
        
        // For other formats, just check if it contains numbers
        if (!/\d/.test(value)) {
          return 'Type a correct number';
        }
        
        return '';
      case 'Other':
        return ''; // No validation for Other
      default:
        return '';
    }
  };

  const handleInputChange = (value) => {
    // Allow users to modify the input freely
    setQuery(value);
    
    // Validate input
    const error = validateInput(value, searchType);
    setValidationError(error);
    setIsValidInput(!error && value.trim() !== '');

    // No OTP state to reset
  };

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    setValidationError('');
  // No OTP to reset
    
    // Set appropriate default value based on type
    if (type === 'Mobile') {
      // Pre-fill with +91 as a suggestion, but users can change it
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
    const chars = Array.from(fullText);
    setTerminalText('');
    let i = 0;
    typingRef.current = setInterval(() => {
      setTerminalText(prev => prev + (chars[i] || ''));
      i += 1;
      if (i >= chars.length) {
        stopTyping();
        if (typeof onComplete === 'function') onComplete();
      }
    }, 8); // slightly faster typing
  };

  useEffect(() => {
    if (!result) return undefined;
    try {
      // Prefer packets[1] (existing UI contract) but fall back to packets[0]
      const packet = result.packets && (result.packets[1] !== undefined ? result.packets[1] : result.packets[0]);
      const text = packet
        ? (packet.info || (`[ MOBILE: ${packet.mobile || 'N/A'} ]\n[ NAME: ${packet.name || 'N/A'} ]\n[ ADDRESS: ${packet.address || 'N/A'} ]\n`))
        : '';
      // If this page index was visited before, show instantly and skip typing
      if (visitedPagesRef.current.has(currentPage)) {
        stopTyping();
        setTerminalText(text || '');
        return undefined;
      }
      // First visit to this page: type once, and mark as visited immediately
      visitedPagesRef.current.add(currentPage);
      const startDelay = setTimeout(() => startTyping(text), 350);
      return () => { clearTimeout(startDelay); stopTyping(); };
    } catch (e) { /* ignore */ }
    return undefined;
  }, [result, currentPage]); // Trigger when result or page index changes

  // cleanup timers on unmount
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

  // when results are shown, activate overlay to blur/dim the background
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
    setLoading(false); // Reset loading state
    setShowSearchingAnimation(false); // Hide searching animation
    setUseBg2(false);
    setBg2Failed(false);
    setUseBg3(false); // Hide the searching video
    setBg3Failed(false);
    // clear any pending fallback timer
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
    // Reset pagination state
    setBreaches([]);
    setCurrentPage(0);
    setLoadingNextPage(false);
    setLoadingPrevPage(false);
    // Clear typed cache when closing results
    if (typedKeysRef.current) typedKeysRef.current.clear();
    if (visitedPagesRef.current) visitedPagesRef.current.clear();
  };

  // View mode switcher: 'terminal' or 'timeline'
  const [viewMode, setViewMode] = useState('terminal');

  // Trigger backend to click 'Download' and stream file back
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const preferredPacket = (result?.packets && result.packets[1] !== undefined) ? result.packets[1] : result?.packets?.[0];
      const content = terminalText || preferredPacket?.info || JSON.stringify(result || {});
      const res = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, content })
      });
      if (!res.ok) {
        const t = await res.text();
        setResult(prev => ({ ...prev, error: `❌ Download failed: ${t || res.status}` }));
        return;
      }
      // Derive filename from Content-Disposition header if available
      const cd = res.headers.get('Content-Disposition') || '';
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
      const filename = decodeURIComponent(match?.[1] || match?.[2] || 'breach_report.html');
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
      setResult(prev => ({ ...prev, error: `❌ Download error: ${e.message}` }));
    } finally { setDownloading(false); }
  };

  // No OTP auto-verify

  const handleSearch = async () => {
    // Check validation before proceeding
    if (!isValidInput) {
      return;
    }
    // No OTP gating for Email
    // New search: clear any previously typed cache
    if (typedKeysRef.current) typedKeysRef.current.clear();
    if (visitedPagesRef.current) visitedPagesRef.current.clear();
    
    setLoading(true);
  setShowSearchingAnimation(true);
  setShowWaitHint(false);
    // During search phase, show bg3 with a zoom animation; hide bg2 until results arrive
    setUseBg2(false);
    setBg2Failed(false);
    setUseBg3(true);
    setBg3Failed(false);
    // Keep the search bar visible during search
    // mark that a search is in progress but remove the fallback timer
    searchingRef.current = true;
    if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
    // Remove the 20-second fallback timer completely
    // Start a 10s timer to show a wait hint if still searching
    if (waitHintTimerRef.current) { clearTimeout(waitHintTimerRef.current); waitHintTimerRef.current = null; }
    waitHintTimerRef.current = setTimeout(() => {
      if (searchingRef.current) setShowWaitHint(true);
    }, 10000);
    
    // Start the searching background video with zoom
    if (bg3Ref.current) {
      try {
        bg3Ref.current.currentTime = 0;
        bg3Ref.current.muted = true;
        bg3Ref.current.play().then(() => setBg3Failed(false)).catch((e) => { console.warn('bg3 play failed', e); setBg3Failed(true); });
      } catch (e) { console.warn('bg3 play error', e); setBg3Failed(true); }
    }

    // Ensure primary background keeps playing (defensive) so the page doesn't appear frozen
    if (bg1Ref.current && typeof bg1Ref.current.play === 'function') {
      try { bg1Ref.current.play().catch(()=>{}); } catch(e){}
    }

    // Small helper: retry transient failures (network/5xx) a few times before giving up
    const requestWithRetry = async (url, options, retries = 2, backoffMs = 1200) => {
      let lastErr;
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
          const r = await fetch(url, options);
          // if 5xx, treat as retryable
          if (r.status >= 500) throw new Error(`HTTP ${r.status}`);
          return r;
        } catch (e) {
          lastErr = e;
          if (attempt < retries) {
            await new Promise(res => setTimeout(res, backoffMs * (attempt + 1)));
            continue;
          }
          throw lastErr;
        }
      }
    };

    try {
  const headers = { 'Content-Type': 'application/json' };
      const res = await requestWithRetry(`${API_BASE}/api/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, osintType, searchType })
      }, 2, 1000);

      const data = await res.json();
      
      // Check if the response indicates a server error or failure
      if (!res.ok || (data && !data.success)) {
        throw new Error(data?.error || `Server error: ${res.status} ${res.statusText}`);
      }
      
      const resultDataRaw = data && data.data ? data.data : { packets: [{}, { info: 'Try another query.' }] };
      const resultData = normalizeResultData(resultDataRaw);
      if (data && data.data && data.data.pagination) {
        const { current, total } = data.data.pagination;
        if (total && total > 1) setTotalPages(total);
        else setTotalPages(null);
      } else { setTotalPages(null); }
  // clear fallback timer since we have a real result
      searchingRef.current = false;
      if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
  if (waitHintTimerRef.current) { clearTimeout(waitHintTimerRef.current); waitHintTimerRef.current = null; }
  setShowWaitHint(false);
      
  // Store first page in breaches array and set current result
      setBreaches([resultData]);
      setCurrentPage(0);
      setResult(resultData);
  // No OTP state to clear
      // Keep search interface visible and hide searching animation
      setShowSearchingAnimation(false);
      // Switch from searching background (bg3) to results background (bg2)
      setUseBg3(false);
      setUseBg2(true);
      try { if (bg2Ref.current) { bg2Ref.current.currentTime = 0; bg2Ref.current.play().catch(()=>{}); } } catch(e){}
  // Start background prefetch for next pages (non-blocking)
  prefetchNextPages(1);
    } catch (err) {
      // clear fallback timer on error as well
      searchingRef.current = false;
      if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
      if (waitHintTimerRef.current) { clearTimeout(waitHintTimerRef.current); waitHintTimerRef.current = null; }
      setShowWaitHint(false);

      // Friendly message: if the error looks like HTML or JSON-parse, replace with safe text
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
      // Keep searching video onscreen to avoid abrupt UX; don't flip to bg2 on transient failures
      setShowSearchingAnimation(false);
      setUseBg3(true);
    }

    setLoading(false);
  };

  // Background prefetch: sequentially request /api/telegram-page and cache pages
  const prefetchNextPages = async (startIndex = 1) => {
    // Don't prefetch if already fetching
    const MAX_PREFETCH = 10; // safety cap to avoid runaway requests
    let pageCount = startIndex;
    // Track seen pages to prevent duplicates and loops
    const seen = new Set((breaches || []).map(b => JSON.stringify(b)));

    for (; pageCount <= MAX_PREFETCH; pageCount += 1) {
      try {
        const res = await fetch(`${API_BASE}/api/telegram-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });


        if (!res.ok) {
          // Stop prefetching if backend indicates no more pages
          console.debug('Prefetch stopped: non-ok response', res.status);
          break;
        }

        const data = await res.json();
        const pageDataRaw = data && data.data ? data.data : null;
        const pageData = pageDataRaw ? normalizeResultData(pageDataRaw) : null;
        if (data && data.data && data.data.pagination && data.data.pagination.total > 1) {
          setTotalPages(data.data.pagination.total);
        } else if (data && data.data && data.data.pagination && data.data.pagination.total <= 1) {
          setTotalPages(null);
        }

        // If response has no useful data, stop prefetching
        if (!pageData || (pageData.packets && pageData.packets.length === 0)) {
          console.debug('Prefetch stopped: empty pageData');
          break;
        }

        // Avoid duplicates: if already seen anywhere, stop prefetching
        const key = JSON.stringify(pageData);
        if (seen.has(key)) {
          console.debug('Prefetch stopped: duplicate page encountered');
          break;
        }
        seen.add(key);
        // Append to breaches using state updater to avoid stale closure
        setBreaches(prev => [...prev, pageData]);

        // small delay to avoid hammering the backend
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.debug('Prefetch stopped due to error', err);
        break;
      }
    }
  };

  // Handle next page pagination
  const handleNextPage = async () => {
    if (loadingNextPage) return;

    // If we already have a cached next page, use it
    const nextIndex = currentPage + 1;
    if (breaches && breaches[nextIndex]) {
      setCurrentPage(nextIndex);
      setResult(breaches[nextIndex]);
      return;
    }

    setLoadingNextPage(true);
    try {
      console.log('Requesting next page from backend (cache miss)...');
      const res = await fetch(`${API_BASE}/api/telegram-page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });


      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${data.error || 'Unknown error'}`);
      }

      // If backend returns null data (no more pages), don't append duplicates
      if (!data || !data.data) {
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

      // Stop if duplicate of any previous page
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
      console.error('Next page error:', err);
      const errorResult = { error: `❌ Failed to fetch next page: ${err.message}` };
      setResult(errorResult);
    }

    setLoadingNextPage(false);
  };

  // Handle previous page navigation - use local cache if available, otherwise call API
  const handlePrevPage = async () => {
    if (loadingPrevPage) return;
    
    // If we have a cached previous page, use it
    if (currentPage > 0) {
      const prevPageIndex = currentPage - 1;
      setCurrentPage(prevPageIndex);
      setResult(breaches[prevPageIndex]);
      return;
    }
    
    // Otherwise, try calling the API for previous page
    setLoadingPrevPage(true);
    try {
      const res = await fetch(`${API_BASE}/api/telegram-prev-page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${data.error || 'Unknown error'}`);
  }

  // If backend returns null data (no previous pages), don't prepend duplicates
  if (!data || !data.data) {
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
      
      // Insert at the beginning of breaches array and adjust indices
      const newBreaches = [prevPageData, ...breaches];
      setBreaches(newBreaches);
      setCurrentPage(0); // We're now at the first (newly added) page
      setResult(prevPageData);
    } catch (err) {
      console.error('Previous page error:', err);
      const errorResult = { error: `❌ Failed to fetch previous page: ${err.message}` };
      setResult(errorResult);
    }
    
    setLoadingPrevPage(false);
  };

  return (
    <div className="dashboard">
      {/* User menu with avatar + dropdown (top-right); hidden while searching */}
      {!isSearchingUI && <UserMenu />}
  {!shouldHideLocalBackground && (
      <video
        ref={bg1Ref}
        className={`bg-video ${useBg2 && bg2Failed ? 'bg-fallback-zoom' : ''}`}
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={() => console.debug('bg video: canplay')}
        aria-hidden
      >
        <source src={bgVideo1} type="video/mp4" />
      </video>
      )}

      {/* Searching background (bg3) - zoom animation while waiting for response */}
  {!shouldHideLocalBackground && (
      <video
        ref={bg3Ref}
        className={`bg-video bg3 ${useBg3 ? 'visible zoom' : ''}`}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        onCanPlay={() => { try { bg3Ref.current.play().catch(()=>{}); } catch(e){} }}
        onEnded={() => { try { if (bg3Ref.current) { bg3Ref.current.currentTime = 0; bg3Ref.current.play().catch(()=>{}); } } catch(e){} }}
        onPause={() => { try { if (bg3Ref.current && !bg3Ref.current.ended) { bg3Ref.current.play().catch(()=>{}); } } catch(e){} }}
        onError={(e) => { console.error('bg3 error', e); setBg3Failed(true); }}
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
        onCanPlay={() => { try { bg2Ref.current.play().catch(()=>{}); } catch(e){} }}
        onEnded={() => {
          // defensive restart for browsers that stop autoplay after a short time
          try { if (bg2Ref.current) { bg2Ref.current.currentTime = 0; bg2Ref.current.play().catch(()=>{}); } } catch(e){}
        }}
        onPause={() => {
          try { if (bg2Ref.current && !bg2Ref.current.ended) { bg2Ref.current.play().catch(()=>{}); } } catch(e){}
        }}
        onError={(e) => { console.error('bg2 error', e); setBg2Failed(true); }}
        aria-hidden
      >
        <source src={bgVideo2} type="video/mp4" />
      </video>
      )}

      <div className={`video-overlay ${overlayActive ? 'active' : ''}`} aria-hidden="true"></div>

      {showSearch && !loading && !result && (
        <div className="hero" aria-hidden="false">
          <h1 className="hero-title">OSINT SEARCH</h1>
          <div className="hero-credit">Developed by <strong>PhishBreach Guardians</strong></div>
        </div>
      )}

      {showSearch && !loading && !result && (
        <div className="search-card" role="search">
          <div className={`search-row centered ${loading ? 'search-anim' : ''}`}>
            <select 
              className="search-type-select"
              value={searchType}
              onChange={e => handleSearchTypeChange(e.target.value)}
              disabled={loading}
              aria-label="search-type-select"
            >
              <option value="Email">Email</option>
              <option value="Mobile">Mobile</option>
              <option value="Other">Other</option>
            </select>
            {
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
                aria-busy={loading}
                disabled={loading}
              />
            }
              <button 
                className="search-btn" 
                onClick={handleSearch} 
                disabled={loading || !isValidInput} 
                aria-label="search-button"
              >
                [ SEARCH 🔍 ]
              </button>
          </div>
          {validationError && (
            <div className="validation-error">{validationError}</div>
          )}
          <div className="inline-disclaimer" role="note">
            🔒 Disclaimer: Prototype link is for evaluation purpose only. Please do not share, project is under active development.
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
        <div className="results">
        {result && result.packets && (() => {
          // Defensive: backend sometimes returns only packets[0]. Prefer packets[1] if present,
          // otherwise fall back to packets[0]. Build a single-element array so rendering stays simple.
          const preferredPacket = (result.packets[1] !== undefined) ? result.packets[1] : result.packets[0];
          // Detect no-results scenario to hide Download button
          const infoText = preferredPacket && typeof preferredPacket.info === 'string' ? preferredPacket.info : '';
          const isNoResult = /no\s*results?(\s*found)?/i.test(infoText || '');
          // Determine if pagination should be shown: only when total pages > 1
          const effectiveTotal = (typeof totalPages === 'number' && totalPages > 0)
            ? totalPages
            : (result && result.pagination && typeof result.pagination.total === 'number')
              ? result.pagination.total
              : (breaches && breaches.length ? breaches.length : 1);
          
          // Only show pagination if we have more than 1 page AND the backend actually supports pagination
          const hasPagination = Number(effectiveTotal) > 1 && 
                               (result && result.pagination && result.pagination.total > 1);
          return (
            <div className="packet" key={0}>
              {/* Exposure Score & Risk Classification Header */}
              {result && result.analytics && result.analytics.exposure && !isNoResult && (
                <div className="exposure-meter-card">
                  <div className="exposure-gauge-container">
                    <div className="exposure-score-circle" style={{ borderColor: result.analytics.exposure.riskColor }}>
                      <span className="score-num">{result.analytics.exposure.score}</span>
                      <span className="score-label">/ 100</span>
                    </div>
                    <div className="exposure-meta">
                      <div
                        className="risk-badge"
                        style={{
                          backgroundColor: `${result.analytics.exposure.riskColor}22`,
                          color: result.analytics.exposure.riskColor,
                          borderColor: result.analytics.exposure.riskColor
                        }}
                      >
                        THREAT LEVEL: {result.analytics.exposure.riskLevel}
                      </div>
                      <div className="exposure-summary">
                        {result.analytics.exposure.entities.recordCount} records identified • {result.analytics.exposure.entities.phoneCount} phone numbers linked • {result.analytics.exposure.entities.hasDocument ? '⚠️ National Document / Aadhaar Exposed' : 'Digital Exposure Detected'}
                      </div>
                    </div>
                  </div>

                  {/* Factor Breakdown Chips */}
                  {result.analytics.exposure.breakdown && result.analytics.exposure.breakdown.length > 0 && (
                    <div className="breakdown-chips">
                      {result.analytics.exposure.breakdown.map((b, idx) => (
                        <span className="breakdown-chip" key={idx}>
                          ⚡ {b.factor}: +{b.points} pts
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="packet-header">
                <h2>[ Data Breach Information ]</h2>

                <div className="header-actions-group">
                  {/* View Mode Switcher Toggle */}
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
                      <button className="header-btn" onClick={handleDownload} aria-label="download-html" disabled={downloading}>
                        {downloading ? 'Exporting…' : 'Download Report'}
                      </button>
                    )}
                    <button className="header-btn" onClick={closeResults} aria-label="new-search">Try another query</button>
                  </div>
                </div>
              </div>

              {/* Conditional View Rendering */}
              {viewMode === 'terminal' ? (
                <pre className="terminal">{terminalText}<span className="cursor" /></pre>
              ) : (
                <BreachTimeline events={result?.analytics?.timeline || []} />
              )}

              {/* Optional: show raw packet info for debugging when content is missing */}
              {(!preferredPacket || Object.keys(preferredPacket).length === 0) && (
                <div className="warning">No detailed packet available.</div>
              )}

              {/* Pagination controls (only when more than one page) */}
              {hasPagination && (
                <div className="pagination-controls">
                  <button 
                    className="pagination-btn prev-btn"
                    onClick={handlePrevPage}
                    disabled={loadingPrevPage}
                    aria-label="previous-page"
                  >
                    {loadingPrevPage ? 'Loading...' : '◀ Prev'}
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
                    {loadingNextPage ? 'Loading...' : 'Next ▶'}
                  </button>
                </div>
              )}
            </div>
          );
        })()}
        {result && result.error && <div className="error">{result.error}</div>}
      </div>
      )}
      {/* Dark web monitor ticker */}
      {!isSearchingUI && <DarkWebTicker />}
    </div>
  );
}

export default App;
