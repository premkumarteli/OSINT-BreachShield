import React from 'react';

/**
 * Premium Bespoke Vector Cyber Security Shield Icons.
 * Replaces generic emojis / AI-looking graphics with sleek, animated SVGs.
 */

export function CyberShieldIcon({ size = 26, className = '', animated = true }) {
  return (
    <svg
      className={`cyber-shield-svg ${animated ? 'animated-shield' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="shieldBorderGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="60%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="shieldCoreFill" x1="12" y1="6" x2="12" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* Outer Angular Shield Contour */}
      <path
        className="shield-contour"
        d="M12 2.5L4.5 5.8V11.5C4.5 16.2 7.7 20.5 12 21.5C16.3 20.5 19.5 16.2 19.5 11.5V5.8L12 2.5Z"
        stroke="url(#shieldBorderGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner Translucent Protective Body */}
      <path
        className="shield-body"
        d="M12 5.2L6.8 7.5V11.8C6.8 15.3 9 18.4 12 19.4C15 18.4 17.2 15.3 17.2 11.8V7.5L12 5.2Z"
        fill="url(#shieldCoreFill)"
      />

      {/* Cyber Verification Key / Core Checkmark */}
      <path
        className="shield-core-glyph"
        d="M9.2 11.8L11.2 13.8L15 9.8"
        stroke="#00f0ff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Animated Micro Scanning Dot */}
      <circle cx="12" cy="18" r="1.2" fill="#00f0ff" className="shield-pulse-dot" />
    </svg>
  );
}

export function CyberAlertIcon({ size = 22, className = '' }) {
  return (
    <svg
      className={`cyber-alert-svg animated-alert ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="alertGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#00f0ff" />
        </linearGradient>
      </defs>
      <path
        className="alert-triangle"
        d="M12 3.2L2.5 19.8H21.5L12 3.2Z"
        stroke="url(#alertGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        className="alert-mark"
        x1="12"
        y1="9"
        x2="12"
        y2="14"
        stroke="#00f0ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.2" r="1.3" fill="#00f0ff" className="alert-dot" />
    </svg>
  );
}

export function CyberEmptyShieldIcon({ size = 52, className = '' }) {
  return (
    <svg
      className={`cyber-empty-shield-svg animated-empty-shield ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="emptyShieldGrad" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="orbitGrad" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Orbit Radar Ring */}
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke="url(#orbitGrad)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        className="radar-orbit-ring"
      />

      {/* Outer Armor Crest */}
      <path
        d="M32 10L14 18V30C14 42.5 21.8 53.5 32 56C42.2 53.5 50 42.5 50 30V18L32 10Z"
        stroke="url(#emptyShieldGrad)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="empty-shield-contour"
      />

      {/* Inner Chamber */}
      <path
        d="M32 16L19 22.2V30.5C19 39.8 24.6 47.9 32 50.2C39.4 47.9 45 39.8 45 30.5V22.2L32 16Z"
        fill="rgba(0, 240, 255, 0.08)"
        stroke="rgba(0, 240, 255, 0.35)"
        strokeWidth="1.2"
      />

      {/* Center Cyberlock / Check Emblem */}
      <path
        d="M25 31.5L29.5 36L39 26.5"
        stroke="#00f0ff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="empty-shield-check"
      />

      {/* Pulsing Core Node */}
      <circle cx="32" cy="46" r="2" fill="#00f0ff" className="empty-shield-pulse" />
    </svg>
  );
}

export default CyberShieldIcon;
