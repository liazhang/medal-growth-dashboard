import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import ChartContainer from './ChartContainer';
import campaigns from '../../data/campaigns.json';

const CHANNEL_COLORS = {
  roblox: '#4361ee',
  minecraft: '#06d6a0',
  youtube: '#FF0000',
  'product-led': '#ffd166',
  other: '#8888a8',
};

function getChannelData() {
  const byChannel = {};
  campaigns.forEach((c) => {
    if (!byChannel[c.channel]) byChannel[c.channel] = 0;
    byChannel[c.channel] += c.cost;
  });
  return Object.entries(byChannel).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: CHANNEL_COLORS[name] || '#8888a8',
  }));
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p style={{ color: d.color }}>{d.name}</p>
      <p className="text-text-primary font-medium">${d.value.toLocaleString()}</p>
    </div>
  );
}

export default function ChannelBreakdown() {
  const data = getChannelData();
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 overflow-hidden" style={{ minWidth: 0 }}>
      <h3 className="text-sm font-medium text-text-primary mb-4">Spend by Channel</h3>
      <ChartContainer height={176}>
        {(w, h) => (
          <PieChart width={w} height={h}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              isAnimationActive={false}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={false} />
          </PieChart>
        )}
      </ChartContainer>
      <div className="space-y-2 mt-4">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-text-secondary truncate">{d.name}</span>
            </div>
            <span className="text-text-muted text-xs flex-shrink-0 ml-2">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
