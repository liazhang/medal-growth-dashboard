import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import ChartContainer from './ChartContainer';

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

export default function SpendChart({ data }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-5" style={{ minWidth: 0 }}>
      <h3 className="text-sm font-medium text-text-primary mb-4">Spend Over Time</h3>
      <ChartContainer height={288}>
        {(w, h) => (
          <AreaChart width={w} height={h} data={data}>
            <defs>
              <linearGradient id="gradYt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF0000" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#FF0000" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPartner" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4361ee" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#4361ee" stopOpacity={0} />
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
            <Legend wrapperStyle={{ fontSize: 12, color: '#8888a8' }} />
            <Area
              type="monotone"
              dataKey="ytAdSpend"
              name="YouTube Ads"
              stroke="#FF0000"
              strokeWidth={2}
              fill="url(#gradYt)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="partnershipSpend"
              name="Partnerships"
              stroke="#4361ee"
              strokeWidth={2}
              fill="url(#gradPartner)"
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </ChartContainer>
    </div>
  );
}
