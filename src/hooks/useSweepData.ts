import { useState, useEffect } from 'react';
import type { SweepData } from '../types';
import { buildSampleData } from '../data/sampleData';
import { buildFromWorldCup } from '../api/worldcupBuilder';

export function useSweepData(): { sweep: SweepData | null; loading: boolean; error: string | null; usingLiveData: boolean } {
  const [sweep, setSweep] = useState<SweepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await buildFromWorldCup();
        setSweep(data);
        setUsingLiveData(true);
      } catch (e) {
        console.warn('worldcup26.ir fetch failed, falling back to sample data:', e);
        setSweep(buildSampleData());
        setError(String(e));
        setUsingLiveData(false);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { sweep, loading, error, usingLiveData };
}
