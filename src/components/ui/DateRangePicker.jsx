import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'YTD', days: 'ytd' },
  { label: 'Last 12 months', days: 365 },
];

function getPresetRange(preset) {
  const end = new Date();
  const start = new Date();

  if (preset.days === 'ytd') {
    // Year to date — Jan 1 of current year to today
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() - preset.days);
  }
  return { start, end, label: preset.label };
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DateRangePicker({ dateRange, onDateRangeChange }) {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePreset = (preset) => {
    const range = getPresetRange(preset);
    onDateRangeChange(range);
    setOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onDateRangeChange({
        start: new Date(customStart),
        end: new Date(customEnd),
        label: 'Custom',
      });
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-card border border-border hover:border-accent transition-colors text-sm"
      >
        <Calendar size={16} className="text-text-secondary" />
        <span>{dateRange.label || `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`}</span>
        <ChevronDown size={14} className="text-text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-bg-hover transition-colors ${
                  dateRange.label === preset.label ? 'bg-bg-hover text-accent' : 'text-text-primary'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="border-t border-border p-3">
            <p className="text-xs text-text-muted mb-2">Custom range</p>
            <div className="flex gap-2 mb-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-bg-primary border border-border text-text-primary focus:border-accent outline-none"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-bg-primary border border-border text-text-primary focus:border-accent outline-none"
              />
            </div>
            <button
              onClick={handleCustomApply}
              className="w-full py-1.5 text-xs rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
