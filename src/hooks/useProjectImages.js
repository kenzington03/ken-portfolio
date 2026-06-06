import { useEffect, useState } from 'react';
import { probeProjectImages } from '../utils/projectImages.js';

export function useProjectImages(folder) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImages([]);

    probeProjectImages(folder).then((loaded) => {
      if (!cancelled) {
        setImages(loaded);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [folder]);

  return { images, loading };
}
