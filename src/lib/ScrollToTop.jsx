import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { useScroll } from './ScrollProvider';

/**
 * Reset scroll on every client-side route change.
 *
 * main.jsx already handles a fresh LOAD (manual scrollRestoration, plus a
 * scrollTo(0,0) and a repeat on `load`). None of that fires on an in-app
 * navigation, and every route link in this project lives in the footer — i.e. is
 * clicked from the very bottom of a ~4300px page. Measured before this existed:
 * from scrollY 3400 on '/', clicking Contact landed at 597px on a 1497px-tall
 * page, which is its scroll maximum. The visitor arrived at the BOTTOM of the new
 * route looking at the footer again, with the heading offscreen above.
 *
 * Both scrollers have to be reset, not just one:
 *   - window, because that is what the document actually does;
 *   - Lenis, because it caches its own scroll value and would otherwise stay at
 *     3400 while the window sat at 597 — the next wheel event then animates from
 *     the stale number and the page jumps.
 *
 * `immediate` because this is a page change, not a movement within a page: a 1.1s
 * glide through content the visitor never asked to see is worse than a cut.
 * `force` because Lenis may be stopped (a menu open while the click happened),
 * and a stopped instance ignores scrollTo without it.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const { lenis } = useScroll();

  useEffect(() => {
    /* Wipe ScrollTrigger's scroll memory, and re-assert manual restoration.
     *
     * This is the actual cause, not the browser. ScrollTrigger records the scroll
     * position per scroller and re-applies it on refresh() so a resize does not
     * lose the visitor's place. ScrollyCanvas calls refresh() twice as it mounts,
     * so returning to '/' had it restore the position from BEFORE the visitor
     * navigated away.
     *
     * Instrumented, on Back from /how-convex-works: interleaved
     * `window.scrollTo(0, 3000)` and `window.scrollTo(0, 0)` calls fighting each
     * other, with `history.scrollRestoration` pushed back to 'auto' four times.
     * The end state was Lenis at 0 while the window sat at 3000 — the view
     * mid-page while the smooth-scroll instance believed it was at the top, so
     * the next wheel event animated from 0 and the page jumped.
     *
     * clearScrollMemory is GSAP's own API for this, and it takes the restoration
     * mode, so it settles both halves. Removing the cause rather than racing it:
     * a timeout that merely fires last is only correct until a refresh lands one
     * tick later. */
    ScrollTrigger.clearScrollMemory('manual');

    const reset = () => {
      lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
    };

    reset();

    /* Then correct it again after each refresh, for a bounded window.
     *
     * clearScrollMemory pins the restoration mode (verified: 'manual' afterwards)
     * but does not stop the re-apply, because ScrollTrigger holds the position in
     * its scroller cache from before this navigation. Traced by stack, the caller
     * is unambiguous:
     *
     *   window.scrollTo <- gsap_ScrollTrigger _refreshAll   x4
     *
     * ScrollyCanvas refreshes as it mounts, and each refresh put the window back
     * to 3000 after this effect had already set 0.
     *
     * Bounded on purpose. Left attached permanently, ANY later refresh — a
     * resize, an orientation change, the stage recomputing its height — would
     * throw a reading visitor back to the top. 800ms covers mount; nothing after
     * that is navigation-related. */
    ScrollTrigger.addEventListener('refresh', reset);
    const detach = setTimeout(() => ScrollTrigger.removeEventListener('refresh', reset), 800);

    return () => {
      clearTimeout(detach);
      ScrollTrigger.removeEventListener('refresh', reset);
    };
  }, [pathname, lenis]);

  return null;
}
