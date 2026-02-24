/**
 * Google Ads API service layer
 * Fetches YouTube campaign data using the Google Ads API (GAQL queries)
 *
 * Standard Google Ads export fields mapped:
 *   campaign.name, campaign.id, campaign.status
 *   ad_group.name, ad_group.id
 *   ad_group_ad.ad.name, ad_group_ad.ad.id, ad_group_ad.status
 *   ad_group_ad.ad.video_ad.video.asset  (creative-level)
 *   metrics.impressions, metrics.clicks, metrics.conversions,
 *   metrics.cost_micros, metrics.video_views, metrics.ctr
 *   segments.date
 */

import { google } from 'googleapis';

// ── Auth helper ──────────────────────────────────────────────────────
function buildAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_ADS_CLIENT_ID,
    process.env.GOOGLE_ADS_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  });
  return oauth2Client;
}

// Google Ads REST v18 base URL
const API_VERSION = 'v18';
const BASE = `https://googleads.googleapis.com/${API_VERSION}/customers`;

async function gaqlQuery(customerId, query, authClient) {
  const token = await authClient.getAccessToken();
  const url = `${BASE}/${customerId}/googleAds:searchStream`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.token}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      'Content-Type': 'application/json',
      ...(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        ? { 'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID }
        : {}),
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Google Ads API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  // searchStream returns array of batches, each with a results array
  const rows = [];
  for (const batch of data) {
    if (batch.results) rows.push(...batch.results);
  }
  return rows;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Fetch YouTube video campaign performance (ad-group level)
 * Returns creative-level data similar to our fixture format
 */
export async function fetchYouTubeCreatives(dateFrom, dateTo) {
  const auth = buildAuthClient();
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  // Fetch ad-group ad level data for video campaigns
  const query = `
    SELECT
      campaign.name,
      campaign.id,
      campaign.status,
      ad_group.name,
      ad_group.id,
      ad_group_ad.ad.name,
      ad_group_ad.ad.id,
      ad_group_ad.status,
      ad_group_ad.ad.type,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.cost_micros,
      metrics.video_views,
      metrics.all_conversions
    FROM ad_group_ad
    WHERE campaign.advertising_channel_type = 'VIDEO'
      AND segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
    ORDER BY metrics.cost_micros DESC
  `;

  const rows = await gaqlQuery(customerId, query, auth);

  // Aggregate by ad_group_ad.ad.id (one row per creative)
  const byAd = {};
  for (const row of rows) {
    const adId = row.adGroupAd.ad.id;
    if (!byAd[adId]) {
      byAd[adId] = {
        id: `AD-${adId}`,
        adId,
        campaignName: row.campaign.name,
        campaignId: row.campaign.id,
        adGroupName: row.adGroup.name,
        adName: row.adGroupAd.ad.name || row.adGroup.name,
        adType: row.adGroupAd.ad.type,
        status: mapStatus(row.adGroupAd.status),
        impressions: 0,
        clicks: 0,
        installs: 0,
        spend: 0,
        videoViews: 0,
      };
    }
    byAd[adId].impressions += parseInt(row.metrics.impressions || 0, 10);
    byAd[adId].clicks += parseInt(row.metrics.clicks || 0, 10);
    byAd[adId].installs += parseFloat(row.metrics.conversions || 0);
    byAd[adId].spend += parseInt(row.metrics.costMicros || 0, 10) / 1_000_000;
    byAd[adId].videoViews += parseInt(row.metrics.videoViews || 0, 10);
  }

  // Calculate CPA and format
  return Object.values(byAd).map((ad) => ({
    id: ad.id,
    creator: ad.adName || ad.adGroupName,
    game: extractGame(ad.campaignName),
    hookType: extractHook(ad.adName || ad.adGroupName),
    launchDate: dateFrom,
    impressions: ad.impressions,
    clicks: ad.clicks,
    installs: Math.round(ad.installs),
    spend: Math.round(ad.spend * 100) / 100,
    cpa: ad.installs > 0 ? Math.round((ad.spend / ad.installs) * 100) / 100 : 0,
    videoViews: ad.videoViews,
    status: ad.status,
    campaignName: ad.campaignName,
  }));
}

/**
 * Fetch daily CPA trend data for active creatives
 */
export async function fetchCPATrends(dateFrom, dateTo) {
  const auth = buildAuthClient();
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  const query = `
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group.name,
      segments.date,
      metrics.conversions,
      metrics.cost_micros
    FROM ad_group_ad
    WHERE campaign.advertising_channel_type = 'VIDEO'
      AND ad_group_ad.status = 'ENABLED'
      AND segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
    ORDER BY segments.date ASC
  `;

  const rows = await gaqlQuery(customerId, query, auth);

  // Group by ad.id → array of daily points
  const trends = {};
  for (const row of rows) {
    const adId = `AD-${row.adGroupAd.ad.id}`;
    if (!trends[adId]) trends[adId] = [];

    const spend = parseInt(row.metrics.costMicros || 0, 10) / 1_000_000;
    const conversions = parseFloat(row.metrics.conversions || 0);
    const cpa = conversions > 0 ? spend / conversions : 0;

    trends[adId].push({
      date: row.segments.date,
      cpa: Math.round(cpa * 100) / 100,
      spend: Math.round(spend * 100) / 100,
      conversions: Math.round(conversions),
    });
  }

  return trends;
}

/**
 * Fetch campaign-level summary for the overview page
 */
export async function fetchCampaignSummary(dateFrom, dateTo) {
  const auth = buildAuthClient();
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  const query = `
    SELECT
      campaign.name,
      campaign.id,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.cost_micros,
      metrics.video_views
    FROM campaign
    WHERE campaign.advertising_channel_type = 'VIDEO'
      AND segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
    ORDER BY metrics.cost_micros DESC
  `;

  const rows = await gaqlQuery(customerId, query, auth);

  return rows.map((row) => ({
    name: row.campaign.name,
    id: row.campaign.id,
    status: mapStatus(row.campaign.status),
    impressions: parseInt(row.metrics.impressions || 0, 10),
    clicks: parseInt(row.metrics.clicks || 0, 10),
    conversions: parseFloat(row.metrics.conversions || 0),
    spend: parseInt(row.metrics.costMicros || 0, 10) / 1_000_000,
    videoViews: parseInt(row.metrics.videoViews || 0, 10),
  }));
}

/**
 * Test connectivity — used for the status indicator
 */
export async function testConnection() {
  const auth = buildAuthClient();
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  const query = `
    SELECT customer.descriptive_name, customer.id
    FROM customer
    LIMIT 1
  `;

  const rows = await gaqlQuery(customerId, query, auth);
  if (rows.length > 0) {
    return {
      connected: true,
      accountName: rows[0].customer.descriptiveName,
      customerId: rows[0].customer.id,
    };
  }
  throw new Error('No customer data returned');
}

// ── Helpers ──────────────────────────────────────────────────────────

function mapStatus(googleStatus) {
  const map = {
    ENABLED: 'running',
    PAUSED: 'paused',
    REMOVED: 'paused',
  };
  return map[googleStatus] || 'paused';
}

// Extract game name from campaign name (e.g., "Medal - Fortnite - CPA" → "Fortnite")
function extractGame(campaignName) {
  const parts = campaignName.split(/[-–—|]/);
  if (parts.length >= 2) {
    return parts[1].trim();
  }
  return campaignName;
}

// Extract hook/creative type from ad group or ad name
function extractHook(name) {
  const hooks = [
    'Gameplay Montage', 'Tutorial', 'Highlight Reel', 'UGC Integration',
    'How-To', 'Social Proof', 'Before/After', 'Feature Demo',
    'Testimonial', 'Search', 'Discovery', 'In-Stream', 'Bumper',
  ];
  for (const hook of hooks) {
    if (name.toLowerCase().includes(hook.toLowerCase())) return hook;
  }
  // Default: use the name itself as the hook type
  return name.length > 30 ? name.substring(0, 30) + '...' : name;
}
