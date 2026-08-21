/**
 * @file sessionTracker.js
 * @description Authoritative SQLite/filesystem-backed session tracking engine with in-memory caching,
 * heartbeat timeout evaluation, IP privacy masking, active session termination, and target blacklisting.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const BLACKLIST_FILE = path.join(DATA_DIR, 'blacklist.json');

// In-memory active cache
let activeSessions = new Map();
let sessionHistory = [];
let blacklist = new Set();

// Initialize persistence
function loadPersistedData() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8') || '{}');
      if (Array.isArray(data.active)) {
        activeSessions = new Map(data.active.map(s => [s.sessionId, s]));
      }
      if (Array.isArray(data.history)) {
        sessionHistory = data.history;
      }
    }
    if (fs.existsSync(BLACKLIST_FILE)) {
      const list = JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8') || '[]');
      blacklist = new Set(list);
    }
  } catch (e) {
    console.warn('Failed to load persisted sessions, initializing fresh memory store:', e.message);
  }
}

let persistTimer = null;
let isPersisting = false;

function schedulePersist(delayMs = 200) {
  if (persistTimer) return;
  persistTimer = setTimeout(async () => {
    persistTimer = null;
    await flushPersistedData();
  }, delayMs);
}

async function flushPersistedData() {
  if (isPersisting) return;
  isPersisting = true;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    const data = {
      active: Array.from(activeSessions.values()),
      history: sessionHistory.slice(-500)
    };
    await Promise.all([
      fs.promises.writeFile(SESSIONS_FILE, JSON.stringify(data, null, 2), 'utf8'),
      fs.promises.writeFile(BLACKLIST_FILE, JSON.stringify(Array.from(blacklist), null, 2), 'utf8')
    ]);
  } catch (e) {
    console.warn('Failed to asynchronously persist session data:', e.message);
  } finally {
    isPersisting = false;
  }
}

function savePersistedData() {
  schedulePersist();
}

loadPersistedData();

/**
 * Mask IP address for administrative privacy (e.g., 192.168.1.42 -> 192.168.••.42)
 */
function maskIp(ip) {
  if (!ip) return '•••.•••.•••.•••';
  const cleanIp = ip.replace(/^::ffff:/, '').trim();
  if (cleanIp.includes('.')) {
    const parts = cleanIp.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.••.${parts[3]}`;
    }
  }
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    return `${parts[0]}:${parts[1]}:••:••`;
  }
  return '•••.•••.•••.•••';
}

/**
 * Parse basic client metadata from User-Agent
 */
function parseClientInfo(ua) {
  if (!ua) return { device: 'Desktop', browser: 'Web Browser', os: 'Unknown OS' };
  let device = 'Desktop';
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    device = /ipad|tablet/i.test(ua) ? 'Tablet' : 'Mobile';
  }

  let os = 'Unknown OS';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ios/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';

  return { device, browser, os };
}

/**
 * Register or refresh a user session
 */
function registerOrTouchSession(userTarget, ip, userAgent, currentPage = '/') {
  const target = (userTarget || 'Anonymous Visitor').trim();
  const rawIp = (ip || '').replace(/^::ffff:/, '').trim();
  const { device, browser, os } = parseClientInfo(userAgent);
  const now = Date.now();

  // Look for existing active session for this target
  for (const session of activeSessions.values()) {
    if (session.userTarget.toLowerCase() === target.toLowerCase()) {
      session.lastActivity = now;
      session.currentPage = currentPage;
      session.ip = rawIp;
      session.maskedIp = maskIp(rawIp);
      savePersistedData();
      return session;
    }
  }

  // Create new session
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newSession = {
    sessionId,
    userTarget: target,
    ip: rawIp,
    maskedIp: maskIp(rawIp),
    device,
    browser,
    os,
    currentPage,
    startTime: now,
    lastActivity: now,
    state: 'ONLINE'
  };

  activeSessions.set(sessionId, newSession);
  savePersistedData();
  return newSession;
}

/**
 * Handle heartbeat from client
 */
function touchHeartbeat(sessionId, currentPage) {
  if (!sessionId) return false;
  const session = activeSessions.get(sessionId);
  if (session) {
    session.lastActivity = Date.now();
    if (currentPage) session.currentPage = currentPage;
    session.state = 'ONLINE';
    savePersistedData();
    return true;
  }
  return false;
}

/**
 * Terminate/Revoke an active session
 */
function terminateSession(sessionId) {
  if (!sessionId) return false;
  const session = activeSessions.get(sessionId);
  if (session) {
    sessionHistory.unshift({
      sessionId: session.sessionId,
      userTarget: session.userTarget,
      maskedIp: session.maskedIp,
      device: session.device,
      browser: session.browser,
      os: session.os,
      startTime: session.startTime,
      endTime: Date.now(),
      durationSeconds: Math.max(1, Math.round((Date.now() - session.startTime) / 1000)),
      terminatedByAdmin: true
    });
    activeSessions.delete(sessionId);
    savePersistedData();
    return true;
  }
  return false;
}

/**
 * Blacklist / Unblacklist target
 */
function blacklistTarget(target) {
  if (!target) return false;
  blacklist.add(String(target).toLowerCase().trim());
  savePersistedData();
  return true;
}

function unblacklistTarget(target) {
  if (!target) return false;
  blacklist.delete(String(target).toLowerCase().trim());
  savePersistedData();
  return true;
}

function isBlacklisted(target) {
  if (!target) return false;
  return blacklist.has(String(target).toLowerCase().trim());
}

/**
 * Authoritative Evaluation:
 * < 2 min: ONLINE
 * 2-15 min: IDLE
 * > 15 min: EXPIRED (migrated to history)
 */
function getActiveSessions() {
  const now = Date.now();
  const activeList = [];
  const expiredIds = [];

  for (const [id, session] of activeSessions.entries()) {
    const diff = now - session.lastActivity;
    if (diff < 120 * 1000) {
      session.state = 'ONLINE';
      activeList.push(session);
    } else if (diff <= 900 * 1000) {
      session.state = 'IDLE';
      activeList.push(session);
    } else {
      // Expired: Archive to history
      expiredIds.push(id);
      sessionHistory.unshift({
        sessionId: session.sessionId,
        userTarget: session.userTarget,
        maskedIp: session.maskedIp,
        device: session.device,
        browser: session.browser,
        os: session.os,
        startTime: session.startTime,
        endTime: session.lastActivity,
        durationSeconds: Math.max(1, Math.round((session.lastActivity - session.startTime) / 1000))
      });
    }
  }

  for (const id of expiredIds) {
    activeSessions.delete(id);
  }

  if (expiredIds.length > 0) {
    savePersistedData();
  }

  return activeList.sort((a, b) => b.lastActivity - a.lastActivity);
}

/**
 * Return historical completed sessions
 */
function getSessionHistory(limit = 50) {
  getActiveSessions(); // Flush expired into history
  return sessionHistory.slice(0, limit);
}

module.exports = {
  registerOrTouchSession,
  touchHeartbeat,
  terminateSession,
  blacklistTarget,
  unblacklistTarget,
  isBlacklisted,
  getActiveSessions,
  getSessionHistory,
  maskIp
};
