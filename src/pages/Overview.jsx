import { useMemo } from 'react';
import MetricCard from '../components/charts/MetricCard';
import SpendChart from '../components/charts/SpendChart';
import SocialChart from '../components/charts/SocialChart';
import ChannelBreakdown from '../components/charts/ChannelBreakdown';
import campaigns from '../data/campaigns.json';

export default function Overview({ dailyData, dateRange }) {
  const filtered = useMemo(() => {
    const start = dateRange.start.getTime();
    const end = dateRange.end.getTime();
    return dailyData.filter((d) => {
      const t = new Date(d.date).getTime();
      return t >= start && t <= end;
    });
  }, [dailyData, dateRange]);

  // Compute summary metrics from filtered data
  const totalSpend = filtered.reduce((s, d) => s + d.totalSpend, 0);
  const totalYtSpend = filtered.reduce((s, d) => s + d.ytAdSpend, 0);
  const latestYtSubs = filtered.length > 0 ? filtered[filtered.length - 1].ytSubscribers : 0;
  const latestTtFollowers = filtered.length > 0 ? filtered[filtered.length - 1].ttFollowers : 0;
  const latestDiscord = filtered.length > 0 ? filtered[filtered.length - 1].discordMembers : 0;

  // Sparklines
  const spendSpark = filtered.map((d) => ({ value: d.totalSpend }));
  const ytSpark = filtered.map((d) => ({ value: d.ytSubscribers }));
  const ttSpark = filtered.map((d) => ({ value: d.ttFollowers }));

  // Campaign-level totals
  const totalCampaignSpend = campaigns.reduce((s, c) => s + c.cost, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Spend (period)"
          value={Math.round(totalSpend).toLocaleString()}
          prefix="$"
          change={8.3}
          sparkData={spendSpark}
          color="#4361ee"
        />
        <MetricCard
          title="YouTube Ad Spend"
          value={Math.round(totalYtSpend).toLocaleString()}
          prefix="$"
          change={12.1}
          sparkData={filtered.map((d) => ({ value: d.ytAdSpend }))}
          color="#FF0000"
        />
        <MetricCard
          title="YouTube Subscribers"
          value={latestYtSubs}
          change={12.4}
          sparkData={ytSpark}
          color="#FF0000"
        />
        <MetricCard
          title="Active Campaigns"
          value={activeCampaigns}
          suffix={` / ${campaigns.length}`}
          change={0}
          color="#06d6a0"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 min-w-0">
          <SpendChart data={filtered} />
        </div>
        <div className="min-w-0">
          <ChannelBreakdown />
        </div>
      </div>

      {/* Social growth */}
      <SocialChart data={filtered} />

      {/* Quick campaign stats */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-text-primary mb-3">All-Time Campaign Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-text-primary">${(totalCampaignSpend / 1000).toFixed(0)}k</p>
            <p className="text-xs text-text-muted mt-1">Total Spend</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{campaigns.length}</p>
            <p className="text-xs text-text-muted mt-1">Campaigns</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">
              ${(campaigns.reduce((s, c) => s + (c.w0_cpa || 0), 0) / campaigns.length).toFixed(2)}
            </p>
            <p className="text-xs text-text-muted mt-1">Avg W0 CPA</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">
              {(campaigns.filter((c) => c.w1_ret).reduce((s, c) => s + c.w1_ret, 0) /
                campaigns.filter((c) => c.w1_ret).length * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-text-muted mt-1">Avg W1 Retention</p>
          </div>
        </div>
      </div>
    </div>
  );
}
