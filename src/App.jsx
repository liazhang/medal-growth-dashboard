import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Overview from './pages/Overview';
import YouTubeAds from './pages/YouTubeAds';
import Campaigns from './pages/Campaigns';
import GrowthSpend from './pages/GrowthSpend';
import SocialGrowth from './pages/SocialGrowth';
import GameLaunches from './pages/GameLaunches';
import { dailyMetrics } from './data/socialMetrics';

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start, end, label: 'Last 30 days' };
}

export default function App() {
  const [activePage, setActivePage] = useState('overview');
  const [dateRange, setDateRange] = useState(getDefaultRange);

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <Overview dailyData={dailyMetrics} dateRange={dateRange} />;
      case 'spend':
        return <GrowthSpend dailyData={dailyMetrics} dateRange={dateRange} />;
      case 'youtube':
        return <YouTubeAds dateRange={dateRange} />;
      case 'social':
        return <SocialGrowth dailyData={dailyMetrics} dateRange={dateRange} />;
      case 'campaigns':
        return <Campaigns dateRange={dateRange} />;
      case 'games':
        return <GameLaunches dateRange={dateRange} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-1 ml-60 min-w-0 overflow-x-hidden">
        <Header activePage={activePage} dateRange={dateRange} onDateRangeChange={setDateRange} />
        <div className="p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
