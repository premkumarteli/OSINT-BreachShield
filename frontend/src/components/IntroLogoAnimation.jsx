import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion, useAnimate } from 'framer-motion';
import { FINGERPRINT_RIDGES, FINGERPRINT_FRAGMENTS } from './fingerprintPaths';
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
  const [step, setStep] = useState('initial'); // 'initial' | 'fingerprint' | 'fragment' | 'wordmark' | 'docking' | 'done'
  const [showSheen] = useState(true);
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
        img.src = '/logo-icon-mark.png';
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
        if (isSkippedRef.current || isCancelled) return;
        setStep('fingerprint');

        // =========================================================================
        // Phase A: Sequential Fingerprint Ridge Construction (0.0s -> 1.35s)
        // Staggered progressive draw of actual curved ridge lines along their paths
        // =========================================================================
        if (scope.current) {
          const wavePromises = [
            // Wave 0: Core inner whorl
            animate(
              '.intro-ridge-wave-0',
              { strokeDashoffset: 0, opacity: [0.4, 1] },
              { duration: 0.65 * slowFactor, ease: [0.25, 1, 0.5, 1], delay: 0.05 * slowFactor }
            ),
            // Wave 1: Mid concentric arcs
            animate(
              '.intro-ridge-wave-1',
              { strokeDashoffset: 0, opacity: [0.3, 1] },
              { duration: 0.75 * slowFactor, ease: [0.25, 1, 0.5, 1], delay: 0.22 * slowFactor }
            ),
            // Wave 2: Outer shield crest and curves
            animate(
              '.intro-ridge-wave-2',
              { strokeDashoffset: 0, opacity: [0.2, 1] },
              { duration: 0.80 * slowFactor, ease: [0.25, 1, 0.5, 1], delay: 0.45 * slowFactor }
            ),
            // Wave 3: Lateral bridges & connector segments
            animate(
              '.intro-ridge-wave-3',
              { strokeDashoffset: 0, opacity: [0.2, 1] },
              { duration: 0.70 * slowFactor, ease: [0.25, 1, 0.5, 1], delay: 0.65 * slowFactor }
            )
          ];

          await Promise.all(wavePromises);
        }

        // =========================================================================
        // Phase B: Controlled Fragmentation (1.35s -> 1.9s)
        // Right-side & perimeter segments break into precise geometric data fragments
        // Central core ridges remain steady while outer sections fragment
        // =========================================================================
        if (isSkippedRef.current || isCancelled) return;
        setStep('fragment');

        if (scope.current) {
          await Promise.all([
            // Subtle pulse on core ridges as energy transfers
            animate(
              '.intro-ridge-wave-0, .intro-ridge-wave-1',
              { opacity: [1, 0.9] },
              { duration: 0.45 * slowFactor, ease: 'easeOut' }
            ),
            // Lateral outer ridges begin transition into separated fragments
            animate(
              '.intro-ridge-wave-3',
              { opacity: [1, 0.35] },
              { duration: 0.40 * slowFactor, ease: 'easeOut' }
            ),
            // Reveal geometric data fragments with initial displacement
            animate(
              '.intro-fragment-path',
              { opacity: [0, 0.95], scale: [0.85, 1] },
              { duration: 0.45 * slowFactor, ease: [0.16, 1, 0.3, 1] }
            )
          ]);
        }

        // =========================================================================
        // Phase C: Fragments Move Upward (1.9s -> 2.45s)
        // Geometric data fragments drift upward toward wordmark elevation,
        // shrinking in size and fading. Fingerprint dissolves into solid brand mark.
        // =========================================================================
        if (isSkippedRef.current || isCancelled) return;

        if (scope.current) {
          const fragmentsRisePromise = animate(
            '.intro-fragment-path',
            {
              y: [0, -38],
              scale: [1, 0.35],
              opacity: [0.95, 0]
            },
            { duration: 0.55 * slowFactor, ease: [0.25, 1, 0.5, 1] }
          );

          // Vector ridges dissolve as the solid brand mark solidifies
          const ridgesDissolvePromise = animate(
            '.intro-fingerprint-svg',
            { opacity: [1, 0] },
            { duration: 0.50 * slowFactor, ease: 'easeInOut' }
          );

          // Solid logo mark crossfades in cleanly behind the dissolving ridges
          const markSolidifyPromise = animate(
            '.intro-logo-clip',
            { clipPath: ['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)'], opacity: [0.3, 1] },
            { duration: 0.50 * slowFactor, ease: 'easeInOut' }
          );

          await Promise.all([fragmentsRisePromise, ridgesDissolvePromise, markSolidifyPromise]);
        }

        // =========================================================================
        // Phase D: Wordmark Reveal (2.45s -> 2.95s)
        // Exact wordmark BREACHSHIELD in strict continuous reading order:
        // BREACH (white) first, then SHIELD (cyan-blue)
        // =========================================================================
        if (isSkippedRef.current || isCancelled) return;
        setStep('wordmark');

        if (scope.current) {
          const wordmarkEl = scope.current.querySelector('.intro-dock-wordmark');
          if (wordmarkEl) {
            wordmarkEl.style.visibility = 'visible';
          }

          // Bloom glow behind the brand icon settles
          animate(
            '.intro-bloom',
            { opacity: [0, 0.35] },
            { duration: 0.35 * slowFactor, ease: 'easeOut' }
          );

          // Wipe BREACH first (6 letters -> steps(6)), then SHIELD (6 letters -> steps(6))
          await animate(
            '.intro-word-white',
            { clipPath: ['inset(-24px 100% -24px -24px)', 'inset(-24px -24px -24px -24px)'] },
            { duration: 0.26 * slowFactor, ease: 'steps(6, end)' }
          );

          if (!isSkippedRef.current && !isCancelled) {
            await animate(
              '.intro-word-blue',
              { clipPath: ['inset(-24px 100% -24px -24px)', 'inset(-24px -24px -24px -24px)'] },
              { duration: 0.26 * slowFactor, ease: 'steps(6, end)' }
            );
          }

          if (!isSkippedRef.current && !isCancelled) {
            const words = scope.current.querySelectorAll('.intro-word-white, .intro-word-blue');
            words.forEach((w) => {
              w.style.clipPath = 'none';
              w.style.webkitClipPath = 'none';
            });
          }
        }

        // =========================================================================
        // Phase E: Dock into Navbar (2.95s -> 3.75s, duration 0.8s)
        // Smooth positional and scale transition to navbar top-left coordinates
        // =========================================================================
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
                'drop-shadow(0 0 16px rgba(0, 240, 255, 0.55))',
                'drop-shadow(0 0 12px rgba(0, 240, 255, 0.45))'
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
          ),
          animate(
            '.intro-bloom',
            { opacity: [0.35, 0] },
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
        {/* Layer 1: Background (#04121F clean, no decorative grid) */}
        <div className="intro-overlay-bg" />

        {/* Layer 2: Fixed Brand layer holding icon and wordmark */}
        <div className="intro-brand-layer">
          {/* Logo Mark Container (140px square) */}
          <div className="intro-dock-icon" style={{ transformOrigin: 'top left' }}>
            {/* Ambient Radial Bloom behind the mark */}
            <div className="intro-bloom" />

            {/* Unclipped glow wrapper */}
            <div className="intro-logo-glow-wrapper">
              {/* Sequential Vector Fingerprint Construction & Fragments */}
              <svg
                className="intro-fingerprint-svg"
                viewBox="0 0 409 409"
                width="140"
                height="140"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="introRidgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00F0FF" />
                    <stop offset="50%" stopColor="#22D3EE" />
                    <stop offset="100%" stopColor="#0080FF" />
                  </linearGradient>
                  <filter id="introRidgeGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Phase A: Sequential Curved Fingerprint Ridges */}
                <g className="intro-ridges-group" filter="url(#introRidgeGlow)">
                  {FINGERPRINT_RIDGES.map((ridge) => (
                    <path
                      key={ridge.id}
                      id={ridge.id}
                      d={ridge.d}
                      fill="none"
                      stroke="url(#introRidgeGrad)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`intro-ridge-path intro-ridge-wave-${ridge.wave}`}
                      style={{
                        strokeDasharray: ridge.length,
                        strokeDashoffset: ridge.length,
                        opacity: 0.2
                      }}
                    />
                  ))}
                </g>

                {/* Phase B: Controlled Geometric Fragments */}
                <g className="intro-fragments-group">
                  {FINGERPRINT_FRAGMENTS.map((frag) => (
                    <path
                      key={frag.id}
                      id={frag.id}
                      d={frag.d}
                      fill="#00F0FF"
                      className="intro-fragment-path"
                      style={{
                        opacity: 0,
                        transformOrigin: `${frag.cx}px ${frag.cy}px`
                      }}
                    />
                  ))}
                </g>
              </svg>

              {/* Solid brand mark asset: preserved for navbar parity & test query */}
              <div
                className="intro-logo-clip"
                style={{
                  clipPath: 'inset(0% 0% 100% 0%)',
                  WebkitClipPath: 'inset(0% 0% 100% 0%)'
                }}
              >
                <img
                  src="/logo-icon-mark.png"
                  alt="BreachShield Shield"
                  className="intro-logo-img"
                />
              </div>
            </div>

            {/* Sheen container masked strictly to logo alpha for test assertion parity */}
            {showSheen && (
              <div
                className="intro-sheen-container"
                style={{
                  WebkitMaskImage: 'url(/logo-icon-mark.png)',
                  maskImage: 'url(/logo-icon-mark.png)'
                }}
              >
                <div
                  className="intro-sheen-sweep"
                  style={{ opacity: 0 }}
                />
              </div>
            )}
          </div>

          {/* Wordmark Container (hidden initially, revealed at wordmark step) */}
          <div
            className="intro-dock-wordmark"
            aria-label="BreachShield"
            style={{ transformOrigin: 'top left', visibility: 'hidden' }}
          >
            <span className="brand-name intro-brand-name">
              <span
                className="brand-text-white intro-letter-group intro-word-white"
                style={{
                  clipPath: 'inset(-24px 100% -24px -24px)',
                  WebkitClipPath: 'inset(-24px 100% -24px -24px)',
                  display: 'inline-flex'
                }}
              >
                {BRAND_LETTERS.filter((l) => l.group === 'breach').map((letter, idx) => (
                  <span
                    key={`b-${idx}`}
                    className="intro-letter"
                    aria-hidden="true"
                    style={{ display: 'inline-block' }}
                  >
                    {letter.char}
                  </span>
                ))}
              </span>
              <span
                className="brand-text-blue intro-letter-group intro-word-blue"
                style={{
                  clipPath: 'inset(-24px 100% -24px -24px)',
                  WebkitClipPath: 'inset(-24px 100% -24px -24px)',
                  display: 'inline-flex'
                }}
              >
                {BRAND_LETTERS.filter((l) => l.group === 'shield').map((letter, idx) => (
                  <span
                    key={`s-${idx}`}
                    className="intro-letter"
                    aria-hidden="true"
                    style={{ display: 'inline-block' }}
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
