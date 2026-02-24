import { LayoutDashboard, DollarSign, Youtube, Users, BarChart3, Gamepad2, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'spend', label: 'Growth Spend', icon: DollarSign },
  { id: 'youtube', label: 'YouTube Ads', icon: Youtube },
  { id: 'social', label: 'Social Growth', icon: Users },
  { id: 'campaigns', label: 'Campaigns', icon: BarChart3 },
  { id: 'games', label: 'Game Launches', icon: Gamepad2 },
];

export default function Sidebar({ activePage, onPageChange }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-bg-secondary border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary leading-none">Medal</h1>
            <p className="text-[11px] text-text-muted mt-0.5">Growth Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-accent/15 text-accent font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-all">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
