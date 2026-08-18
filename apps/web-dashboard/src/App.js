
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './App.css';
import bgVideo1 from './bg1.mp4';
import bgVideo2 from './bg2.mp4';
import bgVideo3 from './bg3.mp4';
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
      const startDelay = setTimeout(() => startTyping(text), 250);
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
    setStep('input');
    setOtp('');
    setOtpError('');
    setBreaches([]);
    setCurrentPage(0);
    setLoadingNextPage(false);
    setLoadingPrevPage(false);
    if (typedKeysRef.current) typedKeysRef.current.clear();
    if (visitedPagesRef.current) visitedPagesRef.current.clear();
  };

  // View mode switcher: 'terminal' or 'timeline'
  const [viewMode, setViewMode] = useState('terminal');

  // Trigger backend to click 'Download' and stream file back
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const currentToken = token || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('osint_token') : '');
      const res = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ query, content })
      });
      if (!res.ok) {
        const t = await res.text();
        setResult(prev => ({ ...prev, error: `❌ Download failed: ${t || res.status}` }));
        return;
      }
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

  // Step 1: Dispatch OTP to Target Email or Phone
  const handleGenerateOtp = async (e) => {
    if (e) e.preventDefault();
    if (!isValidInput) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: query.trim(),
          email: query.trim().toLowerCase(),
          phone: query.trim(),
          searchType: searchType.toLowerCase()
        })
      });
      const data = await res.json();
      if (data && data.success !== false) {
        setStep('otp');
        setTimeLeft(300);
        setCooldown(30);
        setOtp('');
      } else {
        setOtpError(data?.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setOtpError('Failed to dispatch verification code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 2: Verify OTP and Immediately Execute Breach Search
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.length !== 6 || otpLoading || timeLeft <= 0) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: query.trim(),
          email: query.trim().toLowerCase(),
          phone: query.trim(),
          otp: otp.trim()
        })
      });
      const data = await res.json();
      if (data && data.success !== false) {
        const receivedToken = data.token;
        setToken(receivedToken);
        sessionStorage.setItem('osint_token', receivedToken);
        sessionStorage.setItem('osint_verified_email', query.trim().toLowerCase());
        setStep('results');
        executeSearchWithToken(receivedToken);
      } else {
        setOtpError(data?.error || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setOtpError('Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3: Execute Breach Scan with Verified JWT Token
  const executeSearchWithToken = async (activeToken) => {
    const searchToken = activeToken || token || sessionStorage.getItem('osint_token') || '';
    if (typedKeysRef.current) typedKeysRef.current.clear();
    if (visitedPagesRef.current) visitedPagesRef.current.clear();
    
    setLoading(true);
    setShowSearchingAnimation(true);
    setShowWaitHint(false);
    setUseBg2(false);
    setBg2Failed(false);
    setUseBg3(true);
    setBg3Failed(false);
    searchingRef.current = true;
    
    if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
    if (waitHintTimerRef.current) { clearTimeout(waitHintTimerRef.current); waitHintTimerRef.current = null; }
    waitHintTimerRef.current = setTimeout(() => {
      if (searchingRef.current) setShowWaitHint(true);
    }, 8000);
    
    if (bg3Ref.current) {
      try {
        bg3Ref.current.currentTime = 0;
        bg3Ref.current.muted = true;
        bg3Ref.current.play().then(() => setBg3Failed(false)).catch(() => setBg3Failed(true));
      } catch (e) { setBg3Failed(true); }
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(searchToken ? { 'Authorization': `Bearer ${searchToken}` } : {})
      };
      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: query.trim(), osintType, searchType })
      });

      const data = await res.json();
      
      if (!res.ok || (data && !data.success)) {
        if (res.status === 403) {
          setStep('otp');
          setOtpError('Email verification required. Please enter your OTP.');
          setShowSearchingAnimation(false);
          setLoading(false);
          setUseBg3(false);
          return;
        }
        throw new Error(data?.error || `Server error: ${res.status}`);
      }
      
      const resultDataRaw = data && data.data ? data.data : { packets: [{}, { info: 'No records found.' }] };
      const resultData = normalizeResultData(resultDataRaw);
      if (data && data.data && data.data.pagination) {
        const { total } = data.data.pagination;
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
      setShowSearchingAnimation(false);
      setUseBg3(false);
      setUseBg2(true);
      try { if (bg2Ref.current) { bg2Ref.current.currentTime = 0; bg2Ref.current.play().catch(()=>{}); } } catch(e){}
      
      prefetchNextPages(1, searchToken);
    } catch (err) {
      searchingRef.current = false;
      if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
      if (waitHintTimerRef.current) { clearTimeout(waitHintTimerRef.current); waitHintTimerRef.current = null; }
      setShowWaitHint(false);

      const errorResult = { error: `❌ ${err.message || 'Server error occurred while scanning.'}` };
      setBreaches([errorResult]);
      setCurrentPage(0);
      setResult(errorResult);
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
        const currentToken = token || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('osint_token') : '');
        const res = await fetch(`${API_BASE}/api/telegram-page`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
          },
          credentials: 'include'
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
      const currentToken = token || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('osint_token') : '');
      const res = await fetch(`${API_BASE}/api/telegram-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
        },
        credentials: 'include'
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
      const currentToken = token || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('osint_token') : '');
      const res = await fetch(`${API_BASE}/api/telegram-prev-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
        },
        credentials: 'include'
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

      {showSearch && !loading && !result && step === 'input' && (
        <div className="search-card" role="search">
          <div className={`search-row centered ${loading ? 'search-anim' : ''}`}>
            <select 
              className="search-type-select"
              value={searchType}
              onChange={e => handleSearchTypeChange(e.target.value)}
              disabled={loading || otpLoading}
              aria-label="search-type-select"
            >
              <option value="Email">Email</option>
              <option value="Mobile">Phone Number</option>
            </select>
            <input
              className="search-input"
              type="text"
              placeholder={searchType === 'Email' ? "Enter email to check breaches (e.g. user@example.com)" : "Enter phone number with country code (e.g. +918722611983)"}
              value={query}
              onChange={e => handleInputChange(e.target.value)}
              onFocus={() => setOverlayActive(true)}
              onBlur={() => setOverlayActive(false)}
              aria-label="search-input"
              aria-busy={loading}
              disabled={loading || otpLoading}
              autoFocus
            />
            <button 
              className="search-btn" 
              onClick={handleGenerateOtp} 
              disabled={loading || otpLoading || !isValidInput} 
              aria-label="generate-otp-button"
            >
              {otpLoading ? '[ SENDING… ]' : '[ GENERATE OTP ⚡ ]'}
            </button>
          </div>
          {validationError && (
            <div className="validation-error">{validationError}</div>
          )}
          {otpError && (
            <div className="validation-error">{otpError}</div>
          )}
          <div className="inline-disclaimer" role="note">
            {searchType === 'Email' 
              ? '🔒 Enter target email address to receive a secure 6-digit verification code before retrieving breach intelligence.' 
              : '📱 Enter target phone number to receive a secure 6-digit SMS OTP via Android Gateway before retrieving breach intelligence.'}
          </div>
        </div>
      )}

      {showSearch && !loading && !result && step === 'otp' && (
        <div className="search-card" role="region" aria-label="otp-verification">
          <div className="otp-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, color: '#00eaff', fontFamily: 'Orbitron, monospace', fontSize: '0.85rem' }}>
            <span>VERIFICATION CODE SENT TO: <strong style={{ color: '#fff' }}>{query}</strong></span>
            <span style={{ color: timeLeft <= 60 ? '#ff3366' : '#00eaff' }}>⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>

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
              className="search-btn" 
              onClick={handleVerifyOtp} 
              disabled={otpLoading || otp.length !== 6 || timeLeft <= 0} 
              aria-label="verify-otp-button"
            >
              {otpLoading ? '[ SCANNING… ]' : '[ VERIFY & SCAN 🔍 ]'}
            </button>
          </div>

          {otpError && (
            <div className="validation-error">{otpError}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: '0.85rem' }}>
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
              ← Change {searchType === 'Email' ? 'Email' : 'Number'}
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
                    <div className="exposure-score-circle" style={{ borderColor: result.analytics.exposure.riskColor || '#00ff66' }}>
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
    </div>
  );
}

export default App;
