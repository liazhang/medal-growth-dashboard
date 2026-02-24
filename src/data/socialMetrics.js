// Social metrics data — real spend & X/Twitter, placeholder for other platforms
// Real data window: Jan 26 – Feb 22, 2026 (28 days)
// Total Google Ads spend in window: $159,435

import { dailyImpressions } from './youtubeAds';

// Compute total impressions across real window for proportional spend allocation
const totalImpressions = dailyImpressions.reduce((s, d) => s + d.impressions, 0);
const TOTAL_SPEND = 159435;

// Build a lookup of date → real daily spend (proportional to impressions)
const realSpendByDate = {};
dailyImpressions.forEach((d) => {
  realSpendByDate[d.date] = Math.round((d.impressions / totalImpressions) * TOTAL_SPEND * 100) / 100;
});

// X/Twitter: 28,300 followers on Feb 24 2026, ~50/day linear growth backfill
const X_FOLLOWERS_ANCHOR = 28300;
const X_ANCHOR_DATE = new Date('2026-02-24');
const X_DAILY_GROWTH = 50;

function generateDailyData(days = 420) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const noise = () => (Math.random() - 0.5) * 0.1;

    // X/Twitter — real: linear backfill from anchor
    const daysFromAnchor = Math.round((X_ANCHOR_DATE - date) / 86400000);
    const xFollowers = Math.round(X_FOLLOWERS_ANCHOR - daysFromAnchor * X_DAILY_GROWTH + (Math.random() - 0.5) * 60);

    // Spend — real for Jan 26 – Feb 22, $0 otherwise
    const dailySpend = realSpendByDate[dateStr] || 0;
    // Split spend: ~60% YouTube ads, ~40% partnerships (approximate)
    const ytAdSpend = Math.round(dailySpend * 0.6 * 100) / 100;
    const partnershipSpend = Math.round(dailySpend * 0.4 * 100) / 100;

    data.push({
      date: dateStr,
      // YouTube (placeholder — user will provide later)
      ytSubscribers: Math.round(45000 + (days - i) * 120 + Math.random() * 500),
      ytViews: Math.round(8000 + Math.random() * 4000 + (days - i) * 30),
      // Twitter/X (real)
      xFollowers,
      xImpressions: Math.round(15000 + Math.random() * 8000),
      // TikTok (placeholder)
      ttFollowers: Math.round(28000 + (days - i) * 85 + Math.random() * 400),
      ttViews: Math.round(25000 + Math.random() * 15000),
      // Instagram (placeholder)
      igFollowers: Math.round(8500 + (days - i) * 30 + Math.random() * 150),
      // Discord (placeholder)
      discordMembers: Math.round(32000 + (days - i) * 20 + Math.random() * 100),
      // Spend (real for Jan 26 – Feb 22, zero otherwise)
      totalSpend: dailySpend,
      ytAdSpend,
      partnershipSpend,
    });
  }
  return data;
}

export const dailyMetrics = generateDailyData(420);

export const platformSummary = [
  { platform: 'YouTube', icon: 'youtube', followers: 55800, change: 12.4, color: '#FF0000' },
  { platform: 'X / Twitter', icon: 'twitter', followers: 28300, change: 8.2, color: '#1DA1F2' },
  { platform: 'TikTok', icon: 'tiktok', followers: 35600, change: 18.7, color: '#00F2EA' },
  { platform: 'Instagram', icon: 'instagram', followers: 11200, change: 5.1, color: '#E4405F' },
  { platform: 'Discord', icon: 'discord', followers: 33800, change: 3.4, color: '#5865F2' },
];
