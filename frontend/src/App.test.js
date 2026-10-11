import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppRouter, { VerifyOtpRedirect } from './AppRouter';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ScanningPage from './pages/ScanningPage';
import ResultsPage from './pages/ResultsPage';
import Navbar from './components/Navbar';
import { maskIdentifier } from './lib/maskIdentifier';
import api from './lib/api';

jest.mock('./lib/api');

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  jest.clearAllMocks();
});

describe('AppRouter Integration & LandingPage', () => {
  test('(c) "/" renders the landing stub with headline and CTA linking to /search', () => {
    sessionStorage.setItem('breachshield_intro_seen', 'true');
    render(<AppRouter />);
    expect(screen.getByText(/Check whether your email or phone appears in known breaches/i)).toBeInTheDocument();
    const ctaLink = screen.getByRole('link', { name: /Check my exposure/i });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute('href', '/search');
  });

  test('(d) Navbar brand is a Link pointing to "/"', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    const brandLink = screen.getByRole('link', { name: /BreachShield Home/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');
  });

  test('(a) IntroLogoAnimation does not render when sessionStorage flag is set', () => {
    sessionStorage.setItem('breachshield_intro_seen', 'true');
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(container.querySelector('.intro-container')).not.toBeInTheDocument();
    expect(screen.getByText(/Check whether your email or phone appears in known breaches/i)).toBeInTheDocument();
  });

  test('(b) Skip button sets the sessionStorage flag, makes Navbar brand visible, and unmounts the overlay', () => {
    sessionStorage.clear();
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Overlay is present initially
    expect(container.querySelector('.intro-container')).toBeInTheDocument();
    const skipBtn = screen.getByRole('button', { name: /Skip Intro Animation/i });
    expect(skipBtn).toBeInTheDocument();

    // Navbar brand is hidden while intro is active
    const navIcon = container.querySelector('#navbar-brand-icon');
    const navWord = container.querySelector('#navbar-brand-text');
    expect(navIcon).toHaveStyle({ visibility: 'hidden' });
    expect(navWord).toHaveStyle({ visibility: 'hidden' });

    // Click Skip
    fireEvent.click(skipBtn);

    // Flag is set, overlay unmounted, Navbar brand visible
    expect(sessionStorage.getItem('breachshield_intro_seen')).toBe('true');
    expect(container.querySelector('.intro-container')).not.toBeInTheDocument();
    expect(navIcon).toHaveStyle({ visibility: 'visible' });
    expect(navWord).toHaveStyle({ visibility: 'visible' });
    expect(screen.getByText(/Check whether your email or phone appears in known breaches/i)).toBeInTheDocument();
  });

  test('Phase 3 (a): all section ids render in LandingPage', () => {
    sessionStorage.setItem('breachshield_intro_seen', 'true');
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(container.querySelector('#how-it-works')).toBeInTheDocument();
    expect(container.querySelector('#sample-result')).toBeInTheDocument();
    expect(container.querySelector('#about')).toBeInTheDocument();
    expect(container.querySelector('#team')).toBeInTheDocument();
    expect(container.querySelector('#contact')).toBeInTheDocument();
  });

  test('Phase 3 (b): Team array renders 1 entry as spotlight and 2 entries as grid, hiding empty links', () => {
    sessionStorage.setItem('breachshield_intro_seen', 'true');
    
    // 1 member -> spotlight
    const singleTeam = [
      { name: 'Premkumar Teli', role: 'Security Architect', bio: 'Bio test', links: { github: 'https://github.com/premkumarteli', linkedin: '' } }
    ];
    const { rerender } = render(
      <MemoryRouter>
        <LandingPage team={singleTeam} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('team-spotlight')).toBeInTheDocument();
    expect(screen.getByText('Premkumar Teli')).toBeInTheDocument();
    // GitHub link present, LinkedIn link hidden because URL is empty
    expect(screen.getByRole('link', { name: /GitHub/i })).toHaveAttribute('href', 'https://github.com/premkumarteli');
    expect(screen.queryByRole('link', { name: /LinkedIn/i })).not.toBeInTheDocument();

    // 2 members -> grid
    const multiTeam = [
      { name: 'Premkumar Teli', role: 'Security Architect', bio: 'Bio 1', links: { github: '', linkedin: '' } },
      { name: 'Second Member', role: 'Security Engineer', bio: 'Bio 2', links: { github: 'https://github.com/member2', linkedin: '' } }
    ];
    rerender(
      <MemoryRouter>
        <LandingPage team={multiTeam} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('team-grid')).toBeInTheDocument();
    expect(screen.getByText('Premkumar Teli')).toBeInTheDocument();
    expect(screen.getByText('Second Member')).toBeInTheDocument();
  });

  test('Phase 3 (c): sample card contains the text "Sample"', () => {
    sessionStorage.setItem('breachshield_intro_seen', 'true');
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/Sample/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Sample data/i)).toBeInTheDocument();
  });

  test('Phase 3 (d): Navbar links point to the right anchors (#about, #team, #contact)', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /About/i })).toHaveAttribute('href', '#about');
    expect(screen.getByRole('link', { name: /Team/i })).toHaveAttribute('href', '#team');
    expect(screen.getByRole('link', { name: /Contact/i })).toHaveAttribute('href', '#contact');
  });

  test('Phase 2.1/3.1 (a): Navbar and overlay use the same logo src', () => {
    sessionStorage.clear();
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );
    const logos = container.querySelectorAll('img[src="/logo-icon-mark.png"]');
    expect(logos.length).toBeGreaterThanOrEqual(2);
    const overlayLogoSrc = logos[0].getAttribute('src');
    const navbarLogoSrc = logos[1].getAttribute('src');
    expect(overlayLogoSrc).toBe(navbarLogoSrc);
    expect(overlayLogoSrc).toBe('/logo-icon-mark.png');
  });

  test('Phase 2.8: landing-page-root class is added to documentElement on mount and removed on unmount', () => {
    sessionStorage.setItem('breachshield_intro_seen', 'true');
    expect(document.documentElement.classList.contains('landing-page-root')).toBe(false);

    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );
    expect(document.documentElement.classList.contains('landing-page-root')).toBe(true);

    unmount();
    expect(document.documentElement.classList.contains('landing-page-root')).toBe(false);
  });

  test('Phase 2.1/3.1 (b): body scroll is locked while overlay is mounted and restored after Skip', () => {
    sessionStorage.clear();
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );
    expect(document.body.style.overflow).toBe('hidden');

    const skipBtn = screen.getByRole('button', { name: /Skip Intro/i });
    fireEvent.click(skipBtn);

    expect(document.body.style.overflow).toBe('');
  });

  test('Phase 2.1/3.1 (c): About text contains no occurrence of "storing", "compliance", "privacy-first", "encrypt"', () => {
    sessionStorage.setItem('breachshield_intro_seen', 'true');
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );
    const aboutSection = container.querySelector('#about');
    expect(aboutSection).toBeInTheDocument();
    const text = aboutSection.textContent.toLowerCase();
    ['storing', 'compliance', 'privacy-first', 'encrypt'].forEach((term) => {
      expect(text).not.toContain(term);
    });
  });

  test('Phase 2.2: decode rejecting or unavailable still starts the intro sequence without hanging', async () => {
    sessionStorage.clear();
    const origDecode = window.Image.prototype.decode;
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <LandingPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByRole('button', { name: /Skip Intro/i })).toBeInTheDocument();

    if (origDecode) {
      window.Image.prototype.decode = origDecode;
    } else {
      delete window.Image.prototype.decode;
    }
  });

  test('Phase 2.3: no layoutId attribute exists on any element in Intro or Navbar', () => {
    sessionStorage.clear();
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Check across all elements in container for layoutId / layout-id / data-framer-layout-id
    const elementsWithLayoutId = container.querySelectorAll(
      '[layoutid], [layoutId], [data-framer-layout-id], [data-layoutid]'
    );
    expect(elementsWithLayoutId.length).toBe(0);

    // Also verify Navbar standalone
    const { container: navContainer } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    const navLayoutIds = navContainer.querySelectorAll(
      '[layoutid], [layoutId], [data-framer-layout-id], [data-layoutid]'
    );
    expect(navLayoutIds.length).toBe(0);
  });

  test('Phase 2.3/2.4: window width resize mid-intro triggers handleSkip and unmounts intro', () => {
    sessionStorage.clear();
    const originalWidth = window.innerWidth;
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(container.querySelector('.intro-container')).toBeInTheDocument();

    // Trigger window width resize event
    window.innerWidth = originalWidth + 100;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(sessionStorage.getItem('breachshield_intro_seen')).toBe('true');
    expect(container.querySelector('.intro-container')).not.toBeInTheDocument();
    window.innerWidth = originalWidth;
  });

  test('Phase 2.4: height-only resize does not skip intro', () => {
    sessionStorage.clear();
    const originalHeight = window.innerHeight;
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(container.querySelector('.intro-container')).toBeInTheDocument();

    // Trigger height-only resize event (e.g. mobile URL bar)
    window.innerHeight = originalHeight + 200;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // Still running and not skipped
    expect(container.querySelector('.intro-container')).toBeInTheDocument();
    expect(sessionStorage.getItem('breachshield_intro_seen')).toBeNull();
    window.innerHeight = originalHeight;
  });

  test('Phase 2.4b: word containers have clip-path inset(0 100% 0 0) and visibility hidden before wordmark step', () => {
    sessionStorage.clear();
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const wordmark = container.querySelector('.intro-dock-wordmark');
    expect(wordmark).toHaveStyle({ visibility: 'hidden' });

    const wordWhite = container.querySelector('.intro-word-white');
    const wordBlue = container.querySelector('.intro-word-blue');
    expect(wordWhite).toBeInTheDocument();
    expect(wordBlue).toBeInTheDocument();
    expect(wordWhite.style.clipPath).toContain('inset(-24px 100% -24px -24px)');
    expect(wordBlue.style.clipPath).toContain('inset(-24px 100% -24px -24px)');
  });

  test('Phase 2.4: Skip button is absent after the dock starts and absent after completion', () => {
    sessionStorage.clear();
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const skipBtn = screen.getByRole('button', { name: /Skip Intro Animation/i });
    expect(skipBtn).toBeInTheDocument();

    // Trigger Skip
    fireEvent.click(skipBtn);

    // After completion, skip button is absent
    expect(screen.queryByRole('button', { name: /Skip Intro Animation/i })).not.toBeInTheDocument();
    expect(container.querySelector('.intro-skip-btn')).not.toBeInTheDocument();
  });

  test('Phase 2.5: sheen and bloom are present during intro mount, and absent after Skip or completion', () => {
    sessionStorage.clear();
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Elements exist in initial mount state
    expect(container.querySelector('.intro-bloom')).toBeInTheDocument();
    expect(container.querySelector('.intro-sheen-container')).toBeInTheDocument();

    const skipBtn = screen.getByRole('button', { name: /Skip Intro Animation/i });
    fireEvent.click(skipBtn);

    // Entire intro overlay unmounts cleanly with no leftover bloom or sheen layers
    expect(container.querySelector('.intro-bloom')).not.toBeInTheDocument();
    expect(container.querySelector('.intro-sheen-container')).not.toBeInTheDocument();
    expect(container.querySelector('.intro-container')).not.toBeInTheDocument();
  });

  test('Phase 2.5: reduced-motion does not mount or immediately cleans up sheen and bloom layers', () => {
    // When intro is marked seen or skipped under reduced-motion, no sheen or bloom persists
    sessionStorage.setItem('breachshield_intro_seen', 'true');
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(container.querySelector('.intro-bloom')).not.toBeInTheDocument();
    expect(container.querySelector('.intro-sheen-container')).not.toBeInTheDocument();
    expect(container.querySelector('.intro-container')).not.toBeInTheDocument();
  });

  test('Phase 2.3: overlay is decorative with aria-hidden="true" and skip button is keyboard-reachable', () => {
    sessionStorage.clear();
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const overlay = container.querySelector('.intro-overlay');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(overlay).not.toHaveAttribute('role', 'dialog');
    expect(overlay).not.toHaveAttribute('aria-modal');

    // Skip button is outside the aria-hidden container
    const skipBtn = screen.getByRole('button', { name: /Skip Intro Animation/i });
    expect(skipBtn).toBeInTheDocument();
    expect(overlay.contains(skipBtn)).toBe(false);

    // Wordmark has single aria-label="BreachShield" with individual letters aria-hidden="true"
    const wordmark = container.querySelector('.intro-dock-wordmark');
    expect(wordmark).toHaveAttribute('aria-label', 'BreachShield');
    const letters = wordmark.querySelectorAll('.intro-letter');
    expect(letters.length).toBe(12);
    letters.forEach((letter) => {
      expect(letter).toHaveAttribute('aria-hidden', 'true');
    });
  });

  test('renders SearchPage when directly visiting /search', () => {
    render(
      <MemoryRouter initialEntries={['/search']}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('OSINT SEARCH')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate-otp-button/i })).toBeInTheDocument();
    expect(screen.getByText(/we'll send a one-time code to verify it's you/i)).toBeInTheDocument();
  });
});

describe('SearchPage (/search route)', () => {
  test('validates email format in real-time and enables button when valid', () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/enter email/i);
    const btn = screen.getByRole('button', { name: /generate-otp-button/i });

    // Initially disabled
    expect(btn).toBeDisabled();

    // Invalid email shows validation error
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(btn).toBeDisabled();

    // Valid email clears error and enables button
    fireEvent.change(input, { target: { value: 'target@example.com' } });
    expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
    expect(btn).toBeEnabled();
  });

  test('calls send-otp API on submit and stores email in sessionStorage', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true, message: 'OTP sent' } });

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/enter email/i);
    const btn = screen.getByRole('button', { name: /generate-otp-button/i });

    fireEvent.change(input, { target: { value: 'test@victim.com' } });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/send-otp', { email: 'test@victim.com' });
      expect(sessionStorage.getItem('osint_target_email')).toBe('test@victim.com');
    });
  });

  test('displays error alert if send-otp API fails', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { error: 'Please wait 30 seconds before requesting a new OTP.' } }
    });

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/enter email/i);
    const btn = screen.getByRole('button', { name: /generate-otp-button/i });

    fireEvent.change(input, { target: { value: 'test@victim.com' } });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/please wait 30 seconds before requesting a new otp/i)).toBeInTheDocument();
    });
  });
});

describe('VerifyOtpPage (/verify and /verify-otp routes)', () => {
  test('Phase 4: guard redirects to /search when osint_target_email is missing', () => {
    sessionStorage.clear();
    render(
      <MemoryRouter initialEntries={['/verify']}>
        <Routes>
          <Route path="/search" element={<div>Search Page</div>} />
          <Route path="/verify" element={<VerifyOtpPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Search Page')).toBeInTheDocument();
  });

  test('Phase 4: /verify-otp redirects to /verify preserving location.state', () => {
    sessionStorage.setItem('osint_target_email', 'alice@domain.com');
    render(
      <MemoryRouter initialEntries={[{ pathname: '/verify-otp', state: { email: 'alice@domain.com' } }]}>
        <Routes>
          <Route path="/verify-otp" element={<VerifyOtpRedirect />} />
          <Route path="/verify" element={<VerifyOtpPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Enter your code/i)).toBeInTheDocument();
  });

  test('Phase 4: masked output for email and phone and full identifier absent from document text', () => {
    // 1. Email masking
    sessionStorage.setItem('osint_target_email', 'alice.smith@example.org');
    sessionStorage.setItem('osint_target_type', 'email');

    const { rerender, container } = render(
      <MemoryRouter initialEntries={['/verify']}>
        <VerifyOtpPage />
      </MemoryRouter>
    );

    expect(screen.getByText('a...@example.org')).toBeInTheDocument();
    expect(container.textContent).not.toContain('alice.smith@example.org');

    // 2. Phone masking
    sessionStorage.setItem('osint_target_email', '+14155552671');
    sessionStorage.setItem('osint_target_type', 'phone');

    rerender(
      <MemoryRouter initialEntries={['/verify']}>
        <VerifyOtpPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/2671/)).toBeInTheDocument();
    expect(container.textContent).not.toContain('+14155552671');
    expect(container.textContent).not.toContain('4155552671');
  });

  test('Phase 4: resend is disabled during 30s cooldown', () => {
    sessionStorage.setItem('osint_target_email', 'user@domain.com');

    render(
      <MemoryRouter initialEntries={['/verify']}>
        <VerifyOtpPage />
      </MemoryRouter>
    );

    const resendBtn = screen.getByRole('button', { name: /resend-otp-button/i });
    expect(resendBtn).toBeDisabled();
    expect(resendBtn.textContent).toMatch(/Resend in \d+s/);
  });

  test('Phase 4: pasting "123456" fills all boxes and non-digits are ignored', () => {
    sessionStorage.setItem('osint_target_email', 'user@domain.com');

    render(
      <MemoryRouter initialEntries={['/verify']}>
        <VerifyOtpPage />
      </MemoryRouter>
    );

    const otpInput = screen.getByLabelText('otp-input');
    const verifyBtn = screen.getByRole('button', { name: /verify-otp-button/i });

    // Non-digits ignored
    fireEvent.change(otpInput, { target: { value: 'abc-!@#' } });
    expect(otpInput.value).toBe('');
    expect(verifyBtn).toBeDisabled();

    // Paste "123456"
    fireEvent.change(otpInput, { target: { value: '123456' } });
    expect(otpInput.value).toBe('123456');
    expect(verifyBtn).toBeEnabled();
  });

  test('Phase 4: wrong code shows inline error with attemptsRemaining and clears boxes', async () => {
    sessionStorage.setItem('osint_target_email', 'user@domain.com');
    api.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { error: 'Invalid verification code', attemptsRemaining: 3 }
      }
    });

    render(
      <MemoryRouter initialEntries={['/verify']}>
        <VerifyOtpPage />
      </MemoryRouter>
    );

    const otpInput = screen.getByLabelText('otp-input');
    const verifyBtn = screen.getByRole('button', { name: /verify-otp-button/i });

    fireEvent.change(otpInput, { target: { value: '111111' } });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Invalid verification code \(3 attempts remaining\)/i)).toBeInTheDocument();
      // Boxes cleared
      expect(otpInput.value).toBe('');
    });
  });

  test('Phase 4: expired state enables resend button', () => {
    sessionStorage.setItem('osint_target_email', 'user@domain.com');
    jest.useFakeTimers();

    render(
      <MemoryRouter initialEntries={['/verify']}>
        <VerifyOtpPage />
      </MemoryRouter>
    );

    const resendBtn = screen.getByRole('button', { name: /resend-otp-button/i });
    expect(resendBtn).toBeDisabled();

    // Fast-forward past 300s expiry inside act
    act(() => {
      jest.advanceTimersByTime(301000);
    });

    expect(screen.getByText(/Code expired/i)).toBeInTheDocument();
    expect(resendBtn).toBeEnabled();

    jest.useRealTimers();
  });

  test('Phase 4: successful verify navigates to /scanning and stores token & verified email', async () => {
    sessionStorage.setItem('osint_target_email', 'target@domain.com');
    api.post.mockResolvedValueOnce({
      data: { success: true, token: 'mock-jwt-token', email: 'target@domain.com' }
    });

    render(
      <MemoryRouter initialEntries={['/verify']}>
        <Routes>
          <Route path="/verify" element={<VerifyOtpPage />} />
          <Route path="/scanning" element={<div>Scanning Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    const otpInput = screen.getByLabelText('otp-input');
    const verifyBtn = screen.getByRole('button', { name: /verify-otp-button/i });

    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/verify-otp', {
        email: 'target@domain.com',
        otp: '123456'
      });
      expect(sessionStorage.getItem('osint_verified_email')).toBe('target@domain.com');
      expect(sessionStorage.getItem('osint_token')).toBe('mock-jwt-token');
      expect(screen.getByText('Scanning Screen')).toBeInTheDocument();
    });
  });

  test('Phase 4: change email/number clears pending keys and navigates to /search', () => {
    sessionStorage.setItem('osint_target_email', 'target@domain.com');
    sessionStorage.setItem('osint_target_type', 'email');
    sessionStorage.setItem('osint_token', 'token-123');
    sessionStorage.setItem('osint_verified_email', 'target@domain.com');

    render(
      <MemoryRouter initialEntries={['/verify']}>
        <Routes>
          <Route path="/verify" element={<VerifyOtpPage />} />
          <Route path="/search" element={<div>Search Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    const changeBtn = screen.getByRole('button', { name: /Change email or phone number/i });
    fireEvent.click(changeBtn);

    expect(sessionStorage.getItem('osint_target_email')).toBeNull();
    expect(sessionStorage.getItem('osint_target_type')).toBeNull();
    expect(sessionStorage.getItem('osint_token')).toBeNull();
    expect(sessionStorage.getItem('osint_verified_email')).toBeNull();
    expect(screen.getByText('Search Screen')).toBeInTheDocument();
  });
});

describe('ResultsPage (/results route)', () => {
  test('redirects to /search when unverified', () => {
    render(
      <MemoryRouter initialEntries={['/results']}>
        <Routes>
          <Route path="/search" element={<div>Root Search Page</div>} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Root Search Page')).toBeInTheDocument();
  });

  test('renders Exposure Score and Breach Timeline from location state', async () => {
    sessionStorage.setItem('osint_target_email', 'victim@domain.com');
    sessionStorage.setItem('osint_verified_email', 'victim@domain.com');
    sessionStorage.setItem('osint_token', 'valid-token-123');

    const mockSearchResponse = {
      success: true,
      data: {
        packets: [
          { mobile: '+1234567890', name: 'John Doe', address: '123 Cyber St', info: '[ BREACH RECORD 1 ]\nName: John Doe' }
        ],
        pagination: { current: 1, total: 1 },
        analytics: {
          exposure: {
            score: 75,
            riskLevel: 'HIGH',
            riskColor: '#ff3b3b',
            entities: { recordCount: 3, phoneCount: 1, hasDocument: true, correlatedRecordPairs: 1, totalRecordPairs: 1, sharedFieldTypes: ['email'] },
            factors: {
              correlation_score: 1,
              phishing_probability: 0,
              severity: 0.95,
              recency: 0.95,
              source_reliability: 0.9
            },
            breakdown: [
              { factor: 'Multiple database breach occurrences', points: 40 },
              { factor: 'Phone number linked to dark web dump', points: 35 }
            ]
          },
          timeline: [
            { year: '2023', source: 'Collection #1', category: 'Credential Dump', severity: 'critical', description: 'Plaintext combo leaked' }
          ]
        }
      }
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/results', state: { result: mockSearchResponse.data } }]}>
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check Exposure Score
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText(/THREAT LEVEL: HIGH/i)).toBeInTheDocument();
      expect(screen.getByText(/Multiple database breach occurrences/i)).toBeInTheDocument();
      // Entity correlation surfaced in UI
      expect(screen.getByText(/Risk Factor Attribution/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Entity Correlation/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Correlated Record Pair/i)).toBeInTheDocument();
      expect(screen.getByText(/1 record pair\(s\) share identity fields/i)).toBeInTheDocument();
    });

    // Check View Mode Switcher
    const timelineBtn = screen.getByRole('button', { name: /timeline-view/i });
    expect(timelineBtn).toBeInTheDocument();

    fireEvent.click(timelineBtn);
    expect(screen.getByText(/CHRONOLOGICAL EXPOSURE TIMELINE/i)).toBeInTheDocument();
    expect(screen.getByText(/Collection #1/i)).toBeInTheDocument();
  });

  test('renders SIMULATED badge and honest details for rule-based heuristic records', async () => {
    sessionStorage.setItem('osint_target_email', 'victim@domain.com');
    sessionStorage.setItem('osint_verified_email', 'victim@domain.com');
    sessionStorage.setItem('osint_token', 'valid-token-123');

    const mockSearchResponse = {
      success: true,
      data: {
        packets: [
          { info: '[SIMULATED PHISHING MATCH - NO LIVE FEED CONSULTED]' }
        ],
        records: [
          {
            id: 1,
            source: 'Public_Phishing_Feed',
            title: 'Public_Phishing_Feed Threat Intelligence Spill',
            year: '2026',
            category: 'Multi-Source Intelligence',
            sourceType: 'LOCAL',
            isSimulated: true,
            dataClasses: ['PHISHING_URL', 'MALICIOUS_DOMAIN'],
            details: 'Simulated / rule-based heuristic match for demonstration (no live feed consulted).'
          }
        ],
        analytics: { exposure: { score: 30, riskLevel: 'MEDIUM', entities: {}, breakdown: [] }, timeline: [] }
      }
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/results', state: { result: mockSearchResponse.data } }]}>
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Badge visible in the overview preview list
      expect(screen.getAllByText('SIMULATED').length).toBeGreaterThan(0);
    });

    // Cards view shows honest details wording on simulated records
    const cardsBtn = screen.getByRole('button', { name: /cards-view/i });
    fireEvent.click(cardsBtn);
    await waitFor(() => {
      expect(screen.getByText(/no live feed consulted/i)).toBeInTheDocument();
    });
  });
});

describe('Phase 5+6: /scanning, results states, and guards', () => {
  test('guard redirects: no target -> /search', () => {
    sessionStorage.clear();
    render(
      <MemoryRouter initialEntries={['/scanning']}>
        <Routes>
          <Route path="/search" element={<div data-testid="search-screen">Search Screen</div>} />
          <Route path="/scanning" element={<ScanningPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('search-screen')).toBeInTheDocument();
  });

  test('guard redirects: target but unverified -> /verify', () => {
    sessionStorage.setItem('osint_target_email', 'user@domain.com');
    // no token or verified email
    render(
      <MemoryRouter initialEntries={['/scanning']}>
        <Routes>
          <Route path="/verify" element={<div data-testid="verify-screen">Verify Screen</div>} />
          <Route path="/scanning" element={<ScanningPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('verify-screen')).toBeInTheDocument();
  });

  test('guard redirects: verified for a DIFFERENT identifier -> /verify', () => {
    sessionStorage.setItem('osint_target_email', 'target@domain.com');
    sessionStorage.setItem('osint_verified_email', 'other@domain.com');
    sessionStorage.setItem('osint_token', 'valid-jwt');
    render(
      <MemoryRouter initialEntries={['/scanning']}>
        <Routes>
          <Route path="/verify" element={<div data-testid="verify-screen">Verify Screen</div>} />
          <Route path="/scanning" element={<ScanningPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('verify-screen')).toBeInTheDocument();
  });

  test('verification success lands on /scanning', async () => {
    sessionStorage.setItem('osint_target_email', 'auth@domain.com');
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'auth-jwt-token',
        email: 'auth@domain.com',
        message: 'Verified successfully'
      }
    });

    render(
      <MemoryRouter initialEntries={['/verify-otp']}>
        <Routes>
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/scanning" element={<div data-testid="scanning-screen">Scanning Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    const otpInput = screen.getByLabelText('otp-input');
    const verifyBtn = screen.getByRole('button', { name: /verify-otp-button/i });
    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByTestId('scanning-screen')).toBeInTheDocument();
      expect(sessionStorage.getItem('osint_token')).toBe('auth-jwt-token');
      expect(sessionStorage.getItem('osint_verified_email')).toBe('auth@domain.com');
    });
  });

  test('/scanning makes exactly ONE API call under StrictMode', async () => {
    sessionStorage.setItem('osint_target_email', 'user@strict.com');
    sessionStorage.setItem('osint_verified_email', 'user@strict.com');
    sessionStorage.setItem('osint_token', 'jwt-token-strict');

    api.post.mockResolvedValue({
      data: {
        success: true,
        data: { packets: [], records: [] }
      }
    });

    render(
      <React.StrictMode>
        <MemoryRouter initialEntries={['/scanning']}>
          <Routes>
            <Route path="/scanning" element={<ScanningPage />} />
            <Route path="/results" element={<div>Results Target</div>} />
          </Routes>
        </MemoryRouter>
      </React.StrictMode>
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
    });
  });

  test('minimum duration (1000ms) respected (tested with fake timers)', async () => {
    jest.useFakeTimers();
    sessionStorage.setItem('osint_target_email', 'fast@timer.com');
    sessionStorage.setItem('osint_verified_email', 'fast@timer.com');
    sessionStorage.setItem('osint_token', 'jwt-timer-token');

    let resolveApi;
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });
    api.post.mockReturnValueOnce(apiPromise);

    render(
      <MemoryRouter initialEntries={['/scanning']}>
        <Routes>
          <Route path="/scanning" element={<ScanningPage />} />
          <Route path="/results" element={<div data-testid="results-done">Done</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Resolve API call immediately at t=0
    resolveApi({ data: { success: true, data: { records: [] } } });
    await act(async () => {
      await Promise.resolve();
    });

    // At 500ms, MIN_SCAN_TIME_MS (1000ms) has not elapsed yet
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByTestId('results-done')).not.toBeInTheDocument();

    // Advance beyond 1000ms
    act(() => {
      jest.advanceTimersByTime(600);
    });
    await waitFor(() => {
      expect(screen.getByTestId('results-done')).toBeInTheDocument();
    });
    jest.useRealTimers();
  });

  test('403 API response redirects to /verify', async () => {
    sessionStorage.setItem('osint_target_email', 'forbidden@domain.com');
    sessionStorage.setItem('osint_verified_email', 'forbidden@domain.com');
    sessionStorage.setItem('osint_token', 'expired-token');

    api.post.mockRejectedValueOnce({
      response: {
        status: 403,
        data: { error: 'You can only search the email/phone you verified.' }
      }
    });

    render(
      <MemoryRouter initialEntries={['/scanning']}>
        <Routes>
          <Route path="/scanning" element={<ScanningPage />} />
          <Route path="/verify" element={<div data-testid="verify-redirect">Verify Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('verify-redirect')).toBeInTheDocument();
      expect(sessionStorage.getItem('osint_token')).toBeNull();
      expect(sessionStorage.getItem('osint_verified_email')).toBeNull();
    });
  });

  test('error state offers retry and back to search', async () => {
    sessionStorage.setItem('osint_target_email', 'retry@domain.com');
    sessionStorage.setItem('osint_verified_email', 'retry@domain.com');
    sessionStorage.setItem('osint_token', 'valid-token');

    api.post.mockRejectedValueOnce(new Error('Network connection dropped'));

    render(
      <MemoryRouter initialEntries={['/scanning']}>
        <Routes>
          <Route path="/scanning" element={<ScanningPage />} />
          <Route path="/search" element={<div data-testid="search-screen">Search Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Network connection dropped/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    // Retry resets guard and fires request again
    api.post.mockResolvedValueOnce({
      data: { success: true, data: { records: [] } }
    });

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2);
    });
  });

  test('results refresh without state redirects to /scanning', () => {
    sessionStorage.setItem('osint_target_email', 'user@domain.com');
    sessionStorage.setItem('osint_verified_email', 'user@domain.com');
    sessionStorage.setItem('osint_token', 'valid-token');

    render(
      <MemoryRouter initialEntries={['/results']}>
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/scanning" element={<div data-testid="scanning-screen">Scanning Refetch Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('scanning-screen')).toBeInTheDocument();
  });

  test('no-breaches state rendered when records and packets are empty', () => {
    sessionStorage.setItem('osint_target_email', 'clean@domain.com');
    sessionStorage.setItem('osint_verified_email', 'clean@domain.com');
    sessionStorage.setItem('osint_token', 'valid-token');

    render(
      <MemoryRouter initialEntries={[{ pathname: '/results', state: { result: { records: [], packets: [], analytics: { exposure: { score: 0 } } } } }]}>
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('No Breaches Found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new-search/i })).toBeInTheDocument();
  });

  test('full identifier is absent from results DOM (only masked appears)', () => {
    sessionStorage.setItem('osint_target_email', 'secret.person@defense.gov');
    sessionStorage.setItem('osint_verified_email', 'secret.person@defense.gov');
    sessionStorage.setItem('osint_token', 'valid-token');

    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/results', state: { result: { records: [{ id: '1', title: 'Test Breach', year: '2024', dataClasses: ['EMAIL'] }], packets: [], analytics: { exposure: { score: 20 } } } } }]}>
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Full unmasked identifier must NOT be present anywhere in DOM
    expect(container.textContent).not.toContain('secret.person@defense.gov');
    // Masked identifier must be present
    expect(container.textContent).toContain(maskIdentifier('secret.person@defense.gov'));
  });

  test('"Search again" button clears all osint_* keys and goes to /search', () => {
    sessionStorage.setItem('osint_target_email', 'test@domain.com');
    sessionStorage.setItem('osint_target_type', 'EMAIL');
    sessionStorage.setItem('osint_verified_email', 'test@domain.com');
    sessionStorage.setItem('osint_token', 'valid-token');

    render(
      <MemoryRouter initialEntries={[{ pathname: '/results', state: { result: { records: [], packets: [], analytics: { exposure: { score: 0 } } } } }]}>
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/search" element={<div data-testid="search-screen">Search Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    const searchAgainBtn = screen.getByRole('button', { name: /new-search/i });
    fireEvent.click(searchAgainBtn);

    expect(sessionStorage.getItem('osint_target_email')).toBeNull();
    expect(sessionStorage.getItem('osint_target_type')).toBeNull();
    expect(sessionStorage.getItem('osint_verified_email')).toBeNull();
    expect(sessionStorage.getItem('osint_token')).toBeNull();
    expect(screen.getByTestId('search-screen')).toBeInTheDocument();
  });

  describe('Phase 7: Results cleanup & nav tests', () => {
    const rawTarget = '+91 98765 43210';
    const testResult = {
      records: [
        {
          id: 'rec-1',
          title: 'Leak with phone +91 98765 43210 and Aadhaar **mber',
          category: 'Telecom Leak',
          year: '2024',
          dataClasses: ['PHONE', 'IDENTITY'],
          details: 'Compromised record for 9876543210 and taxpayer **********pear'
        }
      ],
      packets: [
        {
          info: [
            'Subjects made: 15',
            'Search time: 1.1s',
            'This is free version of the bot.',
            'Buying a subscription gives you access.',
            'Mirror (in case of removal): @bot_mirror',
            'Contact @admin_osint',
            'Target Phone: +91 98765 43210',
            'Raw digits: 9876543210',
            'Spaced: 98765 43210',
            'Aadhaar **mber: 1234 5678 9012',
            'taxpayer **********pear'
          ].join('\n')
        }
      ],
      analytics: {
        exposure: { score: 45, riskLevel: 'MEDIUM', breakdown: [] },
        timeline: [
          {
            year: '2024',
            source: 'Telecom Spill',
            category: 'Data Breach',
            description: 'Incident referencing +91 98765 43210'
          }
        ]
      }
    };

    beforeEach(() => {
      sessionStorage.setItem('osint_target_email', rawTarget);
      sessionStorage.setItem('osint_verified_email', rawTarget);
      sessionStorage.setItem('osint_target_type', 'phone');
      sessionStorage.setItem('osint_token', 'valid-token-123');
    });

    test('full identifier is absent across every results tab (timeline, data, overview, cards)', () => {
      const { container } = render(
        <MemoryRouter initialEntries={[{ pathname: '/results', state: { result: testResult } }]}>
          <Routes>
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </MemoryRouter>
      );

      const checkNoFullIdentifier = () => {
        expect(container.textContent).not.toContain('+91 98765 43210');
        expect(container.textContent).not.toContain('9876543210');
        expect(container.textContent).not.toContain('98765 43210');
      };

      // 1. Initial Timeline tab
      checkNoFullIdentifier();

      // 2. Data / Terminal tab
      const dataBtn = screen.getByRole('button', { name: /terminal-view/i });
      fireEvent.click(dataBtn);
      checkNoFullIdentifier();

      // 3. Overview tab (via compatibility button)
      const overviewBtn = screen.getByRole('button', { name: /overview-view/i });
      fireEvent.click(overviewBtn);
      checkNoFullIdentifier();

      // 4. Cards tab (via compatibility button)
      const cardsBtn = screen.getByRole('button', { name: /cards-view/i });
      fireEvent.click(cardsBtn);
      checkNoFullIdentifier();
    });

    test('Copy payload in Data tab sanitizes full identifier and removes bot handles & promo lines', () => {
      let copiedText = '';
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn((text) => {
            copiedText = text;
            return Promise.resolve();
          })
        }
      });

      render(
        <MemoryRouter initialEntries={[{ pathname: '/results', state: { result: testResult } }]}>
          <Routes>
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </MemoryRouter>
      );

      const dataBtn = screen.getByRole('button', { name: /terminal-view/i });
      fireEvent.click(dataBtn);

      const copyBtn = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(copiedText).not.toContain('+91 98765 43210');
      expect(copiedText).not.toContain('9876543210');
      expect(copiedText).not.toContain('free version of the bot');
      expect(copiedText).not.toContain('Buying a subscription');
      expect(copiedText).not.toContain('Mirror (in case of removal');
      expect(copiedText).not.toContain('@bot_mirror');
      expect(copiedText).not.toContain('@admin_osint');
      expect(copiedText).not.toContain('Subjects made');
      expect(copiedText).not.toContain('Search time');
      expect(copiedText).toContain('••••••••3210');
    });

    test('no "@" handle or bot promo text and no "System Online" pill in the Results DOM', () => {
      const { container } = render(
        <MemoryRouter initialEntries={[{ pathname: '/results', state: { result: testResult } }]}>
          <Routes>
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(container.textContent).not.toContain('System Online');
      expect(container.textContent).not.toContain('Privacy First • AI Risk Analysis • Audit Integrity');
      expect(container.textContent).not.toContain('free version of the bot');
      expect(container.textContent).not.toContain('Buying a subscription');
      expect(container.textContent).not.toContain('Mirror (in case of removal');
      expect(container.textContent).not.toContain('Subjects made');
      expect(container.textContent).not.toContain('Search time');
      expect(container.textContent).not.toContain('@bot_mirror');
      expect(container.textContent).not.toContain('@admin_osint');
    });

    test('Navbar uses shared Chrome and links point to /#about, /#team, /#contact on non-landing routes', () => {
      render(
        <MemoryRouter initialEntries={[{ pathname: '/results', state: { result: testResult } }]}>
          <Routes>
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('link', { name: /About/i })).toHaveAttribute('href', '/#about');
      expect(screen.getByRole('link', { name: /Team/i })).toHaveAttribute('href', '/#team');
      expect(screen.getByRole('link', { name: /Contact/i })).toHaveAttribute('href', '/#contact');

      // Home link is not active on /results
      const homeLink = screen.getByRole('link', { name: /^Home$/i });
      expect(homeLink).toHaveAttribute('href', '/');
      expect(homeLink).not.toHaveClass('active');
    });
  });
});
