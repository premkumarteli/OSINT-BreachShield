import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import GlobalBackground from './components/GlobalBackground';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <GlobalBackground />
      <Routes>
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* keep original search UI under /search */}
        <Route path="/search" element={<App />} />
  <Route path="*" element={<Navigate to="/search" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
