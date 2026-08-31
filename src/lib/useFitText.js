import { useEffect, useRef } from 'react';

/**
 * Makes one line of text span its container EXACTLY, at every width.
 *
 * WHY NOT a vw clamp: `clamp(min, Nvw, max)` scales with the viewport, but a
 * string's width scales with its own glyph metrics. The two agree at exactly one
 * width and diverge everywhere else — which is why the footer wordmark fitted at
 * one size and clipped to "CONVEX FUNDI" on a wide monitor.
 *
 * WHY NOT measure-on-resize: the obvious fix is a ResizeObserver that re-measures
 * and re-sets a px font-size. It works, but it is fragile exactly where it
 * matters — ResizeObserver and requestAnimationFrame are delivered during the
 * rendering lifecycle, so in a tab that is not compositing (a background tab, a
 * hidden preview panel, some headless captures) the container resizes and the
 * callback never arrives. The text then keeps a size measured for a different
 * viewport. Measured directly in this project: container width changed
 * 319px -> 1281px and the observer fired zero times.
 *
 * WHAT THIS DOES: the sizing is pure CSS. `font-size` is expressed in `cqw` — a
 * fraction of the CONTAINER's width — so text width stays a fixed fraction of
 * container width at every size, with no JS in the loop and nothing to miss a
 * resize. JS runs ONCE, only to calibrate the coefficient against the real
 * webfont. If it never runs, the CSS fallback coefficient still holds at every
 * width.
 */
const REFERENCE_PX = 100;

export function useFitText() {
  const boxRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return;

    let cancelled = false;

    /**
     * Measures the string's natural width at a reference size and solves for the
     * cqw coefficient that makes text width equal container width:
     *
     *   width(font) = natural * font / REFERENCE
     *   want width == C, and 1cqw == C/100
     *   => font = 100 * C / natural = (100 * REFERENCE / natural) cqw
     *
     * Note the result is INDEPENDENT of the current container width, which is
     * the whole point — calibrate at any size, correct at every size.
     */
    const calibrate = () => {
      if (cancelled) return;

      const previous = el.style.fontSize;
      el.style.fontSize = `${REFERENCE_PX}px`;
      // scrollWidth, not getBoundingClientRect: the element is nowrap and may
      // exceed its parent, and scrollWidth reports true content width.
      const natural = el.scrollWidth;
      el.style.fontSize = previous;

      if (!natural) return;

      // 0.5% under, deliberately. Glyph advance widths do not scale perfectly
      // linearly once hinting and sub-pixel rounding are involved, so a
      // coefficient calibrated at 1761px measured 100.6% at 907px and 101.3% at
      // 319px — enough to shave the final letter. Half a percent is invisible at
      // any size (9px on an ultrawide) and guarantees the line never clips.
      const SAFETY = 0.995;
      const coefficient = ((100 * REFERENCE_PX) / natural) * SAFETY;
      box.style.setProperty('--wm-fit', `${coefficient.toFixed(4)}cqw`);
    };

    // Calibrating against fallback metrics would solve for the wrong typeface, so
    // do it now (better than nothing) and again once the webfont lands.
    calibrate();
    document.fonts?.ready
      .then(() => {
        if (!cancelled) calibrate();
      })
      .catch(() => {});

    /* `fonts.ready` resolves against the fonts pending at that instant, so a
       late-arriving face can miss it — and a coefficient solved against FALLBACK
       metrics is too large, because the fallback is narrower than Archivo. The
       wordmark then renders wider than its box and `overflow: hidden` shaves the
       final letter: "CONVEX FUNDIN". A load pass and a settle tick close it. */
    const recalibrate = () => calibrate();
    window.addEventListener('load', recalibrate);
    const settle = setTimeout(recalibrate, 400);

    return () => {
      cancelled = true;
      clearTimeout(settle);
      window.removeEventListener('load', recalibrate);
    };
  }, []);

  return { boxRef, textRef };
}

export default useFitText;
