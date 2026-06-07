import { useEffect, useState } from 'react';
import { resolveVideoKeys } from '../data/cloudinaryVideos.js';
import { loadProjectVideoGrid } from '../utils/sectionAssets.js';

export function useMotionVideos(folder, subfolders = [], maxPerPath = 0, videoKeys = []) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const keysSignature = JSON.stringify(videoKeys ?? []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const resolvedKeys = resolveVideoKeys(videoKeys);

    if (resolvedKeys.length > 0) {
      setVideos(resolvedKeys);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    loadProjectVideoGrid(folder, subfolders, maxPerPath).then((loaded) => {
      if (!cancelled) {
        setVideos(loaded);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [folder, subfolders, maxPerPath, keysSignature]);

  return { videos, loading };
}
