import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ResultsPage from './pages/ResultsPage';

export default function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/search" element={<App />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/results" element={<ResultsPage />} />
        {/* Wildcard fallback redirects unknown routes directly to / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
