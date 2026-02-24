import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';
import ChartContainer from '../components/charts/ChartContainer';
import campaigns from '../data/campaigns.json';

const CHANNEL_COLORS = {
  roblox: '#4361ee',
  minecraft: '#06d6a0',
  youtube: '#FF0000',
  'product-led': '#ffd166',
  other: '#8888a8',
};

const CPA_COLOR = (v) => {
  if (v === null || v === undefined) return '';
  if (v < 4) return 'text-success';
  if (v < 10) return 'text-warning';
  return 'text-danger';
};

const RET_COLOR = (v) => {
  if (v === null || v === undefined) return '';
  if (v > 0.5) return 'text-success';
  if (v > 0.3) return 'text-warning';
  return 'text-danger';
};

function CustomScatterTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs max-w-xs">
      <p className="font-medium text-text-primary mb-1">{d.name}</p>
      <p className="text-text-secondary">{d.game} — {d.channel}</p>
      <div className="mt-1 space-y-0.5">
        <p>W1 CPA: <span className={CPA_COLOR(d.w1_cpa)}>${d.w1_cpa?.toFixed(2) ?? 'N/A'}</span></p>
        <p>W1 Retention: <span className={RET_COLOR(d.w1_ret)}>{d.w1_ret ? (d.w1_ret * 100).toFixed(1) + '%' : 'N/A'}</span></p>
        <p>Spend: ${d.cost.toLocaleString()}</p>
      </div>
    </div>
  );
}

export default function Campaigns({ dateRange }) {
  const [sortKey, setSortKey] = useState('launch');
  const [sortDir, setSortDir] = useState('desc');
  const [filterChannel, setFilterChannel] = useState('all');

  const filtered = useMemo(() => {
    const start = dateRange.start.getTime();
    const end = dateRange.end.getTime();
    let list = campaigns.filter((c) => {
      const t = new Date(c.launch).getTime();
      return t >= start && t <= end;
    });
    if (filterChannel !== 'all') list = list.filter((c) => c.channel === filterChannel);
    return list;
  }, [filterChannel, dateRange]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (av === null || av === undefined) av = sortDir === 'asc' ? Infinity : -Infinity;
      if (bv === null || bv === undefined) bv = sortDir === 'asc' ? Infinity : -Infinity;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Scatter data: only campaigns with both w1_cpa and w1_ret (from filtered set)
  const scatterData = useMemo(() => {
    return filtered
      .filter((c) => c.w1_cpa !== null && c.w1_ret !== null)
      .map((c) => ({
        ...c,
        x: c.w1_cpa,
        y: c.w1_ret * 100,
        size: Math.max(Math.sqrt(c.cost) / 5, 6),
      }));
  }, [filtered]);

  const channels = [...new Set(campaigns.map((c) => c.channel))];
  const SortIcon = ({ col }) => (
    <span className="text-text-muted ml-1">{sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
  );

  return (
    <div className="space-y-6">
      {/* CPA Benchmark scatter */}
      <div className="bg-bg-card border border-border rounded-xl p-5" style={{ minWidth: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-text-primary">CPA vs Retention Benchmark</h3>
            <p className="text-xs text-text-muted mt-0.5">Each dot = campaign. Size = spend. Color = channel.</p>
          </div>
          <div className="flex gap-3">
            {Object.entries(CHANNEL_COLORS).map(([ch, color]) => (
              <div key={ch} className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize">{ch}</span>
              </div>
            ))}
          </div>
        </div>
        <ChartContainer height={350}>
          {(w, h) => (
            <ScatterChart width={w} height={h} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis
                type="number"
                dataKey="x"
                name="W1 CPA"
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#2a2a4a' }}
                tickFormatter={(v) => `$${v}`}
                label={{ value: 'W1 CPA →', position: 'insideBottomRight', offset: -5, fill: '#5a5a7a', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="W1 Retention"
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                label={{ value: '↑ W1 Retention', position: 'insideTopLeft', offset: 5, fill: '#5a5a7a', fontSize: 11 }}
              />
              <Tooltip content={<CustomScatterTooltip />} cursor={false} />
              <ReferenceLine x={10} stroke="#5a5a7a" strokeDasharray="4 4" />
              <ReferenceLine y={40} stroke="#5a5a7a" strokeDasharray="4 4" />
              <Scatter data={scatterData} isAnimationActive={false}>
                {scatterData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={CHANNEL_COLORS[entry.channel] || '#8888a8'}
                    r={entry.size}
                    fillOpacity={0.8}
                    stroke={CHANNEL_COLORS[entry.channel] || '#8888a8'}
                    strokeWidth={1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          )}
        </ChartContainer>
        <div className="flex justify-between mt-2 text-[10px] text-text-muted px-10">
          <span>← Low CPA (good)</span>
          <span>High CPA (bad) →</span>
        </div>
      </div>

      {/* Campaign table */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-text-primary">All Campaigns</h3>
            <p className="text-xs text-text-muted mt-0.5">{filtered.length} campaigns · ${filtered.reduce((s, c) => s + (c.cost || 0), 0).toLocaleString()} total spend</p>
          </div>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="text-xs bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-text-primary outline-none focus:border-accent"
          >
            <option value="all">All Channels</option>
            {channels.map((ch) => (
              <option key={ch} value={ch}>{ch.charAt(0).toUpperCase() + ch.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-xs">
                {[
                  { key: 'name', label: 'Campaign' },
                  { key: 'game', label: 'Game' },
                  { key: 'channel', label: 'Channel' },
                  { key: 'launch', label: 'Launch' },
                  { key: 'cost', label: 'Spend' },
                  { key: 'w0_users', label: 'W0 Users' },
                  { key: 'w0_cpa', label: 'W0 CPA' },
                  { key: 'w1_cpa', label: 'W1 CPA' },
                  { key: 'w1_ret', label: 'W1 Ret%' },
                  { key: 'w4_ret', label: 'W4 Ret%' },
                  { key: 'status', label: 'Status' },
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
                <tr key={c.name} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{c.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.game}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[c.channel] }} />
                      <span className="capitalize text-text-secondary">{c.channel}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">{c.launch}</td>
                  <td className="px-4 py-3 font-medium">{c.cost != null ? `$${c.cost.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3">{c.w0_users != null ? c.w0_users.toLocaleString() : '—'}</td>
                  <td className={`px-4 py-3 font-medium ${CPA_COLOR(c.w0_cpa)}`}>
                    {c.w0_cpa !== null ? `$${c.w0_cpa.toFixed(2)}` : '—'}
                  </td>
                  <td className={`px-4 py-3 font-medium ${CPA_COLOR(c.w1_cpa)}`}>
                    {c.w1_cpa !== null ? `$${c.w1_cpa.toFixed(2)}` : '—'}
                  </td>
                  <td className={`px-4 py-3 font-medium ${RET_COLOR(c.w1_ret)}`}>
                    {c.w1_ret !== null ? `${(c.w1_ret * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className={`px-4 py-3 ${RET_COLOR(c.w4_ret)}`}>
                    {c.w4_ret !== null ? `${(c.w4_ret * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      c.status === 'active' ? 'bg-success/15 text-success' : 'bg-text-muted/15 text-text-muted'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
