import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area,
} from 'recharts';
import ChartContainer from '../components/charts/ChartContainer';
import MetricCard from '../components/charts/MetricCard';
import campaigns from '../data/campaigns.json';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: ${entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function GrowthSpend({ dailyData, dateRange }) {
  const filtered = useMemo(() => {
    const start = dateRange.start.getTime();
    const end = dateRange.end.getTime();
    return dailyData.filter((d) => {
      const t = new Date(d.date).getTime();
      return t >= start && t <= end;
    });
  }, [dailyData, dateRange]);

  const totalSpend = filtered.reduce((s, d) => s + d.totalSpend, 0);
  const totalYt = filtered.reduce((s, d) => s + d.ytAdSpend, 0);
  const totalPartner = filtered.reduce((s, d) => s + d.partnershipSpend, 0);
  const avgDaily = filtered.length > 0 ? totalSpend / filtered.length : 0;

  // Filter campaigns by date range
  const filteredCampaigns = useMemo(() => {
    const start = dateRange.start.getTime();
    const end = dateRange.end.getTime();
    return campaigns.filter((c) => {
      const t = new Date(c.launch).getTime();
      return t >= start && t <= end;
    });
  }, [dateRange]);

  // Monthly spend aggregation from campaign data
  const monthlySpend = useMemo(() => {
    const byMonth = {};
    filteredCampaigns.forEach((c) => {
      const month = c.launch.substring(0, 7); // YYYY-MM
      if (!byMonth[month]) byMonth[month] = { month, roblox: 0, minecraft: 0, youtube: 0, 'product-led': 0, other: 0 };
      byMonth[month][c.channel] = (byMonth[month][c.channel] || 0) + c.cost;
    });
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredCampaigns]);

  // CPA over time from campaign data
  const cpaTrend = useMemo(() => {
    return filteredCampaigns
      .filter((c) => c.w0_cpa !== null)
      .sort((a, b) => a.launch.localeCompare(b.launch))
      .map((c) => ({
        date: c.launch,
        name: c.name,
        w0_cpa: c.w0_cpa,
        w1_cpa: c.w1_cpa,
      }));
  }, [filteredCampaigns]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Spend (period)"
          value={Math.round(totalSpend).toLocaleString()}
          prefix="$"
          change={8.3}
          sparkData={filtered.map((d) => ({ value: d.totalSpend }))}
          color="#4361ee"
        />
        <MetricCard
          title="YouTube Ad Spend"
          value={Math.round(totalYt).toLocaleString()}
          prefix="$"
          change={12.1}
          sparkData={filtered.map((d) => ({ value: d.ytAdSpend }))}
          color="#FF0000"
        />
        <MetricCard
          title="Partnership Spend"
          value={Math.round(totalPartner).toLocaleString()}
          prefix="$"
          change={5.4}
          sparkData={filtered.map((d) => ({ value: d.partnershipSpend }))}
          color="#06d6a0"
        />
        <MetricCard
          title="Avg Daily Spend"
          value={Math.round(avgDaily).toLocaleString()}
          prefix="$"
          change={-2.1}
          color="#ffd166"
        />
      </div>

      {/* Monthly spend by channel (stacked bar) */}
      <div className="bg-bg-card border border-border rounded-xl p-5" style={{ minWidth: 0 }}>
        <h3 className="text-sm font-medium text-text-primary mb-4">Monthly Campaign Spend by Channel</h3>
        <ChartContainer height={300}>
          {(w, h) => (
            <BarChart width={w} height={h} data={monthlySpend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#2a2a4a' }}
              />
              <YAxis
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="minecraft" name="Minecraft" stackId="a" fill="#06d6a0" isAnimationActive={false} activeBar={false} />
              <Bar dataKey="roblox" name="Roblox" stackId="a" fill="#4361ee" isAnimationActive={false} activeBar={false} />
              <Bar dataKey="youtube" name="YouTube" stackId="a" fill="#FF0000" isAnimationActive={false} activeBar={false} />
              <Bar dataKey="product-led" name="Product-led" stackId="a" fill="#ffd166" isAnimationActive={false} activeBar={false} />
              <Bar dataKey="other" name="Other" stackId="a" fill="#8888a8" isAnimationActive={false} activeBar={false} />
            </BarChart>
          )}
        </ChartContainer>
      </div>

      {/* Daily spend over time */}
      <div className="bg-bg-card border border-border rounded-xl p-5" style={{ minWidth: 0 }}>
        <h3 className="text-sm font-medium text-text-primary mb-4">Daily Spend Breakdown</h3>
        <ChartContainer height={280}>
          {(w, h) => (
            <AreaChart width={w} height={h} data={filtered}>
              <defs>
                <linearGradient id="gradYtSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF0000" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FF0000" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPartnerSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06d6a0" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06d6a0" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="ytAdSpend" name="YouTube Ads" stroke="#FF0000" strokeWidth={2} fill="url(#gradYtSpend)" isAnimationActive={false} />
              <Area type="monotone" dataKey="partnershipSpend" name="Partnerships" stroke="#06d6a0" strokeWidth={2} fill="url(#gradPartnerSpend)" isAnimationActive={false} />
            </AreaChart>
          )}
        </ChartContainer>
      </div>

      {/* Campaign cost efficiency table */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-medium text-text-primary">Cost Efficiency by Campaign</h3>
          <p className="text-xs text-text-muted mt-0.5">Sorted by cost per retained user (W0 CPA)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-xs">
                <th className="px-4 py-3 text-left font-medium">Campaign</th>
                <th className="px-4 py-3 text-left font-medium">Channel</th>
                <th className="px-4 py-3 text-right font-medium">Total Spend</th>
                <th className="px-4 py-3 text-right font-medium">Users</th>
                <th className="px-4 py-3 text-right font-medium">W0 CPA</th>
                <th className="px-4 py-3 text-right font-medium">Cost/Retained User</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredCampaigns]
                .sort((a, b) => (a.w0_cpa || 99) - (b.w0_cpa || 99))
                .map((c) => {
                  const retainedUsers = c.w1_ret ? Math.round(c.w0_users * c.w1_ret) : null;
                  const costPerRetained = retainedUsers ? c.cost / retainedUsers : null;
                  return (
                    <tr key={c.name} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 capitalize text-text-secondary">{c.channel}</td>
                      <td className="px-4 py-3 text-right">${c.cost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{c.w0_users.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-medium ${c.w0_cpa < 4 ? 'text-success' : c.w0_cpa < 10 ? 'text-warning' : 'text-danger'}`}>
                        ${c.w0_cpa.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${costPerRetained && costPerRetained < 5 ? 'text-success' : costPerRetained && costPerRetained < 15 ? 'text-warning' : 'text-danger'}`}>
                        {costPerRetained ? `$${costPerRetained.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
