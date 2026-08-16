import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AuthForm from './components/AuthForm';
import AuthLayout from './components/AuthLayout';
import GlobalBackground from './components/GlobalBackground';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <GlobalBackground />
      <Routes>
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<AuthForm />} />
          <Route path="/register" element={<AuthForm />} />
        </Route>
        {/* Search UI under /search */}
        <Route path="/search" element={<App />} />
        <Route path="*" element={<Navigate to="/search" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

