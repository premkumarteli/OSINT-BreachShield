import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion, useAnimate, stagger } from 'framer-motion';
import './intro_animation.css';

const BRAND_LETTERS = [
  { char: 'B', group: 'breach' },
  { char: 'R', group: 'breach' },
  { char: 'E', group: 'breach' },
  { char: 'A', group: 'breach' },
  { char: 'C', group: 'breach' },
  { char: 'H', group: 'breach' },
  { char: 'S', group: 'shield' },
  { char: 'H', group: 'shield' },
  { char: 'I', group: 'shield' },
  { char: 'E', group: 'shield' },
  { char: 'L', group: 'shield' },
  { char: 'D', group: 'shield' },
];

const getSlowMoFactor = () => {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') {
    return 1;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const slowVal = parseInt(params.get('introSlow'), 10);
    if (!isNaN(slowVal) && slowVal >= 1 && slowVal <= 10) {
      return slowVal;
    }
  } catch (_) {}
  return 1;
};

export default function IntroLogoAnimation({ onComplete, onDockStart }) {
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState('initial'); // 'initial' | 'scan' | 'wordmark' | 'docking' | 'done'
  const [isReady, setIsReady] = useState(false);
  const isSkippedRef = useRef(false);
  const initialWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [scope, animate] = useAnimate();

  const slowFactor = getSlowMoFactor();

  const restoreScroll = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }, []);

  const handleSkip = useCallback(() => {
    if (isSkippedRef.current) return;
    isSkippedRef.current = true;
    try {
      sessionStorage.setItem('breachshield_intro_seen', 'true');
    } catch (_) {}
    restoreScroll();
    setStep('done');
    onComplete();
  }, [onComplete, restoreScroll]);

  // Scroll lock: applied while timeline can run and released on any exit path
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (shouldReduceMotion) {
      handleSkip();
      return;
    }
    try {
      if (sessionStorage.getItem('breachshield_intro_seen')) {
        handleSkip();
        return;
      }
    } catch (_) {}

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      restoreScroll();
    };
  }, [shouldReduceMotion, handleSkip, restoreScroll]);

  // Window resize: only cancel if width changes (height-only changes from mobile URL bar are ignored)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    initialWidthRef.current = window.innerWidth;

    const handleWindowResize = () => {
      if (isSkippedRef.current) return;
      if (window.innerWidth !== initialWidthRef.current) {
        handleSkip();
      }
    };
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [handleSkip]);

  // Start Clean: decode logo image AND preload Orbitron fonts under single 1500ms max-wait timeout
  useEffect(() => {
    let isMounted = true;
    let maxWaitTimer = null;

    if (typeof window === 'undefined') {
      setIsReady(true);
      return;
    }

    const markReady = () => {
      if (isMounted) {
        if (maxWaitTimer) clearTimeout(maxWaitTimer);
        setIsReady(true);
      }
    };

    // Shared 1500ms max-wait timeout ensures gate never hangs
    maxWaitTimer = setTimeout(markReady, 1500);

    const imagePromise = new Promise((resolve) => {
      try {
        const img = new Image();
        img.src = '/logo-icon.png';
        if (typeof img.decode === 'function') {
          img.decode().then(resolve).catch(resolve);
        } else if (img.complete) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = resolve;
        }
      } catch (_) {
        resolve();
      }
    });

    const fontPromise = (async () => {
      if (typeof document !== 'undefined' && document.fonts && typeof document.fonts.load === 'function') {
        try {
          await Promise.all([
            document.fonts.load('900 2rem Orbitron'),
            document.fonts.load('900 1.03rem Orbitron')
          ]);
        } catch (_) {}
      }
    })();

    Promise.all([imagePromise, fontPromise]).then(markReady).catch(markReady);

    return () => {
      isMounted = false;
      if (maxWaitTimer) clearTimeout(maxWaitTimer);
    };
  }, []);

  // Single Timeline Sequence driven by Framer Motion useAnimate
  useEffect(() => {
    if (!isReady || shouldReduceMotion) return;

    try {
      if (sessionStorage.getItem('breachshield_intro_seen')) return;
    } catch (_) {}

    let isCancelled = false;

    const runTimeline = async () => {
      try {
        // 0.0 - 0.4s: Initial scan line at top fades in
        if (isSkippedRef.current || isCancelled) return;
        setStep('initial');
        if (scope.current) {
          await animate(
            '.intro-scan-line',
            { opacity: [0, 0.8], y: 0 },
            { duration: 0.4 * slowFactor }
          );
        }

        // 0.4 - 1.4s: Scan sweep top-to-bottom reveals logo (1.0s * slowFactor)
        // Scan line translateY: [0, 140] exactly tracks clip-path bottom inset 100% -> 0%
        if (isSkippedRef.current || isCancelled) return;
        setStep('scan');
        if (scope.current) {
          await Promise.all([
            animate(
              '.intro-scan-line',
              { y: [0, 140], opacity: [0.8, 1, 1, 0] },
              { duration: 1.0 * slowFactor, ease: 'easeInOut' }
            ),
            animate(
              '.intro-logo-clip',
              { clipPath: ['inset(-30% -30% 100% -30%)', 'inset(-30% -30% 0% -30%)'] },
              { duration: 1.0 * slowFactor, ease: 'easeInOut' }
            )
          ]);
          // Release bottom glow inset once scan line finishes
          if (!isSkippedRef.current && !isCancelled) {
            animate(
              '.intro-logo-clip',
              { clipPath: 'inset(-30% -30% -30% -30%)' },
              { duration: 0.05 * slowFactor }
            );
          }
        }

        // 1.4 - 2.0s: Wordmark reveals letter by letter in reading order B-R-E-A-C-H-S-H-I-E-L-D
        // Make wordmark container visible, then unclip each letter at its stagger time
        if (isSkippedRef.current || isCancelled) return;
        setStep('wordmark');
        if (scope.current) {
          const wordmarkEl = scope.current.querySelector('.intro-dock-wordmark');
          if (wordmarkEl) {
            wordmarkEl.style.visibility = 'visible';
          }

          await animate(
            '.intro-letter',
            {
              clipPath: ['inset(100%)', 'inset(0%)'],
              opacity: [0, 1],
              y: [6, 0]
            },
            {
              delay: stagger(0.04 * slowFactor),
              duration: 0.18 * slowFactor,
              ease: 'easeOut'
            }
          );

          if (!isSkippedRef.current && !isCancelled) {
            // Remove clip-path so glow and docking transforms are unconstrained
            const letters = scope.current.querySelectorAll('.intro-letter');
            letters.forEach((l) => {
              l.style.clipPath = 'none';
              l.style.webkitClipPath = 'none';
            });
          }
        }

        // Measure Navbar icon and wordmark bounding rects right before docking
        const navIconEl = document.getElementById('navbar-brand-icon') || document.querySelector('.navbar-brand-icon-slot');
        const navWordEl = document.getElementById('navbar-brand-text') || document.querySelector('.concept-navbar .brand-text-wrap');
        const introIconEl = scope.current?.querySelector('.intro-dock-icon');
        const introWordEl = scope.current?.querySelector('.intro-dock-wordmark');

        const navIconRect = navIconEl?.getBoundingClientRect();
        const navWordRect = navWordEl?.getBoundingClientRect();
        const introIconRect = introIconEl?.getBoundingClientRect();
        const introWordRect = introWordEl?.getBoundingClientRect();

        // If rects are missing/zero, jump directly to final state
        if (
          !navIconRect || !navWordRect || !introIconRect || !introWordRect ||
          navIconRect.width === 0 || navIconRect.height === 0 ||
          navWordRect.width === 0 || navWordRect.height === 0 ||
          introIconRect.width === 0 || introIconRect.height === 0 ||
          introWordRect.width === 0 || introWordRect.height === 0
        ) {
          handleSkip();
          return;
        }

        const deltaIconX = navIconRect.left - introIconRect.left;
        const deltaIconY = navIconRect.top - introIconRect.top;
        const scaleIcon = navIconRect.width / introIconRect.width;

        const deltaWordX = navWordRect.left - introWordRect.left;
        const deltaWordY = navWordRect.top - introWordRect.top;
        const scaleWord = navWordRect.width / introWordRect.width;

        // 2.0 - 2.8s: Direct transform dock over 0.8s * slowFactor with single easing
        // Remove Skip Button from DOM as soon as docking starts
        if (isSkippedRef.current || isCancelled) return;
        setStep('docking');
        if (onDockStart) onDockStart();

        await Promise.all([
          animate(
            '.intro-dock-icon',
            {
              x: [0, deltaIconX],
              y: [0, deltaIconY],
              scale: [1, scaleIcon],
              originX: 0,
              originY: 0
            },
            { duration: 0.8 * slowFactor, ease: [0.16, 1, 0.3, 1] }
          ),
          animate(
            '.intro-logo-glow-wrapper',
            {
              filter: [
                'drop-shadow(0 0 20px rgba(34, 211, 238, 0.65))',
                'drop-shadow(0 0 16px rgba(0, 240, 255, 0.65))'
              ]
            },
            { duration: 0.8 * slowFactor, ease: [0.16, 1, 0.3, 1] }
          ),
          animate(
            '.intro-dock-wordmark',
            {
              x: [0, deltaWordX],
              y: [0, deltaWordY],
              scale: [1, scaleWord],
              originX: 0,
              originY: 0
            },
            { duration: 0.8 * slowFactor, ease: [0.16, 1, 0.3, 1] }
          ),
          animate(
            '.intro-overlay-bg',
            { opacity: [1, 0] },
            { duration: 0.8 * slowFactor, ease: [0.16, 1, 0.3, 1] }
          )
        ]);

        // On arrival: single-frame handoff (reveal navbar brand, unmount intro)
        if (isSkippedRef.current || isCancelled) return;
        try {
          sessionStorage.setItem('breachshield_intro_seen', 'true');
        } catch (_) {}
        restoreScroll();
        setStep('done');
        onComplete();
      } catch (err) {
        restoreScroll();
        if (!isCancelled && !isSkippedRef.current) {
          handleSkip();
        }
      }
    };

    runTimeline();

    return () => {
      isCancelled = true;
    };
  }, [isReady, shouldReduceMotion, animate, handleSkip, onComplete, onDockStart, restoreScroll, scope, slowFactor]);

  if (step === 'done') return null;

  return (
    <div ref={scope} className="intro-container" data-testid="intro-container">
      {/* Decorative overlay root with aria-hidden="true" (no role="dialog", no aria-modal) */}
      <div className="intro-overlay" aria-hidden="true">
        {/* Layer 1: Background (#04121F + grid) */}
        <div className="intro-overlay-bg" />

        {/* Layer 2: Fixed Brand layer holding icon and wordmark */}
        <div className="intro-brand-layer">
          {/* Logo Mark Container (140px square) */}
          <div className="intro-dock-icon" style={{ transformOrigin: 'top left' }}>
            {/* Unclipped glow wrapper */}
            <div className="intro-logo-glow-wrapper">
              {/* Clipped image wrapper with negative insets */}
              <div
                className="intro-logo-clip"
                style={{
                  clipPath: 'inset(-30% -30% 100% -30%)',
                  WebkitClipPath: 'inset(-30% -30% 100% -30%)'
                }}
              >
                <img
                  src="/logo-icon.png"
                  alt="BreachShield Shield"
                  className="intro-logo-img"
                />
              </div>
            </div>

            {/* Sweeping Cyan Scan-Line */}
            <div
              className="intro-scan-line"
              style={{ transform: 'translateY(0px)', opacity: 0 }}
            />
          </div>

          {/* Wordmark Container (hidden initially, revealed at wordmark step) */}
          <div
            className="intro-dock-wordmark"
            aria-label="BreachShield"
            style={{ transformOrigin: 'top left', visibility: 'hidden' }}
          >
            <span className="brand-name intro-brand-name">
              <span className="brand-text-white intro-letter-group">
                {BRAND_LETTERS.filter((l) => l.group === 'breach').map((letter, idx) => (
                  <span
                    key={`b-${idx}`}
                    className="intro-letter"
                    aria-hidden="true"
                    style={{
                      opacity: 0,
                      clipPath: 'inset(100%)',
                      WebkitClipPath: 'inset(100%)',
                      transform: 'translateY(6px)',
                      display: 'inline-block'
                    }}
                  >
                    {letter.char}
                  </span>
                ))}
              </span>
              <span className="brand-text-blue intro-letter-group">
                {BRAND_LETTERS.filter((l) => l.group === 'shield').map((letter, idx) => (
                  <span
                    key={`s-${idx}`}
                    className="intro-letter"
                    aria-hidden="true"
                    style={{
                      opacity: 0,
                      clipPath: 'inset(100%)',
                      WebkitClipPath: 'inset(100%)',
                      transform: 'translateY(6px)',
                      display: 'inline-block'
                    }}
                  >
                    {letter.char}
                  </span>
                ))}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Skip Intro Button: outside aria-hidden container; removed from DOM as soon as dock starts */}
      {step !== 'docking' && step !== 'done' && (
        <button
          type="button"
          className="intro-skip-btn"
          onClick={handleSkip}
          aria-label="Skip Intro Animation"
        >
          Skip Intro ✕
        </button>
      )}
    </div>
  );
}
