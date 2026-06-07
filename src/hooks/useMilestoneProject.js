import { useEffect, useState } from 'react';
import { loadMilestoneProject } from '../utils/milestoneAssets.js';

export function useMilestoneProject() {
  const [data, setData] = useState({
    logo: null,
    campaigns: [],
    videoReelGroups: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    loadMilestoneProject().then((loaded) => {
      if (!cancelled) {
        setData(loaded);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, loading };
}
