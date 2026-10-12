import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
    bio: "Dept. of Information Science and Engineering (USN: 1AY24IS400)",
    links: {
      github: "",
      linkedin: ""
    }
  },
  {
    name: "Girishkumar N M",
    role: "Project Member",
    bio: "Dept. of Information Science and Engineering (USN: 1AY24IS404)",
    links: {
      github: "",
      linkedin: ""
    }
  },
  {
    name: "Manoj",
    role: "Project Member",
    bio: "Dept. of Information Science and Engineering (USN: 1AY24IS406)",
    links: {
      github: "",
      linkedin: ""
    }
  },
  {
    name: "Premkumar Teli",
    role: "Project Member",
    bio: "Dept. of Information Science and Engineering (USN: 1AY24IS407)",
    links: {
      github: "",
      linkedin: ""
    }
  }
];

export const DEFAULT_CONTACT = {
  heading: "Contact",
  note: "[TODO: Project contact and institutional inquiries]",
  items: [
    { label: "Institution", value: "Acharya Institute of Technology, Bengaluru" },
    { label: "Department", value: "Department of Information Science and Engineering" },
    { label: "Project Title", value: "BreachShield: AI Powered OSINT Breach Detection & Dark Web Protection" },
    { label: "Project Guide", value: "Prof. Sushma T. M., Assistant Professor" },
    { label: "Batch / Group", value: "Batch 05 (2026)" },
    { label: "Security Contact", value: "[TODO: Security contact to be provided]" },
    { label: "General Inquiries", value: "[TODO: General inquiries contact to be provided]" }
  ],
  links: {
    email: "",
    github: "",
    twitter: ""
  }
};

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

  const [introActive, setIntroActive] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !sessionStorage.getItem('breachshield_intro_seen');
    } catch (_) {
      return false;
    }
  });

  const [canAutoplayVideo, setCanAutoplayVideo] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768;
  });

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

        {/* Hero Section */}
        <main className="landing-hero-container">
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
          </motion.div>
        </main>

        {/* Section (a): How It Works */}
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
            <h2 className="landing-section-title">How It Works</h2>
            <p className="landing-section-subtitle">
              Verify compromise exposure through a structured three-step workflow.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <h3 className="step-title">Enter Identifier</h3>
              <p className="step-desc">
                Provide an email address or phone number to initiate an exposure inquiry across documented breach archives.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">02</span>
              <h3 className="step-title">OTP Ownership Verification</h3>
              <p className="step-desc">
                Confirm ownership with a time-limited one-time password to ensure breach results are accessed only by authorized owners.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">03</span>
              <h3 className="step-title">Privacy-Aware Lookup & Remediation</h3>
              <p className="step-desc">
                Review heuristic exposure indicators, matched compromised records, and recommended remediation steps.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section (b): Sample Result */}
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
            <h2 className="landing-section-title">Sample Result</h2>
            <p className="landing-section-subtitle">
              Preview of what a verified breach report looks like.
            </p>
          </div>

          <div className="glass-vignette-card sample-card-wrapper" role="region" aria-label="Sample Data Card">
            <div className="sample-badge-bar">
              <span className="sample-badge">Sample data</span>
              <span className="sample-badge-note">Fictional sample records for preview only</span>
            </div>

            <div className="sample-metric-row">
              <span className="sample-metric-label">Assessed Risk Level:</span>
              <span className="sample-metric-value">Medium Risk (Sample • 42 / 100)</span>
            </div>

            <h4 className="sample-breaches-label">Example Compromised Sources (Sample):</h4>
            <div className="sample-breach-list">
              <div className="sample-breach-row">
                <span className="sample-breach-title">ExampleCorp Cloud Platform (2023)</span>
                <span className="sample-breach-compromised">Compromised Data: Email, Hashed Passwords, IP Address</span>
              </div>
              <div className="sample-breach-row">
                <span className="sample-breach-title">FictionalApp Community Forum (2022)</span>
                <span className="sample-breach-compromised">Compromised Data: Username, Phone Number</span>
              </div>
              <div className="sample-breach-row">
                <span className="sample-breach-title">DemoStore Digital Commerce (2021)</span>
                <span className="sample-breach-compromised">Compromised Data: Purchase History, Billing City</span>
              </div>
            </div>

            <div className="sample-actions-box">
              <h4 className="sample-actions-title">Recommended Actions:</h4>
              <ul className="sample-actions-list">
                <li>Rotate passwords across services where shared credentials were used.</li>
                <li>Enable multi-factor authentication (MFA) on sensitive personal accounts.</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Section (c): About */}
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
            <h2 className="landing-section-title">About</h2>
          </div>

          <div className="glass-vignette-card about-card-box">
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
        </motion.section>

        {/* Section: Project Details */}
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
            <h2 className="landing-section-title">Project Details</h2>
            <p className="landing-section-subtitle">
              Academic research scope, security architecture, and documented workflows.
            </p>
          </div>

          <div className="project-details-grid">
            <div className="glass-vignette-card project-detail-card">
              <h3 className="project-detail-title">Objective & Domain</h3>
              <p className="project-detail-desc">
                Engineered as an academic OSINT cybersecurity project in Information Science and Engineering. Enables users to verify whether an email or phone number is present in known breach databases without exposing cleartext credentials.
              </p>
            </div>
            <div className="glass-vignette-card project-detail-card">
              <h3 className="project-detail-title">Verification Workflow</h3>
              <p className="project-detail-desc">
                Enforces time-limited one-time password (OTP) verification before releasing correlated exposure details, preventing unauthorized reconnaissance queries on arbitrary identifiers.
              </p>
            </div>
            <div className="glass-vignette-card project-detail-card">
              <h3 className="project-detail-title">Privacy & k-Anonymity</h3>
              <p className="project-detail-desc">
                Applies client-side SHA-256 prefix partitioning (k-anonymity) so the server queries partitioned buckets without storing or indexing raw search terms.
              </p>
            </div>
            <div className="glass-vignette-card project-detail-card">
              <h3 className="project-detail-title">Audit Logging & Research ML</h3>
              <p className="project-detail-desc">
                Features Merkle-tree cryptographic audit logging with local smart-contract anchoring. A machine-learning risk classification model (XGBoost) was developed and evaluated on benchmark datasets as an offline research artifact.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section (d): Team & Guide */}
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
            <h2 className="landing-section-title">Team & Mentorship</h2>
            <p className="landing-section-subtitle">
              Department of Information Science and Engineering, Acharya Institute of Technology.
            </p>
          </div>

          {/* Project Mentorship / Guide Card */}
          <div className="glass-vignette-card guide-card-box">
            <div className="guide-badge">Project Guide & Mentorship</div>
            <h3 className="guide-name">Prof. Sushma T. M.</h3>
            <div className="guide-role">Assistant Professor</div>
            <p className="guide-dept">
              Department of Information Science and Engineering, Acharya Institute of Technology, Bengaluru
            </p>
          </div>

          {team.length === 1 ? (
            /* Single entry renders as a centered spotlight card */
            <div className="glass-vignette-card team-spotlight-card" data-testid="team-spotlight">
              <div className="team-avatar-placeholder">
                {team[0].name.charAt(0)}
              </div>
              <h3 className="team-name">{team[0].name}</h3>
              <div className="team-role">{team[0].role}</div>
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
            /* 2+ entries render as a responsive grid */
            <div className="team-grid" data-testid="team-grid">
              {team.map((member, idx) => (
                <div key={`member-${idx}`} className="glass-vignette-card team-card">
                  <div className="team-avatar-placeholder">
                    {member.name.charAt(0)}
                  </div>
                  <h3 className="team-name">{member.name}</h3>
                  <div className="team-role">{member.role}</div>
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

        {/* Section (e): Contact */}
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
            <h2 className="landing-section-title">{contact.heading}</h2>
          </div>

          <div className="glass-vignette-card contact-card-box">
            <p className="todo-text-line">{contact.note}</p>
            {contact.items && contact.items.length > 0 && (
              <div className="contact-items-list">
                {contact.items.map((item, idx) => (
                  <div key={`contact-item-${idx}`} className="contact-item-row">
                    <span className="contact-item-label">{item.label}:</span>
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
        </motion.section>

        {/* Section (f): Footer */}
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
            <a href="#privacy" className="footer-link">Privacy Policy</a>
            <span className="footer-link-divider">|</span>
            <a href="#terms" className="footer-link">Terms of Use</a>
            <span className="footer-link-divider">|</span>
            <a href="#disclaimer" className="footer-link">Disclaimer</a>
          </div>
        </footer>
      </div>
    </>
  );
}
