import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppRouter from './AppRouter';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ResultsPage from './pages/ResultsPage';
import Navbar from './components/Navbar';
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
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(screen.queryByLabelText(/BreachShield Logo Intro/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Check whether your email or phone appears in known breaches/i)).toBeInTheDocument();
  });

  test('(b) Skip button sets the sessionStorage flag and removes the overlay', () => {
    sessionStorage.clear();
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Overlay is present initially
    expect(screen.getByLabelText(/BreachShield Logo Intro/i)).toBeInTheDocument();
    const skipBtn = screen.getByRole('button', { name: /Skip Intro Animation/i });
    expect(skipBtn).toBeInTheDocument();

    // Click Skip
    fireEvent.click(skipBtn);

    // Flag is set and overlay is removed
    expect(sessionStorage.getItem('breachshield_intro_seen')).toBe('true');
    expect(screen.queryByLabelText(/BreachShield Logo Intro/i)).not.toBeInTheDocument();
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
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );
    const logos = screen.getAllByRole('img', { name: /BreachShield/i });
    expect(logos.length).toBeGreaterThanOrEqual(2);
    const overlayLogoSrc = logos[0].getAttribute('src');
    const navbarLogoSrc = logos[1].getAttribute('src');
    expect(overlayLogoSrc).toBe(navbarLogoSrc);
    expect(overlayLogoSrc).toBe('/logo-icon.png');
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
    window.Image.prototype.decode = jest.fn().mockRejectedValue(new Error('Simulated decode failure'));

    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /Skip Intro/i })).toBeInTheDocument();

    if (origDecode) {
      window.Image.prototype.decode = origDecode;
    } else {
      delete window.Image.prototype.decode;
    }
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

describe('VerifyOtpPage (/verify-otp route)', () => {
  test('redirects to / when no email is in state or sessionStorage', () => {
    render(
      <MemoryRouter initialEntries={['/verify-otp']}>
        <Routes>
          <Route path="/" element={<div>Root Search Page</div>} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Root Search Page')).toBeInTheDocument();
  });

  test('renders email, 6-digit input, timer, and handles OTP verification', async () => {
    sessionStorage.setItem('osint_target_email', 'target@domain.com');
    api.post.mockResolvedValueOnce({
      data: { success: true, token: 'mock-jwt-token', email: 'target@domain.com' }
    });

    render(
      <MemoryRouter initialEntries={['/verify-otp']}>
        <Routes>
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/results" element={<div>Verified Results Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('target@domain.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Countdown Timer')).toBeInTheDocument();

    const otpInput = screen.getByLabelText('otp-input');
    const verifyBtn = screen.getByRole('button', { name: /verify-otp-button/i });

    // Initially disabled until 6 digits entered
    expect(verifyBtn).toBeDisabled();

    // Type 6 digits
    fireEvent.change(otpInput, { target: { value: '123456' } });
    expect(verifyBtn).toBeEnabled();

    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/verify-otp', {
        email: 'target@domain.com',
        otp: '123456'
      });
      expect(sessionStorage.getItem('osint_verified_email')).toBe('target@domain.com');
      expect(sessionStorage.getItem('osint_token')).toBe('mock-jwt-token');
      expect(screen.getByText('Verified Results Page')).toBeInTheDocument();
    });
  });
});

describe('ResultsPage (/results route)', () => {
  test('redirects to / when unverified', () => {
    render(
      <MemoryRouter initialEntries={['/results']}>
        <Routes>
          <Route path="/" element={<div>Root Search Page</div>} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Root Search Page')).toBeInTheDocument();
  });

  test('auto-executes search on mount and renders Exposure Score and Breach Timeline', async () => {
    sessionStorage.setItem('osint_verified_email', 'victim@domain.com');

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

    api.post.mockResolvedValueOnce({ data: mockSearchResponse });

    render(
      <MemoryRouter initialEntries={['/results']}>
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/search', {
        query: 'victim@domain.com',
        searchType: 'Email',
        osintType: 'MOBILE_OSINT'
      });
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
    sessionStorage.setItem('osint_verified_email', 'victim@domain.com');

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

    api.post.mockResolvedValueOnce({ data: mockSearchResponse });

    render(
      <MemoryRouter initialEntries={['/results']}>
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
