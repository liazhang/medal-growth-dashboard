/**
 * Parse Google Ads CSV/Excel exports into dashboard-friendly data
 *
 * Supports:
 *   - UTF-8 and UTF-16 encoded files
 *   - CSV (comma-separated) and TSV (tab-separated)
 *   - Time series data (Date + metrics)
 *   - Campaign-level data (Campaign, Impressions, Clicks, Cost, etc.)
 *   - Google Ads report format with title/date header rows
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// ── Column name normalization ────────────────────────────────────────
const COLUMN_MAP = {
  // Campaign / Ad identifiers
  'campaign': 'campaign',
  'campaign name': 'campaign',
  'ad group': 'adGroup',
  'ad group name': 'adGroup',
  'ad': 'adName',
  'ad name': 'adName',
  'ad group ad': 'adName',
  'headline': 'adName',

  // Status
  'status': 'status',
  'campaign status': 'status',
  'ad group status': 'status',
  'ad status': 'status',

  // Metrics
  'impressions': 'impressions',
  'impr.': 'impressions',
  'impr': 'impressions',
  'clicks': 'clicks',
  'interactions': 'interactions',
  'interaction rate': 'interactionRate',
  'conversions': 'conversions',
  'conv.': 'conversions',
  'conv': 'conversions',
  'all conv.': 'conversions',
  'all conversions': 'conversions',
  'conv. (platform comparable)': 'conversions',
  'cost': 'cost',
  'cost / conv.': 'cpa',
  'cost/conv.': 'cpa',
  'cost / conversion': 'cpa',
  'cost / conv. (platform comparable)': 'cpa',
  'avg. cpa': 'cpa',
  'cpa': 'cpa',
  'cost / conv': 'cpa',
  'video views': 'videoViews',
  'views': 'videoViews',
  'ctr': 'ctr',
  'viewable ctr': 'viewableCtr',
  'avg. cpc': 'avgCpc',
  'avg. cpm': 'avgCpm',
  'avg. cpv': 'avgCpv',
  'trueview avg. cpv': 'avgCpv',
  'avg. cost': 'avgCost',
  'conv. rate': 'convRate',
  'conv. value': 'convValue',
  'conv. value / cost': 'convValuePerCost',
  'view rate': 'viewRate',
  'viewable impr.': 'viewableImpressions',

  // Budget & account
  'budget': 'budget',
  'budget type': 'budgetType',
  'account': 'account',
  'campaign type': 'campaignType',
  'type': 'campaignType',
  'currency': 'currency',
  'currency code': 'currencyCode',
  'bid strategy type': 'bidStrategy',
  'optimization score': 'optimizationScore',

  // Dates
  'day': 'date',
  'date': 'date',
  'date range': 'date',
  'start date': 'startDate',
};

function normalizeColumnName(raw) {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[\u200B-\u200D\uFEFF\u0000]/g, '') // zero-width chars + null bytes
    .replace(/\s+/g, ' ');
  return COLUMN_MAP[cleaned] || cleaned;
}

// ── Value parsing ────────────────────────────────────────────────────

function parseNumber(val) {
  if (val === null || val === undefined || val === '' || val === '--' || val === ' --' || val === 'N/A') return 0;
  if (typeof val === 'number') return val;
  // Remove currency symbols, commas, percent signs, quotes
  const cleaned = String(val).replace(/[$€£¥,\s%"]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDate(val) {
  if (!val) return '';
  const s = String(val).trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return s;
}

function parseStatus(val) {
  if (!val) return 'running';
  const s = String(val).toLowerCase().trim();
  if (s.includes('enabled') || s === 'active' || s === 'running' || s.includes('eligible')) return 'running';
  if (s.includes('paused')) return 'paused';
  if (s.includes('removed') || s.includes('deleted')) return 'paused';
  return 'running';
}

// ── File reading ─────────────────────────────────────────────────────

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read a file and auto-detect encoding (UTF-8 or UTF-16)
 */
async function readFileAsText(file) {
  const buffer = await readFileAsArrayBuffer(file);
  const bytes = new Uint8Array(buffer);

  // Check for UTF-16 BOM (FF FE = little-endian, FE FF = big-endian)
  if ((bytes[0] === 0xFF && bytes[1] === 0xFE) || (bytes[0] === 0xFE && bytes[1] === 0xFF)) {
    const decoder = new TextDecoder('utf-16le');
    return decoder.decode(buffer);
  }

  // Check for UTF-16 pattern: every other byte is 0x00 (ASCII chars in UTF-16)
  if (bytes.length > 10 && (bytes[1] === 0x00 || bytes[0] === 0x00)) {
    const decoder = new TextDecoder('utf-16le');
    return decoder.decode(buffer);
  }

  // Default: UTF-8
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(buffer);
}

/**
 * Parse CSV/TSV text, auto-detecting delimiter and skipping header rows
 */
function parseCSVText(text) {
  // Clean up: remove BOM, null bytes
  text = text.replace(/^\uFEFF/, '').replace(/\0/g, '');

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Find the header row (skip title/date rows at the top)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i].toLowerCase();
    if (
      (lower.includes('campaign') && (lower.includes('impressions') || lower.includes('impr') || lower.includes('cost') || lower.includes('clicks') || lower.includes('status'))) ||
      (lower.includes('date') && (lower.includes('impr') || lower.includes('clicks')))
    ) {
      headerIdx = i;
      break;
    }
  }

  const csvText = lines.slice(headerIdx).join('\n');

  // Auto-detect delimiter: if header has tabs, use tab
  const headerLine = lines[headerIdx] || '';
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const delimiter = tabCount > commaCount ? '\t' : ',';

  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      delimiter,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data),
    });
  });
}

async function fileToRows(file) {
  // Handle raw string input (for dev/testing)
  if (typeof file === 'string') {
    return parseCSVText(file);
  }

  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv' || ext === 'tsv') {
    const text = await readFileAsText(file);
    return parseCSVText(text);
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
  }

  throw new Error(`Unsupported file format: .${ext}`);
}

// ── Detect data type ─────────────────────────────────────────────────

function detectDataType(normalizedKeys) {
  const hasDate = normalizedKeys.includes('date');
  const hasCampaign = normalizedKeys.includes('campaign') || normalizedKeys.includes('adGroup') || normalizedKeys.includes('adName');

  if (hasDate && !hasCampaign) return 'timeseries';
  if (hasCampaign) return 'creatives';
  if (hasDate) return 'timeseries';
  return 'creatives';
}

// ── Main parse function ──────────────────────────────────────────────

/**
 * Auto-detect and parse any Google Ads export
 * Returns { type: 'timeseries' | 'creatives', data: [...], columns: [...] }
 */
export async function parseGoogleAdsFile(file) {
  const rows = await fileToRows(file);

  if (rows.length === 0) {
    throw new Error('File appears to be empty or has no data rows');
  }

  // Map raw column names to normalized keys
  const rawKeys = Object.keys(rows[0]);
  const keyMap = {};
  for (const raw of rawKeys) {
    keyMap[raw] = normalizeColumnName(raw);
  }

  const normalizedKeys = Object.values(keyMap);
  const dataType = detectDataType(normalizedKeys);

  if (dataType === 'timeseries') {
    return { type: 'timeseries', data: parseTimeSeries(rows, keyMap), columns: normalizedKeys };
  } else {
    return { type: 'creatives', data: parseCreatives(rows, keyMap), columns: normalizedKeys };
  }
}

function parseTimeSeries(rows, keyMap) {
  const points = [];

  for (const row of rows) {
    const norm = {};
    for (const [rawKey, normKey] of Object.entries(keyMap)) {
      norm[normKey] = row[rawKey];
    }

    const date = parseDate(norm.date);
    if (!date) continue;

    const point = { date };
    if (norm.impressions !== undefined) point.impressions = parseNumber(norm.impressions);
    if (norm.clicks !== undefined) point.clicks = parseNumber(norm.clicks);
    if (norm.conversions !== undefined) point.conversions = parseNumber(norm.conversions);
    if (norm.cost !== undefined) point.cost = parseNumber(norm.cost);
    if (norm.videoViews !== undefined) point.videoViews = parseNumber(norm.videoViews);
    if (norm.ctr !== undefined) point.ctr = parseNumber(norm.ctr);
    if (norm.cpa !== undefined) point.cpa = parseNumber(norm.cpa);
    points.push(point);
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

function parseCreatives(rows, keyMap) {
  const creatives = [];
  let idCounter = 1;

  for (const row of rows) {
    const norm = {};
    for (const [rawKey, normKey] of Object.entries(keyMap)) {
      norm[normKey] = row[rawKey];
    }

    // Skip summary/total rows
    const campaign = String(norm.campaign || '').trim();
    if (campaign.toLowerCase().includes('total') || campaign === '') continue;

    const impressions = parseNumber(norm.impressions);
    const clicks = parseNumber(norm.clicks);
    const interactions = parseNumber(norm.interactions);
    const conversions = parseNumber(norm.conversions);
    const cost = parseNumber(norm.cost);
    const videoViews = parseNumber(norm.videoViews);
    const viewableImpressions = parseNumber(norm.viewableImpressions);

    // Use interactions as clicks if clicks column doesn't exist
    const effectiveClicks = clicks || interactions;

    // Skip rows with no meaningful data at all
    if (impressions === 0 && effectiveClicks === 0 && cost === 0 && viewableImpressions === 0) continue;

    const cpa = norm.cpa
      ? parseNumber(norm.cpa)
      : (conversions > 0 ? cost / conversions : 0);

    creatives.push({
      id: `GAD-${String(idCounter++).padStart(3, '0')}`,
      creator: campaign,
      game: extractGame(campaign),
      hookType: norm.campaignType || norm.adGroup || 'Campaign',
      campaignName: campaign,
      launchDate: parseDate(norm.date || norm.startDate || ''),
      impressions,
      clicks: effectiveClicks,
      installs: Math.round(conversions),
      spend: Math.round(cost * 100) / 100,
      cpa: Math.round(cpa * 100) / 100,
      videoViews,
      viewableImpressions,
      status: parseStatus(norm.status || norm['campaign status']),
      budget: parseNumber(norm.budget),
      campaignType: norm.campaignType || '',
      bidStrategy: norm.bidStrategy || '',
      account: norm.account || '',
    });
  }

  if (creatives.length === 0) {
    throw new Error('No valid ad data found in file.');
  }

  // Sort by spend descending (most spend first)
  creatives.sort((a, b) => b.spend - a.spend);

  return creatives;
}

// ── Helpers ──────────────────────────────────────────────────────────

function extractGame(campaignName) {
  const separators = /[-–—|:]/;
  const parts = campaignName.split(separators).map((p) => p.trim()).filter(Boolean);

  const games = [
    'Fortnite', 'Valorant', 'CS2', 'CSGO', 'Minecraft',
    'Roblox', 'GTA', 'GTA V', 'League of Legends', 'Apex',
    'Call of Duty', 'Overwatch', 'Rocket League', 'PUBG',
    'Destiny', 'Halo', 'Rainbow Six', 'Dota', 'TFT',
    'Elden Ring', 'Arma', 'EA Sports', 'Brawlhalla',
    'Fall Guys', 'War Thunder', 'Escape from Tarkov',
    'Garrys Mod', 'Helldivers', 'Dead by Daylight',
    'Lethal Company', 'Content Warning',
  ];

  for (const part of parts) {
    for (const game of games) {
      if (part.toLowerCase().includes(game.toLowerCase())) return game;
    }
  }

  if (parts.length >= 2) return parts[0];
  return campaignName;
}
