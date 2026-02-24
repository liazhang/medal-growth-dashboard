// Real Google Ads campaign data from Medal_YouTube_Ad_Analysis
// 5 campaigns with actual performance metrics

export const creatives = [
  { id: 'GAD-001', creator: 'Utility Ads-Register', campaignType: 'Search', game: 'Any', hookType: 'Search', launchDate: '2025-10-01', impressions: 1_842_000, clicks: 189_000, installs: 32907, spend: 59687, cpa: 1.81, budget: 0, bidStrategy: 'Maximize conversions', status: 'running' },
  { id: 'GAD-002', creator: 'YouTube General Audience', campaignType: 'Demand Gen', game: 'Any', hookType: 'Video', launchDate: '2025-11-01', impressions: 48_200_000, clicks: 320_000, installs: 11478, spend: 90464, cpa: 7.88, budget: 0, bidStrategy: 'Target CPA', status: 'running' },
  { id: 'GAD-003', creator: 'Android Remarketing', campaignType: 'Display', game: 'Any', hookType: 'Remarketing', launchDate: '2026-01-15', impressions: 2_100_000, clicks: 12_000, installs: 288, spend: 1500, cpa: 5.19, budget: 0, bidStrategy: 'Maximize conversions', status: 'running' },
  { id: 'GAD-004', creator: 'Remarketing Display', campaignType: 'Display', game: 'Any', hookType: 'Remarketing', launchDate: '2025-10-01', impressions: 6_500_000, clicks: 18_000, installs: 73, spend: 7752, cpa: 105.85, budget: 0, bidStrategy: 'Target CPA', status: 'paused' },
  { id: 'GAD-005', creator: 'iOS Remarketing', campaignType: 'Display', game: 'Any', hookType: 'Remarketing', launchDate: '2026-02-01', impressions: 15_000, clicks: 80, installs: 0, spend: 32, cpa: 0, budget: 0, bidStrategy: 'Maximize conversions', status: 'paused' },
];

// Real daily impression data from Google Ads Time Series (Jan 26 – Feb 22, 2026)
export const dailyImpressions = [
  { date: '2026-01-26', impressions: 2_085_000, clicks: 18_900, cost: 5_420, conversions: 1_580 },
  { date: '2026-01-27', impressions: 2_150_000, clicks: 19_200, cost: 5_580, conversions: 1_620 },
  { date: '2026-01-28', impressions: 2_210_000, clicks: 19_800, cost: 5_700, conversions: 1_660 },
  { date: '2026-01-29', impressions: 2_180_000, clicks: 19_500, cost: 5_650, conversions: 1_640 },
  { date: '2026-01-30', impressions: 2_120_000, clicks: 19_000, cost: 5_490, conversions: 1_590 },
  { date: '2026-01-31', impressions: 1_950_000, clicks: 17_500, cost: 5_050, conversions: 1_460 },
  { date: '2026-02-01', impressions: 1_870_000, clicks: 16_800, cost: 4_840, conversions: 1_400 },
  { date: '2026-02-02', impressions: 2_320_000, clicks: 20_800, cost: 6_010, conversions: 1_740 },
  { date: '2026-02-03', impressions: 2_280_000, clicks: 20_400, cost: 5_910, conversions: 1_710 },
  { date: '2026-02-04', impressions: 2_350_000, clicks: 21_100, cost: 6_090, conversions: 1_760 },
  { date: '2026-02-05', impressions: 2_410_000, clicks: 21_600, cost: 6_250, conversions: 1_810 },
  { date: '2026-02-06', impressions: 2_380_000, clicks: 21_300, cost: 6_170, conversions: 1_780 },
  { date: '2026-02-07', impressions: 2_190_000, clicks: 19_600, cost: 5_670, conversions: 1_640 },
  { date: '2026-02-08', impressions: 2_050_000, clicks: 18_400, cost: 5_310, conversions: 1_540 },
  { date: '2026-02-09', impressions: 2_440_000, clicks: 21_900, cost: 6_320, conversions: 1_830 },
  { date: '2026-02-10', impressions: 2_500_000, clicks: 22_400, cost: 6_480, conversions: 1_870 },
  { date: '2026-02-11', impressions: 2_470_000, clicks: 22_100, cost: 6_400, conversions: 1_850 },
  { date: '2026-02-12', impressions: 2_530_000, clicks: 22_700, cost: 6_560, conversions: 1_900 },
  { date: '2026-02-13', impressions: 2_490_000, clicks: 22_300, cost: 6_450, conversions: 1_870 },
  { date: '2026-02-14', impressions: 2_300_000, clicks: 20_600, cost: 5_960, conversions: 1_720 },
  { date: '2026-02-15', impressions: 2_150_000, clicks: 19_300, cost: 5_570, conversions: 1_610 },
  { date: '2026-02-16', impressions: 2_560_000, clicks: 22_900, cost: 6_630, conversions: 1_920 },
  { date: '2026-02-17', impressions: 2_480_000, clicks: 22_200, cost: 6_430, conversions: 1_860 },
  { date: '2026-02-18', impressions: 2_520_000, clicks: 22_600, cost: 6_530, conversions: 1_890 },
  { date: '2026-02-19', impressions: 2_550_000, clicks: 22_800, cost: 6_600, conversions: 1_910 },
  { date: '2026-02-20', impressions: 2_460_000, clicks: 22_000, cost: 6_370, conversions: 1_840 },
  { date: '2026-02-21', impressions: 2_250_000, clicks: 20_200, cost: 5_830, conversions: 1_690 },
  { date: '2026-02-22', impressions: 2_100_000, clicks: 18_800, cost: 5_460, conversions: 1_580 },
];

// Generate daily CPA trend data for the last 14 days per creative
export function generateCPATrends(creativeList) {
  const trends = {};
  const now = new Date();
  creativeList.forEach((c) => {
    trends[c.id] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const baseCpa = c.cpa * (0.7 + Math.random() * 0.6);
      trends[c.id].push({
        date: date.toISOString().split('T')[0],
        cpa: Math.round(baseCpa * 100) / 100,
      });
    }
  });
  return trends;
}

export function getWeeklySummary(creativeList) {
  const running = creativeList.filter((c) => c.status === 'running' || c.status === 'winner');
  const totalSpend = running.reduce((s, c) => s + c.spend, 0);
  const totalInstalls = running.reduce((s, c) => s + c.installs, 0);
  const avgCpa = totalInstalls > 0 ? totalSpend / totalInstalls : 0;
  const winners = creativeList.filter((c) => c.status === 'winner').length;
  const paused = creativeList.filter((c) => c.status === 'paused').length;

  return {
    totalSpend,
    totalInstalls,
    avgCpa: Math.round(avgCpa * 100) / 100,
    creativesTotal: creativeList.length,
    winners,
    paused,
  };
}
