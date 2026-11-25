import { useSyncExternalStore } from 'react';

/* The photos and videos taken in the Camera. Memory only, on purpose: there is
   no database and nothing is uploaded or saved to the device. A reload clears
   them. Capped, so it can never grow into a slow page. */

const MAX = 24;
let items = [];
const subs = new Set();
const emit = () => subs.forEach((f) => f());

export const photos = {
  get: () => items,
  subscribe: (f) => {
    subs.add(f);
    return () => subs.delete(f);
  },
  add(item) {
    const next = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date(), ...item }, ...items];
    next.slice(MAX).forEach((d) => d.kind === 'video' && URL.revokeObjectURL(d.url));
    items = next.slice(0, MAX);
    emit();
    return items[0];
  },
  remove(id) {
    const gone = items.find((i) => i.id === id);
    if (gone?.kind === 'video') URL.revokeObjectURL(gone.url);
    items = items.filter((i) => i.id !== id);
    emit();
  },
};

export const usePhotos = () => useSyncExternalStore(photos.subscribe, photos.get);
