import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ResultsPage from './pages/ResultsPage';

export function VerifyOtpRedirect() {
  const location = useLocation();
  return <Navigate to="/verify" state={location.state} replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/verify" element={<VerifyOtpPage />} />
        <Route path="/verify-otp" element={<VerifyOtpRedirect />} />
        <Route path="/results" element={<ResultsPage />} />
        {/* Wildcard fallback redirects unknown routes directly to / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
