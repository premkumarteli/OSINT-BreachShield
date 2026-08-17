import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppRouter from './AppRouter';
import SearchPage from './pages/SearchPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ResultsPage from './pages/ResultsPage';
import api from './lib/api';

jest.mock('./lib/api');

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  jest.clearAllMocks();
});

describe('AppRouter Integration', () => {
  test('renders SearchPage on initial load at root route', () => {
    render(<AppRouter />);
    expect(screen.getByText('OSINT SEARCH')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter email to check breaches/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate-otp-button/i })).toBeInTheDocument();
  });
});

describe('SearchPage (/ route)', () => {
  test('validates email format in real-time and enables button when valid', () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/enter email to check breaches/i);
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

    const input = screen.getByPlaceholderText(/enter email to check breaches/i);
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

    const input = screen.getByPlaceholderText(/enter email to check breaches/i);
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
            entities: { recordCount: 3, phoneCount: 1, hasDocument: true },
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
    });

    // Check View Mode Switcher
    const timelineBtn = screen.getByRole('button', { name: /timeline-view/i });
    expect(timelineBtn).toBeInTheDocument();

    fireEvent.click(timelineBtn);
    expect(screen.getByText(/CHRONOLOGICAL EXPOSURE TIMELINE/i)).toBeInTheDocument();
    expect(screen.getByText(/Collection #1/i)).toBeInTheDocument();
  });
});
