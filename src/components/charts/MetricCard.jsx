import { TrendingUp, TrendingDown } from 'lucide-react';
import { Area, AreaChart } from 'recharts';
import ChartContainer from './ChartContainer';

export default function MetricCard({ title, value, change, sparkData, color = '#4361ee', prefix = '', suffix = '' }) {
  const isPositive = change >= 0;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 transition-colors" style={{ minWidth: 0 }}>
      <div className="flex items-center justify-center gap-2 mb-3">
        <p className="text-sm text-text-secondary">{title}</p>
        <span
          className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            isPositive ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
          }`}
        >
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isPositive ? '+' : ''}{change}%
        </span>
      </div>

      <p className="text-3xl font-bold text-text-primary mb-3 text-center">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>

      {sparkData && sparkData.length > 0 && (
        <ChartContainer height={40}>
          {(w, h) => (
            <AreaChart width={w} height={h} data={sparkData}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#grad-${title})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ChartContainer>
      )}
    </div>
  );
}
