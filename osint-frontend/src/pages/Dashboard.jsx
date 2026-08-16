import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import '../auth.css';
import bgVideo2 from '../bg2.mp4';
import SearchHistoryTable from '../components/SearchHistoryTable';

export default function Dashboard() {
  const navigate = useNavigate();
  const globalBgActive = (typeof window !== 'undefined') && Boolean(window.__GLOBAL_BG_ACTIVE);
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [userRes, histRes] = await Promise.allSettled([
          api.get('/api/auth/me'),
          api.get('/api/history')
        ]);

        if (userRes.status === 'fulfilled' && userRes.value.data?.user) {
          setUser(userRes.value.data.user);
        }
        if (histRes.status === 'fulfilled' && histRes.value.data?.history) {
          setHistory(histRes.value.data.history);
        }
      } catch (e) {
        setError('Session expired');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/history/${id}`);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (_) {}
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (_) {}
    navigate('/search', { replace: true });
  };

  return (
    <div className="auth-screen">
      {!globalBgActive && (
        <video className="bg-video" autoPlay muted loop playsInline aria-hidden>
          <source src={bgVideo2} type="video/mp4" />
        </video>
      )}

      <div className="dashboard-container">
        <div className="dash-top-bar">
          <div className="dash-title-group">
            <h1 className="dash-heading">SECURITY AUDIT DASHBOARD</h1>
            <div className="dash-sub">Digital Exposure Intelligence & Investigation Vault</div>
          </div>
          <div className="dash-actions-group">
            <Link className="neon-btn-solid" to="/search">
              ⚡ Launch OSINT Search
            </Link>
            <button className="neon-btn-ghost" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {user && (
          <div className="user-profile-strip">
            <div className="profile-pill">
              <span className="pill-label">USER:</span> <strong>{user.username}</strong>
            </div>
            <div className="profile-pill">
              <span className="pill-label">EMAIL:</span> <strong>{user.email}</strong>
            </div>
            <div className="profile-pill">
              <span className="pill-label">TOTAL INVESTIGATIONS:</span> <strong>{history.length}</strong>
            </div>
          </div>
        )}

        <div className="history-card-panel">
          <div className="panel-head">
            <h2>[ Investigation & Exposure History ]</h2>
            <span className="panel-badge">PERSISTENT AUDIT TRAIL</span>
          </div>

          {loading ? (
            <div className="auth-hint">Loading investigation vault...</div>
          ) : (
            <SearchHistoryTable history={history} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </div>
  );
}
