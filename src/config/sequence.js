/**
 * Single source of truth for the scroll-driven frame sequence.
 *
 * Cut from the source videos in /source-video with ffmpeg, verified on disk:
 *   sequence-desktop  150 frames, 1600 x 900  (16:9 landscape), 11.40 MB, fps=15 q70
 *   sequence-mobile   120 frames,  810 x 1440 (9:16 portrait),   5.63 MB, fps=12 q62
 *
 * These replaced the original ezgif exports, which were capped at 800px wide
 * (soft once stretched) and 15.51 MB on the portrait side. The originals are
 * parked in /_old-ezgif-frames.
 *
 * If you re-export a sequence, update `totalFrames` here and nowhere else.
 */

/**
 * How far you scroll to advance one frame. THIS is what decides whether the
 * scrub feels continuous — not the container height.
 *
 * Under ~25px per frame reads as continuous motion; past ~30px you start
 * noticing individual frames when scrolling slowly.
 *
 * A fixed `500vh` container could not hold this steady, because vh is relative
 * to screen height while the frame count is fixed: a 900px laptop got 24px per
 * frame and a 1440px monitor got 38px. So we compute the container height from
 * this target instead, and every display gets the same feel — a tall monitor
 * simply gets a proportionally shorter section rather than a chunkier one.
 */
export const TARGET_PX_PER_FRAME = 24;

/** Never let the stage get absurd, whatever the viewport reports. */
const MIN_STAGE_VH = 2.5;
const MAX_STAGE_VH = 7;

/** Pinned-stage height in CSS px, for a given frame count and viewport. */
export const computeStageHeight = (totalFrames) => {
  const vh = window.innerHeight || document.documentElement.clientHeight || 800;
  const scrollable = totalFrames * TARGET_PX_PER_FRAME;
  const raw = scrollable + vh; // + one screen: the first vh only fills the screen
  return Math.round(Math.min(Math.max(raw, vh * MIN_STAGE_VH), vh * MAX_STAGE_VH));
};

/** Cap the canvas backing store. 3x on a phone is a lot of pixels for no visible gain. */
export const MAX_DPR = 2;

/**
 * Footage grade, painted onto the canvas after every frame.
 *
 * This replaces the per-phase text scrims, which appeared and disappeared with
 * each phase and read as black panels laid over the video. Grading the footage
 * ONCE — evenly, always on — is what cinematic sites actually do: the frames sit
 * at a consistent darkness, so type stays legible without spotlighting it.
 *
 * `flat` darkens everything; `vignette` pulls the corners down a little further,
 * which is where the left- and right-aligned copy lives.
 */
export const GRADE = { flat: 0.4, vignette: 0.42 };

/** Load frame 0, then every Nth frame, then fill in the gaps. */
export const COARSE_STEP = 10;

const SEQUENCES = {
  landscape: { folder: '/sequence-desktop', totalFrames: 150 },
  // Fewer frames on the portrait set: at 120 that is still one frame per ~28px
  // of scroll on a phone, and it takes the download from 15.51 MB to 5.63 MB.
  portrait: { folder: '/sequence-mobile', totalFrames: 120 },
};

/**
 * Frame filename pattern. Kept as a function so a future re-export with a
 * different pattern is a one-line change.
 */
export const frameName = (i) => `frame_${String(i).padStart(3, '0')}.webp`;

/**
 * Chosen by SHAPE, not width.
 *
 * A width-only breakpoint gets an upright iPad wrong: it is 820px wide, so a
 * `< 768` rule hands it the landscape frames, which then crop badly into a tall
 * screen. Comparing height to width instead is correct for every device:
 *
 *   phone upright / iPad upright        -> portrait frames
 *   phone sideways / iPad sideways      -> landscape frames
 *   laptop / monitor / TV               -> landscape frames
 *
 * Resolved ONCE at boot and deliberately not reactive: swapping sets mid-session
 * would re-download the whole sequence. On rotation the cover maths still fills
 * the screen, it just crops a little more.
 */
export const getSequenceConfig = () => {
  // Fall back to a landscape guess if the viewport reports nothing useful yet.
  const w = window.innerWidth || document.documentElement.clientWidth || 1280;
  const h = window.innerHeight || document.documentElement.clientHeight || 720;
  const isPortrait = h >= w;
  const { folder, totalFrames } = isPortrait ? SEQUENCES.portrait : SEQUENCES.landscape;
  return { folder, totalFrames, isPortrait };
};
