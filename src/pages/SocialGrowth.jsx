import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import ChartContainer from '../components/charts/ChartContainer';
import { TrendingUp, TrendingDown } from 'lucide-react';

const PLATFORMS = [
  { key: 'ytSubscribers', viewsKey: 'ytViews', name: 'YouTube', color: '#FF0000', icon: '▶' },
  { key: 'xFollowers', viewsKey: 'xImpressions', name: 'X / Twitter', color: '#1DA1F2', icon: '𝕏' },
  { key: 'ttFollowers', viewsKey: 'ttViews', name: 'TikTok', color: '#00F2EA', icon: '♪' },
  { key: 'igFollowers', viewsKey: null, name: 'Instagram', color: '#E4405F', icon: '📷' },
  { key: 'discordMembers', viewsKey: null, name: 'Discord', color: '#5865F2', icon: '💬' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function PlatformCard({ platform, data }) {
  if (!data || data.length < 2) return null;
  const latest = data[data.length - 1];
  const earliest = data[0];
  const current = latest[platform.key];
  const previous = earliest[platform.key];
  const growth = previous > 0 ? ((current - previous) / previous * 100) : 0;
  const isPositive = growth >= 0;

  // Views/impressions if available
  const totalViews = platform.viewsKey
    ? data.reduce((s, d) => s + (d[platform.viewsKey] || 0), 0)
    : null;

  const sparkData = data.map((d) => d[platform.key]);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5" style={{ minWidth: 0 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg" style={{ color: platform.color }}>{platform.icon}</span>
          <h3 className="text-sm font-medium text-text-primary">{platform.name}</h3>
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          isPositive ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
        }`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isPositive ? '+' : ''}{growth.toFixed(1)}%
        </span>
      </div>

      <p className="text-2xl font-bold text-text-primary">{current.toLocaleString()}</p>
      <p className="text-xs text-text-muted mt-0.5">
        {platform.key.includes('Subscribers') || platform.key.includes('Members') ? 'members' : 'followers'}
        {totalViews && ` · ${(totalViews / 1000).toFixed(0)}k views/impressions`}
      </p>

      <div className="mt-4">
        <ChartContainer height={100}>
          {(w, h) => (
            <LineChart width={w} height={h} data={data}>
              <Line
                type="monotone"
                dataKey={platform.key}
                stroke={platform.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ChartContainer>
      </div>
    </div>
  );
}

export default function SocialGrowth({ dailyData, dateRange }) {
  const filtered = useMemo(() => {
    const start = dateRange.start.getTime();
    const end = dateRange.end.getTime();
    return dailyData.filter((d) => {
      const t = new Date(d.date).getTime();
      return t >= start && t <= end;
    });
  }, [dailyData, dateRange]);

  // Engagement data for bar chart (views per day)
  const engagementData = useMemo(() => {
    // Aggregate weekly
    const weekly = [];
    for (let i = 0; i < filtered.length; i += 7) {
      const week = filtered.slice(i, i + 7);
      if (week.length === 0) continue;
      const label = new Date(week[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      weekly.push({
        week: label,
        ytViews: Math.round(week.reduce((s, d) => s + d.ytViews, 0) / week.length),
        xImpressions: Math.round(week.reduce((s, d) => s + d.xImpressions, 0) / week.length),
        ttViews: Math.round(week.reduce((s, d) => s + d.ttViews, 0) / week.length),
      });
    }
    return weekly;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Platform cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map((p) => (
          <PlatformCard key={p.key} platform={p} data={filtered} />
        ))}
      </div>

      {/* Combined follower growth */}
      <div className="bg-bg-card border border-border rounded-xl p-5" style={{ minWidth: 0 }}>
        <h3 className="text-sm font-medium text-text-primary mb-4">Follower Growth — All Platforms</h3>
        <ChartContainer height={300}>
          {(w, h) => (
            <LineChart width={w} height={h} data={filtered}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#2a2a4a' }}
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {PLATFORMS.map((p) => (
                <Line key={p.key} type="monotone" dataKey={p.key} name={p.name} stroke={p.color} strokeWidth={2} dot={false} isAnimationActive={false} />
              ))}
            </LineChart>
          )}
        </ChartContainer>
      </div>

      {/* Weekly engagement bars */}
      <div className="bg-bg-card border border-border rounded-xl p-5" style={{ minWidth: 0 }}>
        <h3 className="text-sm font-medium text-text-primary mb-4">Weekly Avg Views / Impressions</h3>
        <ChartContainer height={260}>
          {(w, h) => (
            <BarChart width={w} height={h} data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis
                dataKey="week"
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#2a2a4a' }}
              />
              <YAxis
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="ytViews" name="YouTube Views" fill="#FF0000" isAnimationActive={false} activeBar={false} />
              <Bar dataKey="xImpressions" name="X Impressions" fill="#1DA1F2" isAnimationActive={false} activeBar={false} />
              <Bar dataKey="ttViews" name="TikTok Views" fill="#00F2EA" isAnimationActive={false} activeBar={false} />
            </BarChart>
          )}
        </ChartContainer>
      </div>
    </div>
  );
}
