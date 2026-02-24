import { useState, useMemo } from 'react';
import { Gamepad2, Star, Calendar, TrendingUp, ExternalLink } from 'lucide-react';
import { gameLaunches, quarters, MEDAL_FIT_CONFIG } from '../data/gameLaunches';

function formatNum(n) {
  if (n == null) return 'N/A';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

const QUARTER_LABELS = {
  Q1: 'Jan – Mar',
  Q2: 'Apr – Jun',
  Q3: 'Jul – Sep',
  Q4: 'Oct – Dec',
};

const WISHLIST_COLOR = (n) => {
  if (n == null) return 'text-text-muted';
  if (n >= 1_000_000) return 'text-success';
  if (n >= 500_000) return 'text-warning';
  return 'text-text-secondary';
};

export default function GameLaunches({ dateRange }) {
  const [filterQuarter, setFilterQuarter] = useState('all');

  // Summary stats
  const summary = useMemo(() => {
    const withWishlists = gameLaunches.filter((g) => g.steamWishlists != null);
    const avgWishlists = withWishlists.length > 0
      ? Math.round(withWishlists.reduce((s, g) => s + g.steamWishlists, 0) / withWishlists.length)
      : 0;
    const excellentFit = gameLaunches.filter((g) => g.medalFit >= 4).length;

    // Next upcoming release
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = gameLaunches
      .filter((g) => g.releaseDate && g.releaseDate >= today)
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
    const next = upcoming[0] || null;

    return { total: gameLaunches.length, avgWishlists, excellentFit, next };
  }, []);

  // Group by quarter
  const grouped = useMemo(() => {
    const map = {};
    quarters.forEach((q) => { map[q] = []; });
    gameLaunches.forEach((g) => {
      if (map[g.quarter]) map[g.quarter].push(g);
    });
    // Sort each quarter by wishlists desc (nulls last)
    Object.values(map).forEach((arr) => {
      arr.sort((a, b) => (b.steamWishlists || 0) - (a.steamWishlists || 0));
    });
    return map;
  }, []);

  const visibleQuarters = filterQuarter === 'all' ? quarters : [filterQuarter];

  const statCards = [
    { label: 'Games Tracked', value: summary.total, icon: Gamepad2, color: 'text-accent' },
    { label: 'Avg Wishlists', value: formatNum(summary.avgWishlists), icon: TrendingUp, color: 'text-success' },
    { label: 'Strong Medal Fit', value: summary.excellentFit, icon: Star, color: 'text-warning' },
    { label: 'Next Launch', value: summary.next ? summary.next.name : '—', icon: Calendar, color: 'text-accent', sub: summary.next?.releaseDateDisplay },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Icon size={14} className="text-text-muted" />
                <p className="text-xs text-text-muted">{s.label}</p>
              </div>
              <p className={`text-3xl font-bold text-center ${s.color}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-text-muted mt-1 text-center">{s.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Quarter filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterQuarter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterQuarter === 'all'
              ? 'bg-accent text-white'
              : 'bg-bg-card border border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          All Quarters
        </button>
        {quarters.map((q) => (
          <button
            key={q}
            onClick={() => setFilterQuarter(q)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterQuarter === q
                ? 'bg-accent text-white'
                : 'bg-bg-card border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Quarter sections */}
      {visibleQuarters.map((q) => {
        const games = grouped[q];
        if (!games || games.length === 0) return null;

        return (
          <div key={q} className="bg-bg-card border border-border rounded-xl overflow-hidden">
            {/* Quarter header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-text-primary">
                  {q} 2026
                </h3>
                <span className="text-xs text-text-muted">({QUARTER_LABELS[q]})</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/15 text-accent">
                  {games.length} games
                </span>
              </div>
            </div>

            {/* Games table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted text-xs">
                    <th className="px-4 py-3 text-left font-medium w-8">#</th>
                    <th className="px-4 py-3 text-left font-medium">Game</th>
                    <th className="px-4 py-3 text-left font-medium">Genre</th>
                    <th className="px-4 py-3 text-left font-medium">MP Type</th>
                    <th className="px-4 py-3 text-left font-medium">Release</th>
                    <th className="px-4 py-3 text-right font-medium">Steam Wishlists</th>
                    <th className="px-4 py-3 text-left font-medium">Twitter/X</th>
                    <th className="px-4 py-3 text-left font-medium">Medal Fit</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((g, i) => (
                    <tr key={g.id} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                      <td className="px-4 py-3 text-text-muted text-xs">{i + 1}</td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="font-medium text-text-primary">{g.name}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">{g.developer}</div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">{g.genre}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent whitespace-nowrap">
                          {g.multiplayerType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{g.releaseDateDisplay}</td>
                      <td className={`px-4 py-3 text-right font-bold ${WISHLIST_COLOR(g.steamWishlists)}`}>
                        {g.steamWishlistsDisplay}
                      </td>
                      <td className="px-4 py-3">
                        {g.twitterHandle ? (
                          <div>
                            <div className="text-xs text-accent">{g.twitterHandle}</div>
                            <div className="text-[10px] text-text-muted">{g.twitterFollowersDisplay}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${MEDAL_FIT_CONFIG[g.medalFit].bg} ${MEDAL_FIT_CONFIG[g.medalFit].color}`}>
                            {MEDAL_FIT_CONFIG[g.medalFit].label}
                          </span>
                          <span className="text-[9px] text-text-muted leading-tight max-w-[140px]">{g.medalFitReason}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
