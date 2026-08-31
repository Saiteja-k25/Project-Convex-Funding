import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Owns the single Lenis instance for the whole page.
 *
 * It used to live inside ScrollyCanvas, which meant nothing outside that
 * component could reach it — so neither the entry reveal nor the menu could stop
 * the page scrolling underneath itself. Lifting it here is the smallest change
 * that makes scroll lock possible without duplicating a second smooth-scroll
 * engine.
 *
 * Locking is REFERENCE COUNTED. The entry reveal and the menu can both hold a
 * lock at once (open the menu during the reveal and the reveal still owns one),
 * and scrolling only resumes when the last holder releases. A plain boolean here
 * would let whichever closed first hand scrolling back too early.
 *
 * Deliberately `lenis.stop()` rather than `overflow: hidden` on <html>: hiding
 * overflow removes the scrollbar, which reflows the page by its width and makes
 * every fixed element jump sideways as the menu opens.
 */

const ScrollCtx = createContext(null);

export function ScrollProvider({ children }) {
  const [lenis, setLenis] = useState(null);
  const locksRef = useRef(new Set());

  useEffect(() => {
    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    const onScroll = () => ScrollTrigger.update();
    instance.on('scroll', onScroll);

    const rafDriver = (time) => instance.raf(time * 1000);
    gsap.ticker.add(rafDriver);
    gsap.ticker.lagSmoothing(0);

    // Lenis caches its own scroll position, so main.jsx's window.scrollTo is not
    // enough on its own — without this a reload can still resume mid-page.
    instance.scrollTo(0, { immediate: true });

    setLenis(instance);

    return () => {
      gsap.ticker.remove(rafDriver);
      instance.off('scroll', onScroll);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  /**
   * `lenis.stop()` alone is NOT a scroll lock on a phone.
   *
   * Lenis leaves touch scrolling to the browser by default (smoothTouch is off),
   * so it never sees a finger drag — stopping it only stops the wheel. That is
   * exactly why the page scrolled behind the open mobile menu. The attribute
   * below lets CSS block the gesture itself (see index.css).
   */
  const lock = useCallback(
    (owner) => {
      locksRef.current.add(owner);
      lenis?.stop();
      document.documentElement.setAttribute('data-scroll-locked', '');
    },
    [lenis],
  );

  const unlock = useCallback(
    (owner) => {
      locksRef.current.delete(owner);
      if (locksRef.current.size === 0) {
        lenis?.start();
        document.documentElement.removeAttribute('data-scroll-locked');
      }
    },
    [lenis],
  );

  /**
   * Anchor scrolling has to go through Lenis. `href="#id"` native jumps fight
   * the smooth-scroll engine and land at the wrong offset.
   */
  const scrollTo = useCallback(
    (target, options) => {
      if (!lenis) return;
      lenis.scrollTo(target, { duration: 1.1, ...options });
    },
    [lenis],
  );

  return (
    <ScrollCtx.Provider value={{ lenis, lock, unlock, scrollTo }}>{children}</ScrollCtx.Provider>
  );
}

/** Returns a stable no-op shape before Lenis mounts, so callers never branch. */
export function useScroll() {
  return (
    useContext(ScrollCtx) ?? {
      lenis: null,
      lock: () => {},
      unlock: () => {},
      scrollTo: () => {},
    }
  );
}
