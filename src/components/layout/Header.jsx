import DateRangePicker from '../ui/DateRangePicker';

const PAGE_TITLES = {
  overview: 'Overview',
  spend: 'Growth Spend',
  youtube: 'YouTube Ads',
  social: 'Social Growth',
  campaigns: 'Campaigns',
  games: 'Game Launches',
};

const PAGE_DESCRIPTIONS = {
  overview: 'High-level growth metrics at a glance',
  spend: 'Track spending across all growth channels',
  youtube: 'YouTube ad campaign performance',
  social: 'Follower growth & engagement across platforms',
  campaigns: 'All campaign performance and benchmarks',
  games: '2026 multiplayer PC game launches to target for partnerships',
};

export default function Header({ activePage, dateRange, onDateRangeChange }) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-border bg-bg-primary/80 backdrop-blur-sm sticky top-0 z-30">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          {PAGE_TITLES[activePage]}
        </h2>
        <p className="text-sm text-text-muted mt-0.5">
          {PAGE_DESCRIPTIONS[activePage]}
        </p>
      </div>
      <DateRangePicker dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
    </header>
  );
}
