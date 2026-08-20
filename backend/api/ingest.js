/**
 * @file api/ingest.js
 * @description Catalog lookup, range query, and batch dataset ingestion controller.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { getRange, ingestBatch } = require('../ingest/kAnonymityStore');
const { requireAdminToken } = require('../middleware/authGuard');

const router = express.Router();

const CATALOG_FILE = path.join(__dirname, '..', '..', 'data', 'catalog', 'breaches.json');
const CATALOG_INDEX_FILE = path.join(__dirname, '..', '..', 'data', 'catalog', 'breaches_index.json');

const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.adminUser?.sub || req.adminUser?.email || req.ip,
  message: { error: 'Too many ingestion requests. Limit is 10 requests per minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

// GET /range/:prefix
router.get('/range/:prefix', (req, res) => {
  try {
    const prefix = (req.params.prefix || '').trim().toUpperCase();
    if (!/^[0-9A-F]{5}$/.test(prefix)) {
      return res.status(400).json({ error: 'Prefix must be a 5-character hexadecimal string' });
    }
    const results = getRange(prefix);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, prefix: prefix.toUpperCase(), count: results.length, matches: results });
    }
    const textStream = results.map(r => `${r.suffix}:${r.count}:${r.sources.join(',')}:${r.dataClasses.join(',')}:${r.year}`).join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(textStream);
  } catch (err) {
    console.error('Range query error:', err.message);
    res.status(500).json({ error: 'Failed to query hash range' });
  }
});

// GET /breaches
router.get('/breaches', (req, res) => {
  try {
    if (!fs.existsSync(CATALOG_FILE)) {
      return res.json({ success: true, count: 0, breaches: [] });
    }
    const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8') || '[]');
    const domainFilter = req.query.domain ? String(req.query.domain).toLowerCase() : null;
    const filtered = domainFilter ? catalog.filter(b => (b.domain || '').toLowerCase().includes(domainFilter)) : catalog;
    res.json({ success: true, count: filtered.length, breaches: filtered });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load breach catalog' });
  }
});

// GET /breaches/:name
router.get('/breaches/:name', (req, res) => {
  try {
    if (!fs.existsSync(CATALOG_INDEX_FILE)) {
      return res.status(404).json({ error: 'Breach index not found' });
    }
    const index = JSON.parse(fs.readFileSync(CATALOG_INDEX_FILE, 'utf8') || '{}');
    const targetName = String(req.params.name).toLowerCase();
    const breach = index.byName ? index.byName[targetName] : null;
    if (!breach) {
      return res.status(404).json({ error: 'Breach record not found in catalog' });
    }
    res.json({ success: true, breach });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve breach detail' });
  }
});

// POST /ingest
router.post('/ingest', requireAdminToken, ingestLimiter, (req, res) => {
  try {
    const { records = [] } = req.body || {};
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'records array is required' });
    }
    const result = ingestBatch(records);
    res.json({ success: true, ingested: result.ingested });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
