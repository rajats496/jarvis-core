import { useState, useEffect, useCallback } from 'react';
import * as systemApi from '../api/system.api';

const CACHE_MS = 30 * 1000; // 30s - do not over-poll

export function useSystemStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(0);

  const fetchStatus = useCallback(async (force = false) => {
    if (!force && Date.now() - lastFetch < CACHE_MS && status) {
      return status;
    }
    setLoading(true);
    try {
      const data = await systemApi.getStatus();
      setStatus(data);
      setLastFetch(Date.now());
      return data;
    } catch (err) {
      setStatus(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lastFetch, status]);

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, loading, refresh: () => fetchStatus(true) };
}
