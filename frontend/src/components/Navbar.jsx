import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

export default function Navbar({ isIntroActive = false }) {
  const shouldReduceMotion = useReducedMotion();

  const handleAnchorClick = (e, targetId) => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      e.preventDefault();
      targetElement.scrollIntoView({
        behavior: shouldReduceMotion ? 'auto' : 'smooth'
      });
      try {
        window.history.pushState(null, '', `#${targetId}`);
      } catch (_) {}
    }
  };

  return (
    <header className="concept-navbar" role="banner">
      <Link to="/" className="concept-brand" aria-label="BreachShield Home">
        <div
          id="navbar-brand-icon"
          className="navbar-brand-icon-slot"
          style={{
            width: 48,
            height: 48,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            visibility: isIntroActive ? 'hidden' : 'visible'
          }}
        >
          <img
            src="/logo-icon-mark.png"
            alt="BreachShield Logo"
            className="brand-logo-icon"
            style={{ width: 48, height: 48 }}
          />
        </div>

        <div
          id="navbar-brand-text"
          className="brand-text-wrap"
          style={{
            visibility: isIntroActive ? 'hidden' : 'visible'
          }}
        >
          <span className="brand-name">
            <span className="brand-text-white">BREACH</span>
            <span className="brand-text-blue">SHIELD</span>
          </span>
        </div>
      </Link>

      <motion.nav
        className="concept-nav-links"
        aria-label="Main Navigation"
        initial={isIntroActive ? { opacity: 0, y: -6 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: isIntroActive ? 2.8 : 0 }}
      >
        <Link to="/" className="nav-link-item active">Home</Link>
        <a
          href="#about"
          className="nav-link-item"
          onClick={(e) => handleAnchorClick(e, 'about')}
        >
          About
        </a>
        <a
          href="#team"
          className="nav-link-item"
          onClick={(e) => handleAnchorClick(e, 'team')}
        >
          Team
        </a>
        <a
          href="#contact"
          className="nav-link-item"
          onClick={(e) => handleAnchorClick(e, 'contact')}
        >
          Contact
        </a>
      </motion.nav>
    </header>
  );
}
