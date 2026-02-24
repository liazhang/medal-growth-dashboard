import { useState, useEffect, useCallback, useRef } from 'react';
import { creatives as fixtureCreatives, generateCPATrends, getWeeklySummary } from '../data/youtubeAds';

/**
 * Format a Date object to YYYY-MM-DD
 */
function fmtDate(d) {
  return d.toISOString().split('T')[0];
}

/**
 * Fetch with a timeout — resolves to null on any failure
 */
async function safeFetch(url, timeoutMs = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Hook: check Google Ads API connection status
 */
export function useGoogleAdsStatus() {
  const [status, setStatus] = useState({
    connected: false,
    configured: false,
    loading: true,
    accountName: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const data = await safeFetch('/api/google-ads/status', 3000);

      if (cancelled) return;

      if (data && data.connected) {
        setStatus({
          connected: true,
          configured: true,
          loading: false,
          accountName: data.accountName || null,
          error: null,
        });
      } else {
        setStatus({
          connected: false,
          configured: data?.configured || false,
          loading: false,
          accountName: null,
          error: data?.message || 'API server not running. Using sample data.',
        });
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return status;
}

/**
 * Hook: fetch YouTube creative data from Google Ads API
 * Falls back to fixture data when the API is unavailable
 */
export function useYouTubeCreatives(dateRange) {
  const [data, setData] = useState({
    creatives: fixtureCreatives,
    loading: true,
    isLive: false,
    error: null,
  });

  const fetchedRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const from = fmtDate(dateRange.start);
    const to = fmtDate(dateRange.end);
    const rangeKey = `${from}-${to}`;

    // Skip if already fetched for this range
    if (fetchedRef.current === rangeKey) return;

    async function load() {
      setData((prev) => ({ ...prev, loading: true }));

      const json = await safeFetch(`/api/google-ads/creatives?from=${from}&to=${to}`, 5000);

      if (cancelled) return;

      fetchedRef.current = rangeKey;

      if (json?.creatives?.length > 0) {
        setData({
          creatives: json.creatives,
          loading: false,
          isLive: true,
          error: null,
        });
      } else {
        setData({
          creatives: fixtureCreatives,
          loading: false,
          isLive: false,
          error: null,
        });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [dateRange]);

  return data;
}

/**
 * Hook: fetch daily CPA trend data
 * Falls back to generated fixture trends
 */
export function useCPATrends(dateRange, creatives) {
  // Pre-generate fixture trends so we always have data
  const [data, setData] = useState(() => ({
    trends: generateCPATrends(fixtureCreatives),
    loading: false,
    isLive: false,
  }));

  const fetchedRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const from = fmtDate(dateRange.start);
    const to = fmtDate(dateRange.end);
    const rangeKey = `${from}-${to}`;

    // Skip if already fetched for this range
    if (fetchedRef.current === rangeKey) return;

    async function load() {
      setData((prev) => ({ ...prev, loading: true }));

      const json = await safeFetch(`/api/google-ads/cpa-trends?from=${from}&to=${to}`, 5000);

      if (cancelled) return;

      fetchedRef.current = rangeKey;

      if (json?.trends && Object.keys(json.trends).length > 0) {
        setData({ trends: json.trends, loading: false, isLive: true });
      } else {
        const fixtureTrends = generateCPATrends(creatives);
        setData({ trends: fixtureTrends, loading: false, isLive: false });
      }
    }

    load();
    return () => { cancelled = true; };
  // Only re-fetch when dateRange changes, not when creatives changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  return data;
}

/**
 * Convenience: compute summary from whatever creative list we have
 */
export function computeSummary(creatives) {
  return getWeeklySummary(creatives);
}
