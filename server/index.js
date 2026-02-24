/**
 * Express API proxy server for Google Ads data
 *
 * Runs alongside the Vite dev server. The React frontend
 * calls these endpoints to fetch live Google Ads data.
 *
 * Usage:
 *   1. Copy .env.example → .env and fill in your credentials
 *   2. node server/index.js
 *   3. The Vite frontend proxies /api/* to this server
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  fetchYouTubeCreatives,
  fetchCPATrends,
  fetchCampaignSummary,
  testConnection,
} from './googleAds.js';

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

// ── Health / Connection check ────────────────────────────────────────
app.get('/api/google-ads/status', async (_req, res) => {
  try {
    // Quick check: are env vars set?
    const requiredVars = [
      'GOOGLE_ADS_DEVELOPER_TOKEN',
      'GOOGLE_ADS_CLIENT_ID',
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_REFRESH_TOKEN',
      'GOOGLE_ADS_CUSTOMER_ID',
    ];
    const missing = requiredVars.filter(
      (v) => !process.env[v] || process.env[v].startsWith('your-')
    );

    if (missing.length > 0) {
      return res.json({
        connected: false,
        configured: false,
        message: `Missing env vars: ${missing.join(', ')}`,
      });
    }

    const result = await testConnection();
    res.json({ ...result, configured: true });
  } catch (err) {
    res.json({
      connected: false,
      configured: true,
      message: err.message,
    });
  }
});

// ── YouTube Creatives ────────────────────────────────────────────────
app.get('/api/google-ads/creatives', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'Missing from/to date params (YYYY-MM-DD)' });
    }
    const data = await fetchYouTubeCreatives(from, to);
    res.json({ creatives: data });
  } catch (err) {
    console.error('Error fetching creatives:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── CPA Trends ───────────────────────────────────────────────────────
app.get('/api/google-ads/cpa-trends', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'Missing from/to date params (YYYY-MM-DD)' });
    }
    const data = await fetchCPATrends(from, to);
    res.json({ trends: data });
  } catch (err) {
    console.error('Error fetching CPA trends:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Campaign Summary ─────────────────────────────────────────────────
app.get('/api/google-ads/campaigns', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'Missing from/to date params (YYYY-MM-DD)' });
    }
    const data = await fetchCampaignSummary(from, to);
    res.json({ campaigns: data });
  } catch (err) {
    console.error('Error fetching campaigns:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  Google Ads API server running at http://localhost:${PORT}`);
  console.log(`  Endpoints:`);
  console.log(`    GET /api/google-ads/status`);
  console.log(`    GET /api/google-ads/creatives?from=YYYY-MM-DD&to=YYYY-MM-DD`);
  console.log(`    GET /api/google-ads/cpa-trends?from=YYYY-MM-DD&to=YYYY-MM-DD`);
  console.log(`    GET /api/google-ads/campaigns?from=YYYY-MM-DD&to=YYYY-MM-DD\n`);
});
