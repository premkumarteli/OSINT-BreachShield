/**
 * @file authGuard.js
 * @description Centralized authentication & authorization middlewares.
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * Reusable OTP Verification Middleware
 * Requires verified === true in JWT payload from Header, Cookie, Body, or Query.
 */
function verifyOtpToken(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies?.otp_token) {
      token = req.cookies.otp_token;
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.body?.token) {
      token = req.body.token;
    } else if (req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(403).json({ error: 'Verification required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.verified !== true) {
      return res.status(403).json({ error: 'Verification required' });
    }

    req.verifiedUser = decoded;
    return next();
  } catch (err) {
    return res.status(403).json({ error: 'Verification required' });
  }
}

/**
 * Admin JWT Verification Middleware
 * Requires role === 'admin' in JWT payload.
 */
function requireAdminToken(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies?.admin_token) {
      token = req.cookies.admin_token;
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers['x-admin-token']) {
      token = req.headers['x-admin-token'];
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized: Admin privileges required' });
    }

    req.adminUser = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin token' });
  }
}

module.exports = {
  verifyOtpToken,
  requireAdminToken
};
