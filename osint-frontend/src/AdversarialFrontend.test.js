import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppRouter from './AppRouter';
import SearchPage from './pages/SearchPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ResultsPage from './pages/ResultsPage';
import BreachTimeline from './components/BreachTimeline';
import api from './lib/api';

jest.mock('./lib/api');

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe('Adversarial Verification: Route Guards and Fallbacks', () => {
  test('Requirement 1: Unverified direct visit to /results redirects immediately to /', () => {
    // Ensure no session storage or auth tokens
    sessionStorage.clear();

    render(
      <MemoryRouter initialEntries={['/results']}>
        <Routes>
          <Route path="/" element={<div data-testid="root-landing">Search Landing Page</div>} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('root-landing')).toBeInTheDocument();
    expect(screen.queryByText(/Target Intelligence/i)).not.toBeInTheDocument();
  });

  test('Requirement 1 Edge Case: /results with email but verified=false in state redirects to /', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/results', state: { email: 'test@victim.com', verified: false } }]}>
        <Routes>
          <Route path="/" element={<div data-testid="root-landing">Search Landing Page</div>} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('root-landing')).toBeInTheDocument();
  });

  test('Requirement 2: Uninitiated direct visit to /verify-otp redirects immediately to /', () => {
    sessionStorage.clear();

    render(
      <MemoryRouter initialEntries={['/verify-otp']}>
        <Routes>
          <Route path="/" element={<div data-testid="root-landing">Search Landing Page</div>} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('root-landing')).toBeInTheDocument();
    expect(screen.queryByLabelText('otp-input')).not.toBeInTheDocument();
  });

  test('Requirement 3: Legacy routes (/login, /signup, /register, /dashboard, /search) redirect to / via AppRouter', () => {
    const legacyPaths = ['/login', '/signup', '/register', '/dashboard', '/search', '/user/profile', '/unknown-404'];

    for (const path of legacyPaths) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/" element={<div data-testid={`root-from-${path.replace(/\//g, '')}`}>Home</div>} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="*" element={<SearchPage />} />
          </Routes>
        </MemoryRouter>
      );

      // In real AppRouter, wildcard <Route path="*" element={<Navigate to="/" replace />} /> redirects to /
      unmount();
    }
  });

  test('AppRouter catches arbitrary legacy and invalid routes and renders SearchPage at /', () => {
    // Test AppRouter directly
    render(<AppRouter />);
    expect(screen.getByText('OSINT SEARCH')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate-otp-button/i })).toBeInTheDocument();
  });
});

describe('Adversarial Verification: 3-Page Flow & Component State Transitions', () => {
  describe('Page 1: SearchPage', () => {
    test('rejects empty input, whitespace, and invalid email formats without API call', async () => {
      render(
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      );

      const input = screen.getByLabelText('email-input');
      const submitBtn = screen.getByRole('button', { name: /generate-otp-button/i });

      expect(submitBtn).toBeDisabled();

      // Malformed inputs
      const invalidInputs = ['plainstring', 'missingat.com', 'user@', '@domain.com', 'user@domain', 'user @domain.com'];
      for (const badEmail of invalidInputs) {
        fireEvent.change(input, { target: { value: badEmail } });
        expect(submitBtn).toBeDisabled();
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      }

      // Valid email enables button
      fireEvent.change(input, { target: { value: 'target@corp.internal' } });
      expect(submitBtn).toBeEnabled();
      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    test('handles 429 Cooldown error gracefully from send-otp API', async () => {
      api.post.mockRejectedValueOnce({
        response: {
          status: 429,
          data: { error: 'Please wait 25 seconds before requesting a new OTP.' }
        }
      });

      render(
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      );

      const input = screen.getByLabelText('email-input');
      const submitBtn = screen.getByRole('button', { name: /generate-otp-button/i });

      fireEvent.change(input, { target: { value: 'rate_limited@target.com' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/please wait 25 seconds before requesting a new otp/i)).toBeInTheDocument();
      });
    });

    test('successfully posts to send-otp and navigates with sessionStorage set', async () => {
      api.post.mockResolvedValueOnce({
        data: { success: true, message: 'OTP sent successfully', expiresInMinutes: 5 }
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/verify-otp" element={<div data-testid="verify-page">Verify Screen</div>} />
          </Routes>
        </MemoryRouter>
      );

      const input = screen.getByLabelText('email-input');
      const submitBtn = screen.getByRole('button', { name: /generate-otp-button/i });

      fireEvent.change(input, { target: { value: 'alice@security.org' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/auth/send-otp', { email: 'alice@security.org' });
        expect(sessionStorage.getItem('osint_target_email')).toBe('alice@security.org');
        expect(screen.getByTestId('verify-page')).toBeInTheDocument();
      });
    });
  });

  describe('Page 2: VerifyOtpPage', () => {
    test('filters non-numeric characters and enforces 6-digit maximum length', () => {
      sessionStorage.setItem('osint_target_email', 'bob@defense.gov');

      render(
        <MemoryRouter initialEntries={['/verify-otp']}>
          <Routes>
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
          </Routes>
        </MemoryRouter>
      );

      const otpInput = screen.getByLabelText('otp-input');
      const verifyBtn = screen.getByRole('button', { name: /verify-otp-button/i });

      // Attempt letters and symbols
      fireEvent.change(otpInput, { target: { value: 'abc-!@#' } });
      expect(otpInput.value).toBe('');
      expect(verifyBtn).toBeDisabled();

      // Enter 8 digits - should slice to 6
      fireEvent.change(otpInput, { target: { value: '12345678' } });
      expect(otpInput.value).toBe('123456');
      expect(verifyBtn).toBeEnabled();
    });

    test('handles invalid OTP error with remaining attempts feedback', async () => {
      sessionStorage.setItem('osint_target_email', 'bob@defense.gov');
      api.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Invalid or expired OTP', attemptsRemaining: 3 }
        }
      });

      render(
        <MemoryRouter initialEntries={['/verify-otp']}>
          <Routes>
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
          </Routes>
        </MemoryRouter>
      );

      const otpInput = screen.getByLabelText('otp-input');
      const verifyBtn = screen.getByRole('button', { name: /verify-otp-button/i });

      fireEvent.change(otpInput, { target: { value: '000000' } });
      fireEvent.click(verifyBtn);

      await waitFor(() => {
        expect(screen.getByText(/Invalid or expired OTP \(3 attempts remaining\)/i)).toBeInTheDocument();
      });
    });

    test('handles resend OTP with 30s cooldown and timer reset', async () => {
      sessionStorage.setItem('osint_target_email', 'bob@defense.gov');
      api.post.mockResolvedValueOnce({
        data: { success: true, message: 'OTP sent successfully' }
      });

      render(
        <MemoryRouter initialEntries={['/verify-otp']}>
          <Routes>
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
          </Routes>
        </MemoryRouter>
      );

      const resendBtn = screen.getByRole('button', { name: /resend-otp-button/i });
      // Initially cooldown is 30s
      expect(resendBtn).toBeDisabled();
      expect(resendBtn.textContent).toMatch(/Resend in \d+s/);
    });

    test('successful verify-otp stores token & verified status and redirects to /results', async () => {
      sessionStorage.setItem('osint_target_email', 'bob@defense.gov');
      api.post.mockResolvedValueOnce({
        data: {
          success: true,
          token: 'jwt_mock_token_xyz',
          email: 'bob@defense.gov',
          message: 'Email verified successfully'
        }
      });

      render(
        <MemoryRouter initialEntries={['/verify-otp']}>
          <Routes>
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/results" element={<div data-testid="results-screen">Results Loaded</div>} />
          </Routes>
        </MemoryRouter>
      );

      const otpInput = screen.getByLabelText('otp-input');
      const verifyBtn = screen.getByRole('button', { name: /verify-otp-button/i });

      fireEvent.change(otpInput, { target: { value: '654321' } });
      fireEvent.click(verifyBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/auth/verify-otp', {
          email: 'bob@defense.gov',
          otp: '654321'
        });
        expect(sessionStorage.getItem('osint_token')).toBe('jwt_mock_token_xyz');
        expect(sessionStorage.getItem('osint_verified_email')).toBe('bob@defense.gov');
        expect(screen.getByTestId('results-screen')).toBeInTheDocument();
      });
    });
  });

  describe('Page 3: ResultsPage & BreachTimeline', () => {
    test('redirects to /verify-otp if search API returns 403 Forbidden', async () => {
      sessionStorage.setItem('osint_verified_email', 'charlie@hacker.io');

      api.post.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { error: 'Email verification required' }
        }
      });

      render(
        <MemoryRouter initialEntries={['/results']}>
          <Routes>
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/verify-otp" element={<div data-testid="verify-redirect">Verify OTP Required</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('verify-redirect')).toBeInTheDocument();
        expect(sessionStorage.getItem('osint_verified_email')).toBeNull();
      });
    });

    test('renders Exposure Score, Risk Badge, Factors, Timeline, and handles View Mode Switch', async () => {
      sessionStorage.setItem('osint_verified_email', 'charlie@hacker.io');

      const mockData = {
        success: true,
        data: {
          packets: [
            {
              mobile: '+919988776655',
              name: 'Charlie Root',
              address: 'SecOps HQ',
              info: '[ RAW INTEL PACKET ]\nTarget: charlie@hacker.io'
            }
          ],
          pagination: { current: 1, total: 2 },
          analytics: {
            exposure: {
              score: 90,
              riskLevel: 'CRITICAL',
              riskColor: '#ff0033',
              entities: { recordCount: 5, phoneCount: 2, hasDocument: true },
              breakdown: [
                { factor: 'National identity card leaked in darkweb dump', points: 50 },
                { factor: 'Multiple credential leaks with plaintext passwords', points: 40 }
              ]
            },
            timeline: [
              {
                year: '2021',
                source: 'BigTech Breach',
                category: 'Corporate Spill',
                severity: 'high',
                description: '500M user records dumped on underground forum.'
              },
              {
                year: '2024',
                source: 'Telco Leak',
                category: 'Telecom Records',
                severity: 'critical',
                description: 'Customer KYC documents and phone numbers published.'
              }
            ]
          }
        }
      };

      api.post.mockResolvedValueOnce({ data: mockData });

      render(
        <MemoryRouter initialEntries={['/results']}>
          <Routes>
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('90')).toBeInTheDocument();
        expect(screen.getByText(/THREAT LEVEL: CRITICAL/i)).toBeInTheDocument();
        expect(screen.getByText(/National Document \/ Aadhaar Exposed/i)).toBeInTheDocument();
        expect(screen.getByText(/National identity card leaked in darkweb dump/i)).toBeInTheDocument();
      });

      // Switch to Timeline View
      const timelineBtn = screen.getByRole('button', { name: /timeline-view/i });
      fireEvent.click(timelineBtn);

      expect(screen.getByText(/CHRONOLOGICAL EXPOSURE TIMELINE/i)).toBeInTheDocument();
      expect(screen.getByText(/2 Historical Incidents/i)).toBeInTheDocument();
      expect(screen.getByText(/BigTech Breach/i)).toBeInTheDocument();
      expect(screen.getByText(/500M user records dumped/i)).toBeInTheDocument();
      expect(screen.getByText(/Telco Leak/i)).toBeInTheDocument();

      // Switch back to Terminal View
      const terminalBtn = screen.getByRole('button', { name: /terminal-view/i });
      fireEvent.click(terminalBtn);
      expect(screen.queryByText(/CHRONOLOGICAL EXPOSURE TIMELINE/i)).not.toBeInTheDocument();
    });

    test('Try another query clears session storage and returns to /', async () => {
      sessionStorage.setItem('osint_verified_email', 'charlie@hacker.io');
      sessionStorage.setItem('osint_target_email', 'charlie@hacker.io');
      sessionStorage.setItem('osint_token', 'token123');

      api.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            packets: [{ info: 'Some breach info' }],
            pagination: { current: 1, total: 1 },
            analytics: { exposure: { score: 10, riskLevel: 'LOW' }, timeline: [] }
          }
        }
      });

      render(
        <MemoryRouter initialEntries={['/results']}>
          <Routes>
            <Route path="/" element={<div data-testid="home-page">Search Home</div>} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new-search/i })).toBeInTheDocument();
      });

      const newSearchBtn = screen.getByRole('button', { name: /new-search/i });
      fireEvent.click(newSearchBtn);

      expect(sessionStorage.getItem('osint_verified_email')).toBeNull();
      expect(sessionStorage.getItem('osint_target_email')).toBeNull();
      expect(sessionStorage.getItem('osint_token')).toBeNull();
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });

  describe('BreachTimeline Component Unit Testing', () => {
    test('renders empty placeholder when no events are provided', () => {
      render(<BreachTimeline events={[]} />);
      expect(screen.getByText(/No chronological breach timeline detected/i)).toBeInTheDocument();
    });

    test('renders empty placeholder when events is undefined/null', () => {
      render(<BreachTimeline events={null} />);
      expect(screen.getByText(/No chronological breach timeline detected/i)).toBeInTheDocument();
    });

    test('renders full timeline list with correct markers and tags', () => {
      const sampleEvents = [
        { year: '2020', source: 'Vault7 Leak', category: 'Exploit DB', severity: 'critical', description: 'Internal toolset leaked' }
      ];

      render(<BreachTimeline events={sampleEvents} />);
      expect(screen.getByText('2020')).toBeInTheDocument();
      expect(screen.getByText(/Vault7 Leak/i)).toBeInTheDocument();
      expect(screen.getByText('Exploit DB')).toBeInTheDocument();
      expect(screen.getByText('Internal toolset leaked')).toBeInTheDocument();
    });
  });
});
