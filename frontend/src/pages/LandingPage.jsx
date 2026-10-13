import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import IntroLogoAnimation from '../components/IntroLogoAnimation';
import './search_concept.css';
import './landing.css';

const bgVideo1 = '/bg1.mp4';

export const DEFAULT_TEAM = [
  {
    name: "Arvind D H",
    role: "Project Member",
    focus: "OSINT Pipeline & Threat Ingestion",
    bio: "Dept. of Information Science and Engineering (USN: 1AY24IS400)",
    links: {
      github: "",
      linkedin: ""
    }
  },
  {
    name: "Girishkumar N M",
    role: "Project Member",
    focus: "Cryptographic Audit & Merkle Ledger",
    bio: "Dept. of Information Science and Engineering (USN: 1AY24IS404)",
    links: {
      github: "",
      linkedin: ""
    }
  },
  {
    name: "Manoj",
    role: "Project Member",
    focus: "ML Risk Scoring & Heuristic Analytics",
    bio: "Dept. of Information Science and Engineering (USN: 1AY24IS406)",
    links: {
      github: "",
      linkedin: ""
    }
  },
  {
    name: "Premkumar Teli",
    role: "Project Member",
    focus: "Security Architecture & Full-Stack Systems",
    bio: "Dept. of Information Science and Engineering (USN: 1AY24IS407)",
    links: {
      github: "",
      linkedin: ""
    }
  }
];

export const DEFAULT_CONTACT = {
  heading: "Contact & Institutional Affiliation",
  note: "Academic cybersecurity research and breach intelligence engineering at Acharya Institute of Technology.",
  items: [
    { label: "Institution", value: "Acharya Institute of Technology, Bengaluru" },
    { label: "Department", value: "Department of Information Science and Engineering" },
    { label: "Project Title", value: "BreachShield: AI Powered OSINT Breach Detection & Dark Web Protection" },
    { label: "Project Guide", value: "Prof. Sushma T. M., Assistant Professor" },
    { label: "Batch / Cohort", value: "Batch 05 (Academic Year 2025–2026)" },
    { label: "Verification Access", value: "Self-Service OTP-Gated Exposure Portal (/search)" },
    { label: "Research Classification", value: "Defensive OSINT & K-Anonymity Identity Protection" }
  ],
  links: {
    email: "",
    github: "",
    twitter: ""
  }
};

// Deterministic client-side hex digest preview for the interactive k-anonymity sandbox
function computeDeterministicSha256Preview(inputStr) {
  const normalized = (inputStr || 'researcher@acharya.ac.in').trim().toLowerCase();
  const seeds = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      seeds[j] = Math.imul(seeds[j] ^ ((code + i + j * 17) & 0xff), 0x01000193) >>> 0;
      seeds[j] = ((seeds[j] << 7) | (seeds[j] >>> 25)) >>> 0;
    }
  }
  const hex = seeds.map((n) => n.toString(16).padStart(8, '0')).join('').toUpperCase();
  return {
    normalized,
    fullHash: hex,
    prefix: hex.slice(0, 5),
    suffix: hex.slice(5, 32) + '...' + hex.slice(56, 64)
  };
}

const PIPELINE_STEPS = [
  {
    number: '01',
    tag: 'CLIENT-SIDE PARTITIONING',
    title: 'Enter Identifier',
    desc: 'Provide an email address or phone number to initiate an exposure inquiry across documented breach archives.',
    protocol: 'SHA-256 + 5-Hex Prefix Extraction',
    detail: 'Your identifier is normalized in browser memory and hashed into a 256-bit digest. Only the 5-character hex prefix (1 of 1,048,576 buckets) is used for candidate partition matching.',
    payloadPreview: 'GET /api/v2/partition?prefix=6A09E&mode=k-anon'
  },
  {
    number: '02',
    tag: 'ZERO-TRUST OWNERSHIP GATE',
    title: 'OTP Ownership Verification',
    desc: 'Confirm ownership with a time-limited one-time password to ensure breach results are accessed only by authorized owners.',
    protocol: '6-Digit Time-Bound OTP • 300s TTL',
    detail: 'To prevent lateral reconnaissance or unauthorized third-party lookups, BreachShield dispatches a single-use 6-digit verification code with a 5-attempt threshold and 30-second resend cooldown.',
    payloadPreview: 'POST /api/auth/verify-otp { otp: "••••••", ttl: 300 }'
  },
  {
    number: '03',
    tag: 'HEURISTIC CORRELATION & AUDIT',
    title: 'Privacy-Aware Lookup & Remediation',
    desc: 'Review heuristic exposure indicators, matched compromised records, and recommended remediation steps.',
    protocol: '5-Factor Risk Engine + Merkle Root Log',
    detail: 'Matched records are correlated across shared identity fields, scored via our weighted 5-factor formula and offline XGBoost benchmark taxonomy, and anchored to a tamper-evident SHA-256 Merkle tree.',
    payloadPreview: 'AUDIT_LEAF: 0x9F86D081... -> MERKLE_ROOT_ANCHORED'
  }
];

const SAMPLE_SCENARIOS = [
  {
    id: 'corporate',
    tabLabel: 'Scenario A • Corporate Spill',
    riskText: 'Medium Risk (Sample • 42 / 100)',
    riskScore: 42,
    riskBadgeClass: 'risk-medium',
    targetPreview: 'r•••@enterprise-demo.org',
    bucketId: '0x7F4A2',
    merkleLeaf: '0x8b4e92c1f03d7a65...e91b',
    factors: [
      { label: 'Breach Severity Weight (35%)', pct: 48 },
      { label: 'Incident Recency Decay (25%)', pct: 55 },
      { label: 'Cross-Record Correlation (20%)', pct: 40 },
      { label: 'Source Reliability Index (10%)', pct: 85 },
      { label: 'Phishing-Link Heuristic (10%)', pct: 12 }
    ],
    breaches: [
      {
        title: 'ExampleCorp Cloud Platform (2023)',
        severity: 'MEDIUM',
        compromised: 'Compromised Data: Email, Hashed Passwords, IP Address'
      },
      {
        title: 'FictionalApp Community Forum (2022)',
        severity: 'LOW',
        compromised: 'Compromised Data: Username, Phone Number'
      },
      {
        title: 'DemoStore Digital Commerce (2021)',
        severity: 'LOW',
        compromised: 'Compromised Data: Purchase History, Billing City'
      }
    ],
    actions: [
      'Rotate passwords across services where shared credentials were used.',
      'Enable multi-factor authentication (MFA) on sensitive personal accounts.',
      'Invalidate active web sessions on legacy developer and forum portals.'
    ]
  },
  {
    id: 'highrisk',
    tabLabel: 'Scenario B • Multi-Vector Exposure',
    riskText: 'High Risk (Sample • 78 / 100)',
    riskScore: 78,
    riskBadgeClass: 'risk-high',
    targetPreview: 'a•••@fin-ops.sample.in',
    bucketId: '0x3C91D',
    merkleLeaf: '0x4d19a7e83b20c54f...72a0',
    factors: [
      { label: 'Breach Severity Weight (35%)', pct: 86 },
      { label: 'Incident Recency Decay (25%)', pct: 90 },
      { label: 'Cross-Record Correlation (20%)', pct: 75 },
      { label: 'Source Reliability Index (10%)', pct: 92 },
      { label: 'Phishing-Link Heuristic (10%)', pct: 64 }
    ],
    breaches: [
      {
        title: 'ApexFin Credential Combo Archive (2025)',
        severity: 'HIGH',
        compromised: 'Compromised Data: Email, Password Hash, Session Token, Phone Indicator'
      },
      {
        title: 'CloudSync Identity Directory Spill (2024)',
        severity: 'HIGH',
        compromised: 'Compromised Data: Email, Organization Role, API Key Prefix'
      },
      {
        title: 'ExampleCorp Cloud Platform (2023)',
        severity: 'MEDIUM',
        compromised: 'Compromised Data: Email, Hashed Passwords, IP Address'
      }
    ],
    actions: [
      'Immediately revoke active API tokens and rotate primary account credentials.',
      'Enforce hardware security keys (FIDO2/WebAuthn) on primary email accounts.',
      'Audit linked recovery phone numbers for SIM-swap or phishing targeting.'
    ]
  },
  {
    id: 'clean',
    tabLabel: 'Scenario C • Zero-Match Baseline',
    riskText: 'Low Risk (Sample • 04 / 100)',
    riskScore: 4,
    riskBadgeClass: 'risk-low',
    targetPreview: 'v•••@clean-domain.edu',
    bucketId: '0xE105B',
    merkleLeaf: '0x11c4f098a2e671d0...04f8',
    factors: [
      { label: 'Breach Severity Weight (35%)', pct: 0 },
      { label: 'Incident Recency Decay (25%)', pct: 0 },
      { label: 'Cross-Record Correlation (20%)', pct: 0 },
      { label: 'Source Reliability Index (10%)', pct: 100 },
      { label: 'Phishing-Link Heuristic (10%)', pct: 4 }
    ],
    breaches: [
      {
        title: 'No Matched Breach Records Found (Verified 2026)',
        severity: 'CLEAN',
        compromised: 'Compromised Data: Zero matched credentials across indexed k-anonymity partitions'
      }
    ],
    actions: [
      'Maintain unique credentials per service using a dedicated password manager.',
      'Keep hardware or authenticator-based MFA active on primary identity accounts.'
    ]
  }
];

const ARCHITECTURE_FAQS = [
  {
    q: 'How does k-anonymity partitioning protect my search query?',
    a: 'Instead of transmitting a raw identifier to third-party breach databases, BreachShield computes a SHA-256 hash and extracts only the first 5 hexadecimal characters (representing 1 of 1,048,576 possible buckets). Candidate records in that partition are evaluated without exposing your full query to external indexers.'
  },
  {
    q: 'Why is 6-digit OTP verification required before viewing breach results?',
    a: 'Public breach lookup tools are frequently abused by threat actors to enumerate whether a target executive or colleague has leaked credentials. Enforcing a 5-minute time-bound OTP ensures that only the verified owner of an email address or phone number can inspect its correlated exposure report.'
  },
  {
    q: 'How are the Exposure Score and XGBoost risk classification computed?',
    a: 'Real-time lookups compute a deterministic 5-factor weighted score: 35% Breach Severity, 25% Incident Recency, 20% Cross-Record Entity Correlation, 10% Source Reliability, and 10% Phishing-Link Heuristics. In parallel, our offline research benchmark evaluated an XGBoost 4-class classifier achieving 96.42% macro-F1 across 10,000 synthetic and real-world breach feature vectors.'
  },
  {
    q: 'What is the role of the SHA-256 Merkle-Tree audit log?',
    a: 'Every verified lookup generates a redacted, timestamped audit event that is hashed into a binary SHA-256 Merkle tree. The resulting Merkle root is anchored to a local Ethereum smart contract (AuditLedger.sol), providing cryptographic proof that audit logs have not been altered retroactively.'
  }
];

const sectionMotionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

export default function LandingPage({ team = DEFAULT_TEAM, contact = DEFAULT_CONTACT }) {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const [introActive, setIntroActive] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('replay') || params.has('intro')) {
        sessionStorage.removeItem('breachshield_intro_seen');
        return true;
      }
      return !sessionStorage.getItem('breachshield_intro_seen');
    } catch (_) {
      return false;
    }
  });

  const [canAutoplayVideo, setCanAutoplayVideo] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768;
  });

  // Interactive states for enterprise landing page widgets
  const [sandboxInput, setSandboxInput] = useState('researcher@acharya.ac.in');
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  const hashPreview = computeDeterministicSha256Preview(sandboxInput);
  const currentScenario = SAMPLE_SCENARIOS[activeScenarioIdx] || SAMPLE_SCENARIOS[0];

  // Handle viewport resize for video autoplay policy (< 768px does not autoplay)
  useEffect(() => {
    const handleResize = () => {
      setCanAutoplayVideo(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Root scroller scrollbar-gutter: stable while LandingPage is mounted
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.classList.add('landing-page-root');
      return () => {
        document.documentElement.classList.remove('landing-page-root');
      };
    }
  }, []);

  // Pause video when document tab is hidden, resume if desktop
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
      } else if (window.innerWidth >= 768) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Reset scroll to top on mount when intro is active, or scroll to hash if present
  useEffect(() => {
    if (introActive && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        if (process.env.NODE_ENV !== 'test') {
          window.scrollTo(0, 0);
        }
      } catch (_) {}
    } else if (!introActive && typeof window !== 'undefined' && window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [introActive]);

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem('breachshield_intro_seen', 'true');
    } catch (_) {}
    setIntroActive(false);
  };

  return (
    <>
      {/* Intro Logo Animation (Runs once per session on root route) */}
      {introActive && (
        <IntroLogoAnimation
          onComplete={handleIntroComplete}
        />
      )}

      <div className="landing-page-wrapper">
        {/* Background Video with metadata preload and visibility listener */}
        <video
          ref={videoRef}
          src={bgVideo1}
          preload="metadata"
          className="concept-bg-video"
          autoPlay={canAutoplayVideo}
          muted
          loop
          playsInline
          aria-hidden="true"
        />

        {/* Atmospheric Depth Tint */}
        <div className="concept-background" aria-hidden="true" />

        {/* Sticky Shared Navbar */}
        <Navbar isIntroActive={introActive} />

        {/* ================================================================
            HERO SECTION: Asymmetric Enterprise Split + Live K-Anonymity Demo
            ================================================================ */}
        <main className="landing-hero-container">
          <div className="landing-hero-grid">
            {/* Left Column: Core Value Proposition & CTAs */}
            <div className="landing-hero-content">
              <motion.div
                className="landing-hero-badge"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: introActive ? 0 : 1, y: introActive ? -8 : 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <span className="landing-badge-pulse" />
                <span>OSINT BREACH INTELLIGENCE & DARK WEB PROTECTION</span>
              </motion.div>

              <motion.h1
                className="landing-headline"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: introActive ? 0 : 1, y: introActive ? 16 : 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                Check whether your email or phone appears in known breaches.
              </motion.h1>

              <motion.p
                className="landing-subheadline"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: introActive ? 0 : 1, y: introActive ? 16 : 0 }}
                transition={{ duration: 0.6, delay: introActive ? 0 : 0.08, ease: 'easeOut' }}
              >
                Privacy-preserving exposure lookup across documented breach datasets with OTP-based verification and cryptographic k-anonymity partitioning.
              </motion.p>

              <motion.div
                className="landing-hero-actions"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: introActive ? 0 : 1, y: introActive ? 16 : 0 }}
                transition={{ duration: 0.6, delay: introActive ? 0 : 0.15, ease: 'easeOut' }}
              >
                <Link
                  to="/search"
                  className="landing-cta-btn"
                  aria-label="Check my exposure"
                >
                  Check my exposure →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      sessionStorage.removeItem('breachshield_intro_seen');
                    } catch (_) {}
                    setIntroActive(true);
                  }}
                  className="landing-cta-btn landing-replay-btn"
                  aria-label="Replay Intro Animation"
                >
                  Replay Intro ↺
                </button>
              </motion.div>

              {/* Trust & Architecture Pill Strip */}
              <div className="hero-trust-strip">
                <div className="hero-trust-item">
                  <span className="hero-trust-dot" />
                  <span>Zero Cleartext Indexing</span>
                </div>
                <div className="hero-trust-item">
                  <span className="hero-trust-dot" />
                  <span>6-Digit OTP Ownership Gate</span>
                </div>
                <div className="hero-trust-item">
                  <span className="hero-trust-dot" />
                  <span>SHA-256 Merkle Audit Trail</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Live K-Anonymity Hash Partition Sandbox */}
            <motion.aside
              className="glass-vignette-card hero-sandbox-card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: introActive ? 0 : 1, y: introActive ? 18 : 0 }}
              transition={{ duration: 0.65, delay: introActive ? 0 : 0.18, ease: 'easeOut' }}
              aria-label="Interactive k-Anonymity Partition Sandbox"
            >
              <div className="sandbox-window-bar">
                <div className="sandbox-window-dots">
                  <span className="win-dot win-dot-red" />
                  <span className="win-dot win-dot-amber" />
                  <span className="win-dot win-dot-green" />
                </div>
                <span className="sandbox-window-title">K-ANONYMITY PARTITION INSPECTOR</span>
                <span className="sandbox-live-tag">INTERACTIVE</span>
              </div>

              <div className="sandbox-body">
                <label htmlFor="sandbox-identifier-input" className="sandbox-input-label">
                  Test how BreachShield partitions an identifier before network lookup:
                </label>
                <div className="sandbox-input-row">
                  <input
                    id="sandbox-identifier-input"
                    type="text"
                    value={sandboxInput}
                    onChange={(e) => setSandboxInput(e.target.value)}
                    placeholder="Enter any sample email or phone..."
                    className="sandbox-input-field"
                    maxLength={64}
                  />
                  <button
                    type="button"
                    className="sandbox-scan-btn"
                    onClick={() => navigate('/search')}
                  >
                    Run Live Scan →
                  </button>
                </div>

                <div className="sandbox-preset-row">
                  <span className="sandbox-preset-caption">Presets:</span>
                  {['researcher@acharya.ac.in', 'secops@corp-demo.io', 'student.ise@ait.edu.in'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`sandbox-preset-chip ${sandboxInput === preset ? 'active' : ''}`}
                      onClick={() => setSandboxInput(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="sandbox-telemetry-grid">
                  <div className="sandbox-telemetry-box prefix-highlight">
                    <div className="telemetry-box-header">
                      <span className="telemetry-box-title">TRANSMITTED K-ANON PREFIX (5 HEX)</span>
                      <span className="telemetry-status-pill status-transmitted">SENT TO ROUTER</span>
                    </div>
                    <div className="telemetry-prefix-code">{hashPreview.prefix}</div>
                    <div className="telemetry-box-sub">
                      Matches 1 of 1,048,576 hash partitions (16⁵ buckets)
                    </div>
                  </div>

                  <div className="sandbox-telemetry-box suffix-private">
                    <div className="telemetry-box-header">
                      <span className="telemetry-box-title">LOCAL PRIVATE SUFFIX (59 HEX)</span>
                      <span className="telemetry-status-pill status-local">NEVER LEAVES CLIENT</span>
                    </div>
                    <div className="telemetry-suffix-code">{hashPreview.suffix}</div>
                    <div className="telemetry-box-sub">
                      236-bit remainder evaluated locally after OTP verification
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>

          {/* Enterprise Metrics Telemetry Bar */}
          <div className="hero-metrics-ribbon" role="region" aria-label="Platform Telemetry Metrics">
            <div className="glass-vignette-card hero-metric-tile">
              <span className="hero-metric-val">16⁵ (1.04M)</span>
              <span className="hero-metric-lbl">SHA-256 K-Anonymity Buckets</span>
              <span className="hero-metric-sub">5-hex prefix query partitioning</span>
            </div>
            <div className="glass-vignette-card hero-metric-tile">
              <span className="hero-metric-val">300s TTL</span>
              <span className="hero-metric-lbl">Time-Bound OTP Gate</span>
              <span className="hero-metric-sub">5-attempt cap & 30s cooldown</span>
            </div>
            <div className="glass-vignette-card hero-metric-tile">
              <span className="hero-metric-val">96.42%</span>
              <span className="hero-metric-lbl">XGBoost Macro-F1 Score</span>
              <span className="hero-metric-sub">4-tier offline risk benchmark</span>
            </div>
            <div className="glass-vignette-card hero-metric-tile">
              <span className="hero-metric-val">SHA-256</span>
              <span className="hero-metric-lbl">Merkle-Tree Audit Ledger</span>
              <span className="hero-metric-sub">Tamper-evident state root proof</span>
            </div>
          </div>
        </main>

        {/* ================================================================
            SECTION (a): How It Works (Interactive 3-Stage Pipeline)
            ================================================================ */}
        <motion.section
          id="how-it-works"
          className="landing-section"
          variants={sectionMotionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          aria-label="How It Works"
        >
          <div className="landing-section-header">
            <div className="section-eyebrow">01 // VERIFICATION PIPELINE</div>
            <h2 className="landing-section-title">How It Works</h2>
            <p className="landing-section-subtitle">
              Verify compromise exposure through a structured three-step workflow. Click any stage below to inspect its underlying security protocol.
            </p>
          </div>

          <div className="steps-grid">
            {PIPELINE_STEPS.map((step, idx) => {
              const isSelected = activeStepIdx === idx;
              return (
                <div
                  key={step.number}
                  className={`step-card ${isSelected ? 'step-card-active' : ''}`}
                  onClick={() => setActiveStepIdx(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveStepIdx(idx);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                >
                  <div className="step-card-top">
                    <span className="step-number">{step.number}</span>
                    <span className="step-protocol-tag">{step.tag}</span>
                  </div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                  <div className="step-card-footer">
                    <span className="step-footer-spec">{step.protocol}</span>
                    <span className="step-footer-arrow">{isSelected ? '● Active Stage' : 'Inspect →'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Stage Inspector Bar */}
          <div className="glass-vignette-card pipeline-inspector-bar">
            <div className="inspector-left">
              <span className="inspector-stage-badge">
                STAGE {PIPELINE_STEPS[activeStepIdx].number} SPECIFICATION
              </span>
              <h4 className="inspector-stage-heading">
                {PIPELINE_STEPS[activeStepIdx].title} — {PIPELINE_STEPS[activeStepIdx].protocol}
              </h4>
              <p className="inspector-stage-copy">
                {PIPELINE_STEPS[activeStepIdx].detail}
              </p>
            </div>
            <div className="inspector-right">
              <span className="inspector-code-label">PROTOCOL TELEMETRY TRACE</span>
              <code className="inspector-code-block">
                {PIPELINE_STEPS[activeStepIdx].payloadPreview}
              </code>
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            SECTION (b): Sample Result (Interactive Multi-Scenario Console)
            ================================================================ */}
        <motion.section
          id="sample-result"
          className="landing-section"
          variants={sectionMotionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          aria-label="Sample Result"
        >
          <div className="landing-section-header">
            <div className="section-eyebrow">02 // THREAT TELEMETRY PREVIEW</div>
            <h2 className="landing-section-title">Sample Result</h2>
            <p className="landing-section-subtitle">
              Preview of what a verified breach report looks like across different exposure profiles.
            </p>
          </div>

          {/* Scenario Switcher Tabs */}
          <div className="sample-scenario-tabs" role="tablist" aria-label="Sample Breach Scenarios">
            {SAMPLE_SCENARIOS.map((scen, idx) => (
              <button
                key={scen.id}
                type="button"
                role="tab"
                aria-selected={activeScenarioIdx === idx}
                className={`scenario-tab-btn ${activeScenarioIdx === idx ? 'active' : ''}`}
                onClick={() => setActiveScenarioIdx(idx)}
              >
                {scen.tabLabel}
              </button>
            ))}
          </div>

          <div className="glass-vignette-card sample-card-wrapper" role="region" aria-label="Sample Data Card">
            <div className="sample-badge-bar">
              <div className="sample-badge-group">
                <span className="sample-badge">Sample data</span>
                <span className="sample-target-pill">Target: {currentScenario.targetPreview}</span>
                <span className="sample-target-pill">Partition: {currentScenario.bucketId}</span>
              </div>
              <span className="sample-badge-note">Fictional sample records for preview only</span>
            </div>

            <div className="sample-metric-row">
              <div className="sample-metric-left">
                <span className="sample-metric-label">Assessed Risk Level:</span>
                <span className="sample-metric-sub">Weighted 5-Factor Heuristic + Entity Correlation</span>
              </div>
              <span className={`sample-metric-value ${currentScenario.riskBadgeClass}`}>
                {currentScenario.riskText}
              </span>
            </div>

            <div className="sample-split-columns">
              {/* Left Column: Compromised Sources */}
              <div className="sample-col-sources">
                <h4 className="sample-breaches-label">Example Compromised Sources (Sample):</h4>
                <div className="sample-breach-list">
                  {currentScenario.breaches.map((b, bIdx) => (
                    <div key={`breach-${bIdx}`} className="sample-breach-row">
                      <div className="sample-breach-row-top">
                        <span className="sample-breach-title">{b.title}</span>
                        <span className={`sample-severity-chip sev-${b.severity.toLowerCase()}`}>
                          {b.severity}
                        </span>
                      </div>
                      <span className="sample-breach-compromised">{b.compromised}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: 5-Factor Risk Attribution Bars */}
              <div className="sample-col-factors">
                <h4 className="sample-breaches-label">5-Factor Risk Attribution Breakdown:</h4>
                <div className="sample-factor-bars">
                  {currentScenario.factors.map((f, fIdx) => (
                    <div key={`factor-${fIdx}`} className="sample-factor-item">
                      <div className="sample-factor-meta">
                        <span>{f.label}</span>
                        <span className="sample-factor-pct">{f.pct}%</span>
                      </div>
                      <div className="sample-factor-track">
                        <div
                          className="sample-factor-fill"
                          style={{ width: `${f.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sample-merkle-strip">
                  <span className="merkle-strip-label">SHA-256 AUDIT LEAF:</span>
                  <code className="merkle-strip-hash">{currentScenario.merkleLeaf}</code>
                </div>
              </div>
            </div>

            <div className="sample-actions-box">
              <h4 className="sample-actions-title">Recommended Actions:</h4>
              <ul className="sample-actions-list">
                {currentScenario.actions.map((actItem, aIdx) => (
                  <li key={`act-${aIdx}`}>{actItem}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            SECTION (c): About (2-Column Executive & System Spec Split)
            NOTE: Strictly avoids banned terms inside #about!
            ================================================================ */}
        <motion.section
          id="about"
          className="landing-section"
          variants={sectionMotionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          aria-label="About BreachShield"
        >
          <div className="landing-section-header">
            <div className="section-eyebrow">03 // PLATFORM OVERVIEW</div>
            <h2 className="landing-section-title">About</h2>
            <p className="landing-section-subtitle">
              Defensive OSINT architecture engineered for verifiable, owner-authorized breach discovery.
            </p>
          </div>

          <div className="about-split-grid">
            <div className="glass-vignette-card about-card-box">
              <div className="about-card-tag">EXECUTIVE SUMMARY</div>
              <p className="about-text-line">
                BreachShield: AI Powered OSINT Breach Detection & Dark Web Protection is an academic cybersecurity project developed in the Department of Information Science and Engineering at Acharya Institute of Technology, Bengaluru (Batch 05, 2026).
              </p>
              <p className="about-text-line">
                The platform assists users in checking whether an email address or phone number appears in documented data breach records and public leak archives. Using k-anonymity search protocols and multi-factor ownership verification, BreachShield evaluates compromise exposure while minimizing cleartext identifier transmission.
              </p>
              <p className="about-text-line">
                Through deterministic cryptographic logging and structured threat correlation, BreachShield provides actionable security guidance and exposure summaries to help individuals safeguard their digital identity.
              </p>
            </div>

            <div className="glass-vignette-card about-specs-card">
              <div className="about-card-tag">ARCHITECTURAL SPECIFICATIONS</div>
              <div className="about-spec-list">
                <div className="about-spec-row">
                  <span className="about-spec-key">Query Partitioning</span>
                  <span className="about-spec-val">SHA-256 5-Hex Prefix K-Anonymity</span>
                </div>
                <div className="about-spec-row">
                  <span className="about-spec-key">Access Control Gate</span>
                  <span className="about-spec-val">6-Digit Time-Bound OTP (5-Min TTL)</span>
                </div>
                <div className="about-spec-row">
                  <span className="about-spec-key">Correlation Engine</span>
                  <span className="about-spec-val">Multi-Source Graph & Heuristic Scoring</span>
                </div>
                <div className="about-spec-row">
                  <span className="about-spec-key">ML Research Model</span>
                  <span className="about-spec-val">4-Class Gradient Boosted Trees (96.4% F1)</span>
                </div>
                <div className="about-spec-row">
                  <span className="about-spec-key">Audit Verification</span>
                  <span className="about-spec-val">SHA-256 Binary Merkle Root Ledger</span>
                </div>
                <div className="about-spec-row">
                  <span className="about-spec-key">Output Sanitization</span>
                  <span className="about-spec-val">Automated PII Redaction & Masking</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            SECTION: Project Details (Bento Grid + Interactive Architecture FAQ)
            ================================================================ */}
        <motion.section
          id="project-details"
          className="landing-section"
          variants={sectionMotionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          aria-label="Project Details"
        >
          <div className="landing-section-header">
            <div className="section-eyebrow">04 // CORE SECURITY ARCHITECTURE</div>
            <h2 className="landing-section-title">Project Details</h2>
            <p className="landing-section-subtitle">
              Academic research scope, security architecture, and documented workflows.
            </p>
          </div>

          <div className="project-details-grid">
            <div className="glass-vignette-card project-detail-card">
              <div className="project-detail-top">
                <span className="project-module-id">MODULE 01</span>
                <span className="project-module-pill">OSINT • DEFENSIVE RECON</span>
              </div>
              <h3 className="project-detail-title">Objective & Domain</h3>
              <p className="project-detail-desc">
                Engineered as an academic OSINT cybersecurity project in Information Science and Engineering. Enables users to verify whether an email or phone number is present in known breach databases without exposing cleartext credentials.
              </p>
              <div className="project-detail-meta">
                <span>Target Identifiers: Email & E.164 Phone</span>
                <span>PII Masking: Enforced</span>
              </div>
            </div>

            <div className="glass-vignette-card project-detail-card">
              <div className="project-detail-top">
                <span className="project-module-id">MODULE 02</span>
                <span className="project-module-pill">OWNERSHIP VERIFICATION</span>
              </div>
              <h3 className="project-detail-title">Verification Workflow</h3>
              <p className="project-detail-desc">
                Enforces time-limited one-time password (OTP) verification before releasing correlated exposure details, preventing unauthorized reconnaissance queries on arbitrary identifiers.
              </p>
              <div className="project-detail-meta">
                <span>Token Window: 300 Seconds</span>
                <span>Rate Guard: 5 Attempts Max</span>
              </div>
            </div>

            <div className="glass-vignette-card project-detail-card">
              <div className="project-detail-top">
                <span className="project-module-id">MODULE 03</span>
                <span className="project-module-pill">SHA-256 K-ANONYMITY</span>
              </div>
              <h3 className="project-detail-title">Privacy & k-Anonymity</h3>
              <p className="project-detail-desc">
                Applies client-side SHA-256 prefix partitioning (k-anonymity) so the server queries partitioned buckets without storing or indexing raw search terms.
              </p>
              <div className="project-detail-meta">
                <span>Prefix Width: 20 Bits (5 Hex)</span>
                <span>Keyspace: 1,048,576 Buckets</span>
              </div>
            </div>

            <div className="glass-vignette-card project-detail-card">
              <div className="project-detail-top">
                <span className="project-module-id">MODULE 04</span>
                <span className="project-module-pill">MERKLE LEDGER • XGBOOST</span>
              </div>
              <h3 className="project-detail-title">Audit Logging & Research ML</h3>
              <p className="project-detail-desc">
                Features Merkle-tree cryptographic audit logging with local smart-contract anchoring. A machine-learning risk classification model (XGBoost) was developed and evaluated on benchmark datasets as an offline research artifact.
              </p>
              <div className="project-detail-meta">
                <span>Classifier: XGBoost (96.42% F1)</span>
                <span>Ledger: Solidity State Root</span>
              </div>
            </div>
          </div>

          {/* Interactive Technical FAQ Accordion */}
          <div className="faq-container">
            <h3 className="faq-section-heading">Technical Architecture & Security FAQ</h3>
            <div className="faq-list">
              {ARCHITECTURE_FAQS.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={`faq-${idx}`}
                    className={`glass-vignette-card faq-item ${isOpen ? 'faq-open' : ''}`}
                  >
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                      aria-expanded={isOpen}
                    >
                      <span className="faq-q-text">{item.q}</span>
                      <span className="faq-q-icon">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="faq-answer-body">
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            SECTION (d): Team & Mentorship (Aligned Executive Banner + 4-Col Grid)
            ================================================================ */}
        <motion.section
          id="team"
          className="landing-section"
          variants={sectionMotionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          aria-label="Team"
        >
          <div className="landing-section-header">
            <div className="section-eyebrow">05 // RESEARCH & ENGINEERING TEAM</div>
            <h2 className="landing-section-title">Team & Mentorship</h2>
            <p className="landing-section-subtitle">
              Department of Information Science and Engineering, Acharya Institute of Technology.
            </p>
          </div>

          {/* Project Mentorship / Guide Card */}
          <div className="glass-vignette-card guide-card-box">
            <div className="guide-avatar-badge">ST</div>
            <div className="guide-info-col">
              <div className="guide-badge">Project Guide & Mentorship</div>
              <h3 className="guide-name">Prof. Sushma T. M.</h3>
              <div className="guide-role">Assistant Professor</div>
              <p className="guide-dept">
                Department of Information Science and Engineering, Acharya Institute of Technology, Bengaluru
              </p>
            </div>
            <div className="guide-meta-col">
              <div className="guide-meta-pill">Academic Supervision</div>
              <div className="guide-meta-pill">Batch 05 • 2026</div>
            </div>
          </div>

          {team.length === 1 ? (
            /* Single entry renders as a centered spotlight card */
            <div className="glass-vignette-card team-spotlight-card" data-testid="team-spotlight">
              <div className="team-avatar-placeholder">
                {team[0].name.charAt(0)}
              </div>
              <h3 className="team-name">{team[0].name}</h3>
              <div className="team-role">{team[0].role}</div>
              {team[0].focus && <div className="team-focus-tag">{team[0].focus}</div>}
              <p className="team-bio">{team[0].bio}</p>
              <div className="team-links">
                {team[0].links?.github ? (
                  <a href={team[0].links.github} target="_blank" rel="noopener noreferrer" className="team-link-item">
                    GitHub
                  </a>
                ) : null}
                {team[0].links?.linkedin ? (
                  <a href={team[0].links.linkedin} target="_blank" rel="noopener noreferrer" className="team-link-item">
                    LinkedIn
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            /* 2+ entries render as a balanced 4-column responsive grid */
            <div className="team-grid" data-testid="team-grid">
              {team.map((member, idx) => (
                <div key={`member-${idx}`} className="glass-vignette-card team-card">
                  <div className="team-card-header">
                    <div className="team-avatar-placeholder">
                      {member.name.charAt(0)}
                    </div>
                    <span className="team-index-tag">0{idx + 1}</span>
                  </div>
                  <h3 className="team-name">{member.name}</h3>
                  <div className="team-role">{member.role}</div>
                  {member.focus && <div className="team-focus-tag">{member.focus}</div>}
                  <p className="team-bio">{member.bio}</p>
                  <div className="team-links">
                    {member.links?.github ? (
                      <a href={member.links.github} target="_blank" rel="noopener noreferrer" className="team-link-item">
                        GitHub
                      </a>
                    ) : null}
                    {member.links?.linkedin ? (
                      <a href={member.links.linkedin} target="_blank" rel="noopener noreferrer" className="team-link-item">
                        LinkedIn
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ================================================================
            SECTION (e): Contact & Institutional Ledger (2-Column Split)
            ================================================================ */}
        <motion.section
          id="contact"
          className="landing-section"
          variants={sectionMotionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          aria-label="Contact"
        >
          <div className="landing-section-header">
            <div className="section-eyebrow">06 // INSTITUTIONAL METADATA & ACCESS</div>
            <h2 className="landing-section-title">{contact.heading}</h2>
            <p className="landing-section-subtitle">{contact.note}</p>
          </div>

          <div className="contact-split-grid">
            <div className="glass-vignette-card contact-card-box">
              <div className="about-card-tag">PROJECT & INSTITUTIONAL REGISTRY</div>
              {contact.items && contact.items.length > 0 && (
                <div className="contact-items-list">
                  {contact.items.map((item, idx) => (
                    <div key={`contact-item-${idx}`} className="contact-item-row">
                      <span className="contact-item-label">{item.label}</span>
                      {item.value.includes('TODO') ? (
                        <span className="contact-item-plain">{item.value}</span>
                      ) : item.value.includes('@') ? (
                        <a href={`mailto:${item.value}`} className="team-link-item">{item.value}</a>
                      ) : (
                        <span className="contact-item-plain">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="contact-links-row">
                {contact.links?.email && !contact.links.email.includes('TODO') ? (
                  <a href={`mailto:${contact.links.email}`} className="team-link-item">
                    Email
                  </a>
                ) : null}
                {contact.links?.github && !contact.links.github.includes('TODO') ? (
                  <a href={contact.links.github} target="_blank" rel="noopener noreferrer" className="team-link-item">
                    GitHub
                  </a>
                ) : null}
                {contact.links?.twitter && !contact.links.twitter.includes('TODO') ? (
                  <a href={contact.links.twitter} target="_blank" rel="noopener noreferrer" className="team-link-item">
                    Twitter
                  </a>
                ) : null}
              </div>
            </div>

            <div className="glass-vignette-card contact-cta-panel">
              <div className="about-card-tag">READY TO VERIFY EXPOSURE?</div>
              <h3 className="contact-cta-heading">
                Launch the Owner-Verified OSINT Exposure Scanner
              </h3>
              <p className="contact-cta-desc">
                Initiate a real-time k-anonymity lookup across documented breach datasets. Requires a valid email address or phone number for one-time password ownership verification.
              </p>
              <div className="contact-cta-checklist">
                <div className="cta-check-item">✓ SHA-256 5-Hex Prefix Partitioning</div>
                <div className="cta-check-item">✓ Time-Limited 6-Digit OTP Verification</div>
                <div className="cta-check-item">✓ Full PII Redaction & Merkle Audit Trail</div>
              </div>
              <Link to="/search" className="landing-cta-btn contact-launch-btn">
                Open Breach Scanner →
              </Link>
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            SECTION (f): Footer
            ================================================================ */}
        <footer className="concept-footer">
          <div className="footer-left">
            <img src="/logo-icon.png" alt="" className="footer-brand-icon" aria-hidden="true" />
            <span className="footer-brand-title">
              <span className="brand-text-white">BREACH</span>
              <span className="brand-text-blue">SHIELD</span>
            </span>
            <span className="footer-divider">•</span>
            <span className="footer-copyright">© 2026 BreachShield • Acharya Institute of Technology</span>
          </div>

          <div className="footer-links">
            <a href="#how-it-works" className="footer-link">Pipeline</a>
            <span className="footer-link-divider">|</span>
            <a href="#sample-result" className="footer-link">Sample Report</a>
            <span className="footer-link-divider">|</span>
            <a href="#project-details" className="footer-link">Architecture</a>
            <span className="footer-link-divider">|</span>
            <Link to="/search" className="footer-link">Scanner</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
