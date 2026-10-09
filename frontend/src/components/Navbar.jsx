import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar({ isIntroActive = false }) {
  return (
    <header className="concept-navbar" role="banner">
      <Link to="/" className="concept-brand" aria-label="BreachShield Home">
        <motion.div
          layoutId="brand-logo-icon"
          style={{ width: 48, height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <img
            src="/logo-icon.png"
            alt="BreachShield Logo"
            className="brand-logo-icon"
            style={{ width: 48, height: 48 }}
          />
        </motion.div>

        <motion.div
          layoutId="brand-logo-text"
          layout="position"
          className="brand-text-wrap"
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="brand-name">
            <span className="brand-text-white">BREACH</span>
            <span className="brand-text-blue">SHIELD</span>
          </span>
        </motion.div>
      </Link>

      <motion.nav
        className="concept-nav-links"
        aria-label="Main Navigation"
        initial={isIntroActive ? { opacity: 0, y: -6 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: isIntroActive ? 2.8 : 0 }}
      >
        <Link to="/" className="nav-link-item active">Home</Link>
        <a href="#about" className="nav-link-item">About</a>
        <a href="#features" className="nav-link-item">Features</a>
        <a href="#contact" className="nav-link-item">Contact</a>
      </motion.nav>
    </header>
  );
}
