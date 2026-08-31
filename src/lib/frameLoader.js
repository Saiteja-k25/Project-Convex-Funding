import { COARSE_STEP, frameName } from '../config/sequence';

/**
 * Progressive frame loader — the replacement for a blocking preloader.
 *
 * Three stages, in priority order:
 *
 *   1. frame 0            ~58 KB, near-instant. The hero looks finished at once.
 *   2. every Nth frame    ~15 frames, ~1 s. Scrubbing becomes usable.
 *   3. everything else    quietly, in the background.
 *
 * `nearestLoaded()` is the safety rule: if the scroll asks for a frame that has
 * not arrived, we draw the closest one we do have. The canvas is therefore never
 * blank — early scrolling just looks a little steppy until stage 3 catches up.
 *
 * Frames are kept as `Image` objects (compressed bytes), never `ImageBitmap`.
 * 150 frames at 800x1422 as decoded bitmaps is ~680 MB and gets a tab killed.
 */
export function createFrameLoader({ folder, totalFrames }) {
  const frames = new Array(totalFrames).fill(null);
  const loaded = new Uint8Array(totalFrames);
  const listeners = new Set();

  let loadedCount = 0;
  let failedCount = 0;
  let cancelled = false;

  const notify = () => {
    listeners.forEach((fn) => fn({ loadedCount, failedCount, totalFrames }));
  };

  const load = (i) =>
    new Promise((resolve) => {
      if (cancelled || frames[i]) {
        resolve();
        return;
      }
      const img = new Image();
      img.decoding = 'async';
      frames[i] = img;

      const settle = (ok) => {
        if (ok) {
          loaded[i] = 1;
          loadedCount += 1;
        } else {
          frames[i] = null;
          failedCount += 1;
        }
        notify();
        resolve();
      };

      // Settle on BOTH events. A load-only handler leaves a 404'd frame pending
      // forever, which used to strand the old preloader at 99%.
      img.onload = () => settle(true);
      img.onerror = () => settle(false);
      img.src = `${folder}/${frameName(i)}`;
    });

  /** Load a list in small batches so stage 3 cannot starve the network. */
  const loadBatched = async (indices, size) => {
    for (let i = 0; i < indices.length; i += size) {
      if (cancelled) return;
      await Promise.all(indices.slice(i, i + size).map(load));
    }
  };

  return {
    frames,

    onProgress(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** Closest loaded frame to `i`, or -1 if nothing has arrived yet. */
    nearestLoaded(i) {
      if (i >= 0 && i < totalFrames && loaded[i]) return i;
      for (let d = 1; d < totalFrames; d += 1) {
        const before = i - d;
        const after = i + d;
        if (before >= 0 && loaded[before]) return before;
        if (after < totalFrames && loaded[after]) return after;
        if (before < 0 && after >= totalFrames) break;
      }
      return -1;
    },

    async start({ onFirstFrame } = {}) {
      await load(0);
      onFirstFrame?.();

      const coarse = [];
      for (let i = COARSE_STEP; i < totalFrames; i += COARSE_STEP) coarse.push(i);
      await loadBatched(coarse, 6);

      const rest = [];
      for (let i = 1; i < totalFrames; i += 1) if (!frames[i] && !loaded[i]) rest.push(i);
      await loadBatched(rest, 10);
    },

    cancel() {
      cancelled = true;
      listeners.clear();
    },
  };
}
