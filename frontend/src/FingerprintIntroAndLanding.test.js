import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage, { DEFAULT_TEAM, DEFAULT_CONTACT } from './pages/LandingPage';
import IntroLogoAnimation from './components/IntroLogoAnimation';
import { FINGERPRINT_RIDGES, FINGERPRINT_FRAGMENTS } from './components/fingerprintPaths';

describe('BreachShield Fingerprint Intro, Grid Removal, and Landing Page Verification', () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  });

  afterEach(() => {
    sessionStorage.clear();
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  });

  // -------------------------------------------------------------------------
  // 1. Sequential Fingerprint Ridge Drawing & Vector Geometry
  // -------------------------------------------------------------------------
  test('(1) Fingerprint SVG renders with real ridge curves and strokeDasharray offsets', () => {
    const onComplete = jest.fn();
    const { container } = render(
      <MemoryRouter>
        <IntroLogoAnimation onComplete={onComplete} />
      </MemoryRouter>
    );

    const svg = container.querySelector('.intro-fingerprint-svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 409 409');

    const ridgePaths = container.querySelectorAll('.intro-ridge-path');
    expect(ridgePaths.length).toBe(FINGERPRINT_RIDGES.length);
    expect(ridgePaths.length).toBeGreaterThanOrEqual(20);

    // Verify first ridge has real length dasharray and initial non-zero offset
    const firstRidge = ridgePaths[0];
    expect(firstRidge).toHaveAttribute('stroke-width', '6');
    expect(firstRidge.style.strokeDasharray).toBeTruthy();
    expect(firstRidge.style.strokeDashoffset).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // 2. Controlled Fragmentation & Geometric Data Pieces
  // -------------------------------------------------------------------------
  test('(2) Fragment vector elements exist and are positioned across data coordinates', () => {
    const onComplete = jest.fn();
    const { container } = render(
      <MemoryRouter>
        <IntroLogoAnimation onComplete={onComplete} />
      </MemoryRouter>
    );

    const fragPaths = container.querySelectorAll('.intro-fragment-path');
    expect(fragPaths.length).toBe(FINGERPRINT_FRAGMENTS.length);
    expect(fragPaths.length).toBeGreaterThanOrEqual(8);

    // Initial opacity is 0 before fragmentation step
    fragPaths.forEach((frag) => {
      expect(frag).toHaveStyle({ opacity: 0 });
    });
  });

  // -------------------------------------------------------------------------
  // 3. Wordmark Continuous Character Order & Brand Styling
  // -------------------------------------------------------------------------
  test('(3) Wordmark reveals exact character order B-R-E-A-C-H-S-H-I-E-L-D without inversion', () => {
    const onComplete = jest.fn();
    const { container } = render(
      <MemoryRouter>
        <IntroLogoAnimation onComplete={onComplete} />
      </MemoryRouter>
    );

    const wordmark = container.querySelector('.intro-dock-wordmark');
    expect(wordmark).toBeInTheDocument();
    expect(wordmark).toHaveAttribute('aria-label', 'BreachShield');

    const letters = container.querySelectorAll('.intro-letter');
    expect(letters.length).toBe(12);

    const fullWord = Array.from(letters).map((el) => el.textContent).join('');
    expect(fullWord).toBe('BREACHSHIELD');

    // BREACH must precede SHIELD in the DOM hierarchy
    const whiteWord = container.querySelector('.intro-word-white');
    const blueWord = container.querySelector('.intro-word-blue');
    expect(whiteWord.textContent).toBe('BREACH');
    expect(blueWord.textContent).toBe('SHIELD');
    expect(whiteWord.compareDocumentPosition(blueWord) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // 4. Logo Asset Consistency & Navbar Parity
  // -------------------------------------------------------------------------
  test('(4) Intro and Navbar both use identical logo asset (/logo-icon-mark.png)', () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const logos = container.querySelectorAll('img[src="/logo-icon-mark.png"]');
    expect(logos.length).toBeGreaterThanOrEqual(2);
    expect(logos[0].getAttribute('src')).toBe('/logo-icon-mark.png');
    expect(logos[1].getAttribute('src')).toBe('/logo-icon-mark.png');
  });

  // -------------------------------------------------------------------------
  // 5. Skip Button & Scroll Lock Restoration
  // -------------------------------------------------------------------------
  test('(5) Skip Intro button terminates overlay immediately and restores scroll lock', () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(container.querySelector('.intro-container')).toBeInTheDocument();
    const skipBtn = screen.getByRole('button', { name: /Skip Intro Animation/i });
    expect(skipBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(skipBtn);
    });

    expect(sessionStorage.getItem('breachshield_intro_seen')).toBe('true');
    expect(container.querySelector('.intro-container')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
  });

  // -------------------------------------------------------------------------
  // 6. Absence of Decorative Grid Backgrounds in Overlay & App
  // -------------------------------------------------------------------------
  test('(6) Decorative grid background pattern is removed from intro overlay background', () => {
    const onComplete = jest.fn();
    const { container } = render(
      <MemoryRouter>
        <IntroLogoAnimation onComplete={onComplete} />
      </MemoryRouter>
    );

    const overlayBg = container.querySelector('.intro-overlay-bg');
    expect(overlayBg).toBeInTheDocument();
    // Verify background does not have inline linear-gradient grid
    expect(overlayBg.style.backgroundImage).toBe('');
  });

  // -------------------------------------------------------------------------
  // 7. Team Details: All 4 Documented Members & USNs
  // -------------------------------------------------------------------------
  test('(7) Team section displays all four verified members with documented USNs', () => {
    sessionStorage.setItem('breachshield_intro_seen', 'true');
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Arvind D H')).toBeInTheDocument();
    expect(screen.getByText('Girishkumar N M')).toBeInTheDocument();
    expect(screen.getByText('Manoj')).toBeInTheDocument();
    expect(screen.getByText('Premkumar Teli')).toBeInTheDocument();

    expect(screen.getByText(/1AY24IS400/i)).toBeInTheDocument();
    expect(screen.getByText(/1AY24IS404/i)).toBeInTheDocument();
    expect(screen.getByText(/1AY24IS406/i)).toBeInTheDocument();
    expect(screen.getByText(/1AY24IS407/i)).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // 8. Project Guide & Mentorship Section
  // -------------------------------------------------------------------------
  test('(8) Guide section displays Prof. Sushma T. M. and Assistant Professor designation', () => {
    sessionStorage.setItem('breachshield_intro_seen', 'true');
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Prof. Sushma T. M.')).toBeInTheDocument();
    expect(screen.getByText('Assistant Professor')).toBeInTheDocument();
    expect(screen.getByText(/Project Guide & Mentorship/i)).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // 9. Factual Copy & Absence of Exaggerated Claims
  // -------------------------------------------------------------------------
  test('(9) Project details and about sections contain documented facts without unsupported claims', () => {
    sessionStorage.setItem('breachshield_intro_seen', 'true');
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const textContent = container.textContent;
    // Check supported technologies
    expect(textContent).toMatch(/k-anonymity/i);
    expect(textContent).toMatch(/OTP/i);
    expect(textContent).toMatch(/Merkle-tree/i);
    expect(textContent).toMatch(/XGBoost/i);
    expect(textContent).toMatch(/Acharya Institute of Technology/i);

    // Verify absence of unsupported / hyperbolic claims
    expect(textContent).not.toMatch(/military-grade/i);
    expect(textContent).not.toMatch(/100% anonymous/i);
    expect(textContent).not.toMatch(/every dark-web source/i);
    expect(textContent).not.toMatch(/guaranteed privacy/i);
  });
});
