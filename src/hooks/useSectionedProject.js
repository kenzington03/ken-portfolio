import { useEffect, useState } from 'react';
import { loadSectionedProject } from '../utils/sectionAssets.js';

export function useSectionedProject(folder, sections) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!folder || !sections?.length) {
      setData([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    const sectionKey = JSON.stringify(sections);

    loadSectionedProject(folder, sections).then((loaded) => {
      if (!cancelled) {
        setData(loaded);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [folder, JSON.stringify(sections)]);

  return { sections: data, loading };
}
