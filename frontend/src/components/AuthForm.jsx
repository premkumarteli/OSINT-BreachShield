import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import '../auth.css';

export default function AuthForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState('collect'); // collect -> otp -> password
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async () => {
    try {
      setError(''); setLoading(true);
      await api.post('/api/auth/send-otp', { username, email });
      setStep('otp');
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    try {
      setError(''); setLoading(true);
      await api.post('/api/auth/verify-otp', { email, otp, username });
      setStep('password');
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  };

  const setPasswordAndCreate = async () => {
    try {
      setError(''); setLoading(true);
      await api.post('/api/auth/set-password', { password });
      navigate('/search', { replace: true });
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-card slide-in">
        {step === 'collect' && (
          <>
            <h2 className="auth-title">Create account</h2>
            <input className="glass-input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <input className="glass-input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <button className="neon-btn" onClick={sendOtp} disabled={loading || !username || !email}>Send OTP</button>
            <div className="auth-switch">Already have an account? <Link to="/login">Login</Link></div>
          </>
        )}
        {step === 'otp' && (
          <>
            <h2 className="auth-title">Verify email</h2>
            <input className="glass-input" placeholder="6-digit OTP" value={otp} maxLength={6} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
            <button className="neon-btn" onClick={verifyOtp} disabled={loading || otp.length !== 6}>Verify</button>
            <div className="auth-hint">Didn't get it? Check spam or <button className="link-btn" onClick={sendOtp} disabled={loading}>resend</button>.</div>
          </>
        )}
        {step === 'password' && (
          <>
            <h2 className="auth-title">Set password</h2>
            <input className="glass-input" placeholder="New password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="neon-btn" onClick={setPasswordAndCreate} disabled={loading || password.length < 6}>Create account</button>
            <div className="auth-hint">Tip: use at least 6 characters.</div>
          </>
        )}
        {error && <div className="auth-error">{error}</div>}
      </div>
  );
}
