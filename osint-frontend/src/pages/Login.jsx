import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import '../auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true); setError('');
      await api.post('/api/auth/login', { email, password });
      navigate('/search', { replace: true });
    } catch (e) {
      if (!e.response) {
        setError('Cannot reach server. Make sure backend is running on http://localhost:5000');
      } else {
        setError(e.response?.data?.error || 'Login failed');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-card slide-in">
        <h2 className="auth-title">Login</h2>
        <input className="glass-input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="glass-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="neon-btn" onClick={login} disabled={loading || !email || !password}>Login</button>
  <div className="auth-switch">New here? <Link to="/signup">Create account</Link></div>
        {error && <div className="auth-error">{error}</div>}
      </div>
    
  );
}
