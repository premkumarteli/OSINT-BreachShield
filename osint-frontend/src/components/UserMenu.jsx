import React, { useEffect, useState, useRef } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function UserMenu() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/api/auth/me');
        if (mounted) setUser(res.data.user);
      } catch (_) {
        // not logged in; hide menu
      }
    })();
    const onClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => { mounted = false; document.removeEventListener('click', onClick); };
  }, []);

  const initials = (name, email) => {
    const base = (name || email || '').trim();
    if (!base) return 'U';
    const parts = base.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return base.slice(0, 2).toUpperCase();
  };

  const logout = async () => {
    try { await api.post('/api/auth/logout'); } catch (_) {}
    navigate('/search', { replace: true });
  };

  if (!user) return null;

  return (
    <div ref={menuRef} className="user-menu">
      <button
        className={`user-avatar ${open ? 'open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`User menu for ${user?.username || user?.email || 'user'}`}
      >
        <span className="avatar-ring">
          <svg className="avatar-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1c0 .552.448 1 1 1h14c.552 0 1-.448 1-1v-1c0-2.761-3.582-5-8-5z" />
          </svg>
        </span>
        <span className="caret" />
      </button>
      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-id">
            <div className="name">{user.username || 'User'}</div>
            <div className="email">{user.email}</div>
          </div>
          <button className="logout-pill" onClick={logout} role="menuitem">Logout</button>
        </div>
      )}
    </div>
  );
}
