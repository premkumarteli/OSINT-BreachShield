import React from 'react';
import { Outlet } from 'react-router-dom';
import '../auth.css';

export default function AuthLayout() {
  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <h1 className="hero-title">OSINT SEARCH</h1>
        <div className="hero-credit">Developed by <strong>PhishBreach Guardians</strong></div>
      </div>
      {/* Only this part swaps when navigating between login and signup */}
      <Outlet />
    </div>
  );
}
