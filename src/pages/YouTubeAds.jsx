import { useState, useMemo, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import ChartContainer from '../components/charts/ChartContainer';
import FileDropZone from '../components/ui/FileDropZone';
import { parseGoogleAdsFile } from '../utils/parseGoogleAds';
import { creatives as realCreatives, dailyImpressions } from '../data/youtubeAds';
import { DollarSign, Download, Zap, Pause, Eye, TrendingUp, FileSpreadsheet, X } from 'lucide-react';

const STATUS_STYLES = {
  running: 'bg-accent/15 text-accent',
  winner: 'bg-success/15 text-success',
  paused: 'bg-text-muted/15 text-text-muted',
};

const CPA_COLOR = (cpa) => {
  if (cpa <= 4) return 'text-success';
  if (cpa <= 8) return 'text-warning';
  return 'text-danger';
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

function formatNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

// ── Time Series View (for daily impression/metric data) ──────────────

function TimeSeriesView({ data, dateRange }) {
  // Filter data by date range
  const filtered = useMemo(() => {
    if (!dateRange) return data;
    const start = dateRange.start.getTime();
    const end = dateRange.end.getTime();
    return data.filter((d) => {
      const t = new Date(d.date).getTime();
      return t >= start && t <= end;
    });
  }, [data, dateRange]);

  // Compute summary stats
  const summary = useMemo(() => {
    const totalImpressions = filtered.reduce((s, d) => s + (d.impressions || 0), 0);
    const totalClicks = filtered.reduce((s, d) => s + (d.clicks || 0), 0);
    const totalCost = filtered.reduce((s, d) => s + (d.cost || 0), 0);
    const totalConversions = filtered.reduce((s, d) => s + (d.conversions || 0), 0);
    const totalViews = filtered.reduce((s, d) => s + (d.videoViews || 0), 0);
    const avgDaily = totalImpressions / (filtered.length || 1);
    const peak = Math.max(...filtered.map((d) => d.impressions || 0));
    const peakDate = filtered.find((d) => (d.impressions || 0) === peak)?.date || '';

    return { totalImpressions, totalClicks, totalCost, totalConversions, totalViews, avgDaily, peak, peakDate, days: filtered.length };
  }, [filtered]);

  // Which metrics exist in the filtered data?
  const hasClicks = filtered.some((d) => d.clicks > 0);
  const hasCost = filtered.some((d) => d.cost > 0);
  const hasConversions = filtered.some((d) => d.conversions > 0);

  const statCards = [
    { label: 'Total Impressions', value: formatNum(summary.totalImpressions), icon: Eye, color: 'text-accent' },
    { label: 'Avg Daily', value: formatNum(Math.round(summary.avgDaily)), icon: TrendingUp, color: 'text-success' },
    { label: 'Peak Day', value: formatNum(summary.peak), icon: Zap, color: 'text-warning' },
    { label: 'Days Tracked', value: summary.days, icon: FileSpreadsheet, color: 'text-text-secondary' },
    ...(hasClicks ? [{ label: 'Total Clicks', value: formatNum(summary.totalClicks), icon: Download, color: 'text-accent' }] : []),
    ...(hasCost ? [{ label: 'Total Spend', value: `$${formatNum(summary.totalCost)}`, icon: DollarSign, color: 'text-danger' }] : []),
  ];

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-text-muted" />
                <p className="text-xs text-text-muted">{s.label}</p>
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Impressions trend chart */}
      <div className="bg-bg-card border border-border rounded-xl p-5" style={{ minWidth: 0 }}>
        <h3 className="text-sm font-medium text-text-primary mb-4">Daily Impressions</h3>
        <ChartContainer height={320}>
          {(w, h) => (
            <AreaChart width={w} height={h} data={filtered}>
              <defs>
                <linearGradient id="imprGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#2a2a4a' }}
                tickFormatter={(d) => {
                  const date = new Date(d + 'T00:00:00');
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatNum(v)}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Area
                type="monotone"
                dataKey="impressions"
                name="Impressions"
                stroke="#4361ee"
                fill="url(#imprGrad)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ChartContainer>
      </div>

      {/* Bar chart for daily volume */}
      <div className="bg-bg-card border border-border rounded-xl p-5" style={{ minWidth: 0 }}>
        <h3 className="text-sm font-medium text-text-primary mb-4">Impressions by Day</h3>
        <ChartContainer height={260}>
          {(w, h) => (
            <BarChart width={w} height={h} data={filtered}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#5a5a7a', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#2a2a4a' }}
                tickFormatter={(d) => {
                  const date = new Date(d + 'T00:00:00');
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatNum(v)}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar
                dataKey="impressions"
                name="Impressions"
                fill="#4361ee"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
                activeBar={false}
              />
            </BarChart>
          )}
        </ChartContainer>
      </div>

      {/* Data table */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-medium text-text-primary">Daily Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-xs">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Impressions</th>
                {hasClicks && <th className="px-4 py-3 text-right font-medium">Clicks</th>}
                {hasCost && <th className="px-4 py-3 text-right font-medium">Cost</th>}
                {hasConversions && <th className="px-4 py-3 text-right font-medium">Conversions</th>}
                <th className="px-4 py-3 text-right font-medium">vs. Average</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const avg = summary.totalImpressions / summary.days;
                const pctDiff = ((d.impressions - avg) / avg * 100);
                return (
                  <tr key={d.date} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                    <td className="px-4 py-3 text-text-secondary">
                      {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{d.impressions.toLocaleString()}</td>
                    {hasClicks && <td className="px-4 py-3 text-right text-text-secondary">{(d.clicks || 0).toLocaleString()}</td>}
                    {hasCost && <td className="px-4 py-3 text-right text-text-secondary">${(d.cost || 0).toLocaleString()}</td>}
                    {hasConversions && <td className="px-4 py-3 text-right text-text-secondary">{(d.conversions || 0).toLocaleString()}</td>}
                    <td className={`px-4 py-3 text-right font-medium ${pctDiff >= 0 ? 'text-success' : 'text-danger'}`}>
                      {pctDiff >= 0 ? '+' : ''}{pctDiff.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ── Creatives View (for campaign/ad-level data) ──────────────────────

function CreativesView({ creatives }) {
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');

  const summary = useMemo(() => {
    const totalSpend = creatives.reduce((s, c) => s + c.spend, 0);
    const totalImpressions = creatives.reduce((s, c) => s + c.impressions, 0);
    const totalClicks = creatives.reduce((s, c) => s + c.clicks, 0);
    const totalInstalls = creatives.reduce((s, c) => s + c.installs, 0);
    const active = creatives.filter((c) => c.status === 'running').length;
    const paused = creatives.filter((c) => c.status === 'paused').length;
    const avgCpa = totalInstalls > 0 ? totalSpend / totalInstalls : 0;
    return { totalSpend, totalImpressions, totalClicks, totalInstalls, active, paused, total: creatives.length, avgCpa };
  }, [creatives]);

  const sorted = useMemo(() => {
    return [...creatives].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [creatives, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => (
    <span className="text-text-muted ml-1">
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </span>
  );

  // Build spend-by-campaign bar chart data (top 10 by spend)
  const spendChartData = useMemo(() => {
    return [...creatives]
      .filter((c) => c.spend > 0)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10)
      .map((c) => ({
        name: c.creator.length > 25 ? c.creator.substring(0, 25) + '...' : c.creator,
        spend: c.spend,
        impressions: c.impressions,
        clicks: c.clicks,
      }));
  }, [creatives]);

  const statCards = [
    { label: 'Total Spend', value: `$${formatNum(summary.totalSpend)}`, icon: DollarSign, color: 'text-accent' },
    { label: 'Total Impressions', value: formatNum(summary.totalImpressions), icon: Eye, color: 'text-success' },
    { label: 'Total Clicks', value: formatNum(summary.totalClicks), icon: Download, color: 'text-warning' },
    { label: 'Active Campaigns', value: summary.active, icon: Zap, color: 'text-success' },
    { label: 'Total Campaigns', value: summary.total, icon: TrendingUp, color: 'text-text-secondary' },
    { label: 'Paused', value: summary.paused, icon: Pause, color: 'text-text-muted' },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-text-muted" />
                <p className="text-xs text-text-muted">{s.label}</p>
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Spend by Campaign chart */}
      {spendChartData.length > 0 && (
        <div className="bg-bg-card border border-border rounded-xl p-5" style={{ minWidth: 0 }}>
          <h3 className="text-sm font-medium text-text-primary mb-4">Spend by Campaign — Top {spendChartData.length}</h3>
          <ChartContainer height={Math.max(280, spendChartData.length * 40)}>
            {(w, h) => (
              <BarChart width={w} height={h} data={spendChartData} layout="vertical" margin={{ left: 0, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#5a5a7a', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a4a' }}
                  tickFormatter={(v) => `$${formatNum(v)}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={180}
                  tick={{ fill: '#8888a8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
                        <p className="text-text-primary font-medium mb-1">{d.name}</p>
                        <p className="text-accent">Spend: ${d.spend.toLocaleString()}</p>
                        <p className="text-text-secondary">Impressions: {d.impressions.toLocaleString()}</p>
                        <p className="text-text-secondary">Clicks: {d.clicks.toLocaleString()}</p>
                      </div>
                    );
                  }}
                  cursor={false}
                />
                <Bar
                  dataKey="spend"
                  name="Spend"
                  fill="#4361ee"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                  activeBar={false}
                />
              </BarChart>
            )}
          </ChartContainer>
        </div>
      )}

      {/* Campaign table */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-medium text-text-primary">Campaign Breakdown</h3>
          <p className="text-xs text-text-muted mt-1">Click column headers to sort. {sorted.length} campaigns total.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-xs">
                {[
                  { key: 'creator', label: 'Campaign' },
                  { key: 'campaignType', label: 'Type' },
                  { key: 'status', label: 'Status' },
                  { key: 'impressions', label: 'Impressions' },
                  { key: 'clicks', label: 'Clicks' },
                  { key: 'installs', label: 'Conv.' },
                  { key: 'spend', label: 'Spend' },
                  { key: 'cpa', label: 'CPA' },
                  { key: 'budget', label: 'Budget' },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left font-medium cursor-pointer hover:text-text-primary transition-colors whitespace-nowrap"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}<SortIcon col={col.key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className="truncate font-medium text-text-primary" title={c.creator}>{c.creator}</div>
                    {c.bidStrategy && <div className="text-[10px] text-text-muted mt-0.5">{c.bidStrategy}</div>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">{c.campaignType || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[c.status] || STATUS_STYLES.paused}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-right">{c.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-text-secondary text-right">{c.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium">{c.installs > 0 ? c.installs.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-accent">${c.spend.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-bold ${c.cpa > 0 ? CPA_COLOR(c.cpa) : 'text-text-muted'}`}>
                    {c.cpa > 0 ? `$${c.cpa.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    {c.budget > 0 ? `$${c.budget.toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-accent text-white'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
      }`}
    >
      {children}
    </button>
  );
}

// ── Main YouTubeAds Page ─────────────────────────────────────────────

export default function YouTubeAds({ dateRange }) {
  const [importedData, setImportedData] = useState(null); // { type, data }
  const [importError, setImportError] = useState(null);
  const [activeTab, setActiveTab] = useState('impressions'); // 'impressions' | 'campaigns'

  // Check localStorage for previously imported data
  useState(() => {
    try {
      const saved = localStorage.getItem('medal_google_ads_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.type && parsed?.data) {
          setImportedData(parsed);
        }
      }
    } catch { /* ignore */ }
  });

  const handleFileLoaded = useCallback(async (file) => {
    setImportError(null);
    const result = await parseGoogleAdsFile(file);
    setImportedData(result);
    // Persist to localStorage
    try {
      localStorage.setItem('medal_google_ads_data', JSON.stringify(result));
    } catch { /* ignore quota errors */ }
  }, []);

  const handleClearImported = useCallback(() => {
    setImportedData(null);
    try {
      localStorage.removeItem('medal_google_ads_data');
    } catch { /* ignore */ }
  }, []);

  const hasImportedData = importedData !== null;

  return (
    <div className="space-y-6">
      {/* File drop zone — always visible at top */}
      <FileDropZone onFileLoaded={handleFileLoaded} hasData={hasImportedData} />

      {importError && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-sm text-danger">
          {importError}
        </div>
      )}

      {/* Imported data view — overrides defaults when present */}
      {hasImportedData && (
        <>
          <div className="flex items-center gap-3">
            <p className="text-xs text-text-muted">Showing imported data</p>
            <button
              onClick={handleClearImported}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-danger border border-border hover:border-danger/30 rounded-lg transition-colors"
            >
              <X size={12} />
              Clear imported data
            </button>
          </div>

          {importedData.type === 'timeseries' && (
            <TimeSeriesView data={importedData.data} dateRange={dateRange} />
          )}

          {importedData.type === 'creatives' && (
            <CreativesView creatives={importedData.data} />
          )}
        </>
      )}

      {/* Default: tab bar for real data */}
      {!hasImportedData && (
        <>
          <div className="flex items-center gap-2 bg-bg-card border border-border rounded-xl p-1.5">
            <TabButton active={activeTab === 'impressions'} onClick={() => setActiveTab('impressions')}>
              Daily Impressions
            </TabButton>
            <TabButton active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')}>
              Google Ads Campaigns
            </TabButton>
          </div>

          {activeTab === 'impressions' && (
            <TimeSeriesView data={dailyImpressions} dateRange={dateRange} />
          )}

          {activeTab === 'campaigns' && (
            <CreativesView creatives={realCreatives} />
          )}
        </>
      )}
    </div>
  );
}
