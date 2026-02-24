import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import ChartContainer from './ChartContainer';

const PLATFORMS = [
  { key: 'ytSubscribers', name: 'YouTube', color: '#FF0000' },
  { key: 'xFollowers', name: 'X / Twitter', color: '#1DA1F2' },
  { key: 'ttFollowers', name: 'TikTok', color: '#00F2EA' },
  { key: 'igFollowers', name: 'Instagram', color: '#E4405F' },
  { key: 'discordMembers', name: 'Discord', color: '#5865F2' },
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

export default function SocialChart({ data }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-5" style={{ minWidth: 0 }}>
      <h3 className="text-sm font-medium text-text-primary mb-4">Follower Growth Across Platforms</h3>
      <ChartContainer height={288}>
        {(w, h) => (
          <LineChart width={w} height={h} data={data}>
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
              <Line
                key={p.key}
                type="monotone"
                dataKey={p.key}
                name={p.name}
                stroke={p.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        )}
      </ChartContainer>
    </div>
  );
}
