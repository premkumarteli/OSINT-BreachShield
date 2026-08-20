import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import bgVideo1 from '../bg1.mp4';

export default function GlobalBackground() {
  const ref = useRef(null);
  const location = useLocation();
  const isSearchRoute = location.pathname.startsWith('/search');

  useEffect(() => {
    // Toggle global background flag depending on route.
    // Hide global background on /search so App can control bg1/bg2/bg3 videos.
    window.__GLOBAL_BG_ACTIVE = !isSearchRoute;
    const v = ref.current;
    if (!v) return;
    if (isSearchRoute) {
      try { v.pause(); } catch (_) {}
    } else {
      // best-effort autoplay (muted + playsInline)
      v.play?.().catch(() => {});
    }
  }, [isSearchRoute]);

  if (isSearchRoute) return null;
  return (
    <video ref={ref} className="bg-video" autoPlay muted loop playsInline aria-hidden>
      <source src={bgVideo1} type="video/mp4" />
    </video>
  );
}
