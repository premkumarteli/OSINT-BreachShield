import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGroup, motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import IntroLogoAnimation from '../components/IntroLogoAnimation';
import './search_concept.css';
import './landing.css';

const bgVideo1 = '/bg1.mp4';

export default function LandingPage() {
  const [introActive, setIntroActive] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !sessionStorage.getItem('breachshield_intro_seen');
    } catch (_) {
      return false;
    }
  });

  const [dockStarted, setDockStarted] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return !!sessionStorage.getItem('breachshield_intro_seen');
    } catch (_) {
      return true;
    }
  });

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem('breachshield_intro_seen', 'true');
    } catch (_) {}
    setDockStarted(true);
    setIntroActive(false);
  };

  const handleDockStart = () => {
    setDockStarted(true);
  };

  return (
    <LayoutGroup id="breachshield-brand">
      {/* Intro Logo Animation (Runs once per session on root route) */}
      {introActive && (
        <IntroLogoAnimation
          onComplete={handleIntroComplete}
          onDockStart={handleDockStart}
        />
      )}

      <div className="landing-page-wrapper">
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

        {/* Shared Navbar */}
        <Navbar isIntroActive={!dockStarted} />

        {/* Landing Hero Stub */}
        <main className="landing-hero-container">
          <motion.h1
            className="landing-headline"
            initial={introActive ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: introActive ? 2.8 : 0 }}
          >
            Next-Generation Breach &amp; Threat Exposure Intelligence
          </motion.h1>

          <motion.div
            initial={introActive ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: introActive ? 2.95 : 0 }}
          >
            <Link
              to="/search"
              className="landing-cta-btn"
              aria-label="Check my exposure"
            >
              Check my exposure →
            </Link>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="concept-footer">
          <div className="footer-left">
            <img src="/logo-icon.png" alt="" className="footer-brand-icon" aria-hidden="true" />
            <span className="footer-brand-title">
              <span className="brand-text-white">BREACH</span>
              <span className="brand-text-blue">SHIELD</span>
            </span>
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
        </footer>
      </div>
    </LayoutGroup>
  );
}
