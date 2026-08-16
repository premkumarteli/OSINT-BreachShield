import React, { useEffect, useRef, useState } from 'react';
import api from '../lib/api';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function DarkWebTicker() {
  const [alerts, setAlerts] = useState([]);
  const [watch, setWatch] = useState([]);
  const [open, setOpen] = useState(false);
  const evtRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const wl = await api.get('/api/darkweb/watchlist');
        if (!cancelled) setWatch(wl.data.watchlist || []);
      } catch (_) {}
    })();
    const es = new EventSource(`${API_BASE}/api/darkweb/stream`, { withCredentials: true });
    evtRef.current = es;
    es.addEventListener('hello', (e) => {
      try { const d = JSON.parse(e.data); if (Array.isArray(d.watchlist)) setWatch(d.watchlist); } catch {}
    });
    es.addEventListener('alert', (e) => {
      try {
        const data = JSON.parse(e.data);
        setAlerts(prev => [{ ...data }, ...prev].slice(0, 8));
      } catch {}
    });
    es.addEventListener('heartbeat', () => {});
    es.onerror = () => { /* keep open; server may reconnect */ };
    return () => { cancelled = true; try { es.close(); } catch(_){} };
  }, []);

  // Add keyword is disabled by request — ticker is read-only now.

  return (
    <div className={`dw-wrap ${open ? 'open' : ''}`}>
      <button className="dw-chip" onClick={() => setOpen(v => !v)}>
        <span className="dot" /> Dark Web Monitor
      </button>
      {open && (
        <div className="dw-panel">
          {/* Add keyword UI removed: read-only view */}
          {watch.length > 0 && (
            <div className="dw-watch">Watching: {watch.join(', ')}</div>
          )}
          <div className="dw-alerts">
            {alerts.map(a => (
              <div className={`dw-card risk-${a.risk}`} key={a.id}>
                <div className="dw-head">
                  <span className="kw">{a.keyword}</span>
                  <span className="src">{a.source}</span>
                </div>
                <div className="dw-body">{a.snippet}</div>
                <div className="dw-foot">{new Date(a.ts).toLocaleTimeString()} • {a.risk.toUpperCase()}</div>
              </div>
            ))}
            {alerts.length === 0 && <div className="dw-empty">No alerts yet</div>}
          </div>
        </div>
      )}
    </div>
  );
}
