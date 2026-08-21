import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ResultsPage from './pages/ResultsPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/results" element={<ResultsPage />} />
        {/* Wildcard fallback redirects legacy & unknown routes directly to / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
