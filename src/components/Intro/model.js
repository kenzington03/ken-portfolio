// The MacBook model, downloaded once. The journey's loader watches the bytes
// come in (its progress bar); the 3D scene gets the same bytes as a blob URL,
// so the file never crosses the network twice. No three.js here: the loader's
// chunk stays light.

export const MODEL_SRC = '/models/macbook-rigged.glb';

let job = null;
let got = 0;
const watchers = new Set();

function tell(p) {
  got = p;
  watchers.forEach((fn) => fn(p));
}

async function download() {
  try {
    const res = await fetch(MODEL_SRC);
    if (!res.ok) throw new Error(String(res.status));
    const total = Number(res.headers.get('content-length')) || 0;
    let blob;
    if (!res.body || !total) {
      blob = await res.blob();
    } else {
      const reader = res.body.getReader();
      const parts = [];
      let n = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        parts.push(value);
        n += value.length;
        tell(Math.min(1, n / total));
      }
      blob = new Blob(parts, { type: 'model/gltf-binary' });
    }
    tell(1);
    return URL.createObjectURL(blob);
  } catch {
    // The scene can still try the file itself.
    tell(1);
    return MODEL_SRC;
  }
}

/** The model's URL (a blob once it's in). `onProgress(0..1)` follows the bytes. */
export function loadModel(onProgress) {
  if (onProgress) {
    watchers.add(onProgress);
    onProgress(got);
  }
  job ??= download();
  return job;
}

export function stopWatching(onProgress) {
  watchers.delete(onProgress);
}
