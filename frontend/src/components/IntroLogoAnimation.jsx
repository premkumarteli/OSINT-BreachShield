import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import './intro_animation.css';

const BREACH_LETTERS = ['B', 'R', 'E', 'A', 'C', 'H'];
const SHIELD_LETTERS = ['S', 'H', 'I', 'E', 'L', 'D'];

export default function IntroLogoAnimation({ onComplete, onDockStart }) {
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState('initial'); // 'initial' | 'scan' | 'wordmark' | 'docking' | 'fadeout' | 'done'
  const isSkippedRef = useRef(false);

  const handleSkip = () => {
    if (isSkippedRef.current) return;
    isSkippedRef.current = true;
    try {
      sessionStorage.setItem('breachshield_intro_seen', 'true');
    } catch (_) {}
    setStep('done');
    onComplete();
  };

  useEffect(() => {
    // If reduced motion is preferred or already seen, skip immediately
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

    // Timeline Sequence (~3.2s total)
    // 0.0 - 0.4s: Initial scan line at center
    const t0 = setTimeout(() => {
      if (!isSkippedRef.current) setStep('scan');
    }, 400);

    // 0.4 - 1.4s: Scan sweep top-to-bottom reveals logo (1000ms duration)
    // 1.4 - 2.0s: Wordmark appears
    const t1 = setTimeout(() => {
      if (!isSkippedRef.current) setStep('wordmark');
    }, 1400);

    // 2.0 - 2.8s: Docking handoff to Navbar
    const t2 = setTimeout(() => {
      if (!isSkippedRef.current) {
        setStep('docking');
        if (onDockStart) onDockStart();
      }
    }, 2000);

    // 2.8 - 3.2s: Fade out overlay background
    const t3 = setTimeout(() => {
      if (!isSkippedRef.current) setStep('fadeout');
    }, 2800);

    // 3.2s: Finish and unmount
    const t4 = setTimeout(() => {
      if (!isSkippedRef.current) {
        try {
          sessionStorage.setItem('breachshield_intro_seen', 'true');
        } catch (_) {}
        setStep('done');
        onComplete();
      }
    }, 3200);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReduceMotion]);

  if (step === 'done') return null;

  return (
    <AnimatePresence>
      {step !== 'fadeout' && step !== 'done' && (
        <motion.div
          className="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          aria-label="BreachShield Logo Intro"
          role="dialog"
          aria-modal="true"
        >
          {/* Skip Intro Button */}
          <button
            type="button"
            className="intro-skip-btn"
            onClick={handleSkip}
            aria-label="Skip Intro Animation"
          >
            Skip Intro ✕
          </button>

          {/* Central Animation Stage (Active before docking) */}
          {step !== 'docking' && (
            <div className="intro-stage">
              {/* Logo Mark Container (140px square) */}
              <div className="intro-logo-container">
                <motion.div
                  layoutId="brand-logo-icon"
                  className="intro-logo-box"
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.img
                    src="/logo-icon.png"
                    alt="BreachShield Shield"
                    className="intro-logo-img"
                    initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
                    animate={
                      step === 'scan' || step === 'wordmark'
                        ? { clipPath: 'inset(0% 0% 0% 0%)' }
                        : { clipPath: 'inset(0% 0% 100% 0%)' }
                    }
                    transition={{ duration: 1.0, ease: 'easeInOut' }}
                  />
                </motion.div>

                {/* Sweeping Cyan Scan-Line */}
                {(step === 'initial' || step === 'scan') && (
                  <motion.div
                    className="intro-scan-line"
                    initial={{ top: '0%', opacity: 0.8 }}
                    animate={
                      step === 'scan'
                        ? { top: ['0%', '100%'], opacity: [0.8, 1, 1, 0] }
                        : { top: '0%', opacity: 0.8 }
                    }
                    transition={{ duration: 1.0, ease: 'easeInOut' }}
                  />
                )}
              </div>

              {/* Wordmark Stagger (Letter by Letter) */}
              <motion.div
                layoutId="brand-logo-text"
                layout="position"
                className="intro-wordmark-wrap"
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="brand-name intro-brand-name">
                  <span className="brand-text-white intro-letter-group">
                    {BREACH_LETTERS.map((letter, i) => (
                      <motion.span
                        key={`b-${i}`}
                        className="intro-letter"
                        initial={{ opacity: 0, y: 6 }}
                        animate={
                          step === 'wordmark'
                            ? { opacity: 1, y: 0 }
                            : { opacity: 0, y: 6 }
                        }
                        transition={{ delay: i * 0.04, duration: 0.18 }}
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </span>
                  <span className="brand-text-blue intro-letter-group">
                    {SHIELD_LETTERS.map((letter, i) => (
                      <motion.span
                        key={`s-${i}`}
                        className="intro-letter"
                        initial={{ opacity: 0, y: 6 }}
                        animate={
                          step === 'wordmark'
                            ? { opacity: 1, y: 0 }
                            : { opacity: 0, y: 6 }
                        }
                        transition={{ delay: 0.24 + i * 0.04, duration: 0.18 }}
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </span>
                </span>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
