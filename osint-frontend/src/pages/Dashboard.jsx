import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import '../auth.css';
import bgVideo2 from '../bg2.mp4';

export default function Dashboard() {
  const navigate = useNavigate();
  const globalBgActive = (typeof window !== 'undefined') && Boolean(window.__GLOBAL_BG_ACTIVE);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/auth/me');
        setUser(res.data.user);
      } catch (e) {
        setError('Not authenticated');
        setTimeout(() => { navigate('/search', { replace: true }); }, 1200);
      }
    })();
  }, []);

  const logout = async () => {
    try { await api.post('/api/auth/logout'); navigate('/search', { replace: true }); } catch {}
  };

  return (
    <div className="auth-screen">
      {!globalBgActive && (
        <video className="bg-video" autoPlay muted loop playsInline aria-hidden>
          <source src={bgVideo2} type="video/mp4" />
        </video>
      )}
      <div className="auth-hero">
        <h1 className="hero-title">OSINT SEARCH</h1>
        <div className="hero-credit">Developed by <strong>PhishBreach Guardians</strong></div>
      </div>
      <div className="auth-card">
        <h2 className="auth-title">Welcome</h2>
        {user ? (
          <div className="profile">
            <div><b>Username:</b> {user.username}</div>
            <div><b>Email:</b> {user.email}</div>
            <div className="dash-actions">
              <Link className="neon-link" to="/search">Go to Search</Link>
              <button className="neon-btn" onClick={logout}>Logout</button>
            </div>
          </div>
        ) : (
          <div className="auth-hint">{error || 'Loading...'}</div>
        )}
      </div>
    </div>
  );
}
