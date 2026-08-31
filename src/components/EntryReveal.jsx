import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

import MaskedHeading from '../reactbits/MaskedHeading';
import { useScroll } from '../lib/ScrollProvider';
import './EntryReveal.css';

/**
 * The entry moment. NOT a preloader — there is no counter and no ENTER button.
 *
 * CONVEX FUNDING fills the screen, masked with the logo-reveal footage, and just
 * holds. Scroll is locked while it holds, so the visitor cannot scroll past a
 * hero they have not seen. A tap anywhere fires a ripple from the touch point,
 * the wordmark lifts away, scroll unlocks, and the sequence takes over at
 * "Empowering traders" — which is why `onDismissed` exists: the overlay's phase 1
 * reveal has to be told to play, since scroll position 0 would otherwise leave
 * its characters at opacity 0.
 *
 * Runs on phones too, with two adjustments: the type is scaled up (a phone's
 * narrow container would otherwise compute a tiny font from `textScale`), and
 * `flash={false}` drops the ripple and the brightness pulse so a tap simply
 * clears the screen. On a small screen the flash read as a glitch rather than a
 * flourish.
 */

const LOCK_OWNER = 'entry-reveal';

export default function EntryReveal({ src, onDismissed, flash = true, textScale = 0.115 }) {
  const rootRef = useRef(null);
  const rippleRef = useRef(null);
  const headingRef = useRef(null);
  const hintRef = useRef(null);
  const busyRef = useRef(false);
  const [gone, setGone] = useState(false);
  const { lock, unlock } = useScroll();

  // Lock immediately on mount, before the visitor can touch the wheel.
  useEffect(() => {
    lock(LOCK_OWNER);
    return () => unlock(LOCK_OWNER);
  }, [lock, unlock]);

  // The "tap to continue" hint earns its place only after the wordmark has
  // finished arriving — showing it during the rise reads as an error state.
  useEffect(() => {
    const hint = hintRef.current;
    if (!hint) return;
    const tween = gsap.fromTo(
      hint,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.8, delay: 1.9, ease: 'power2.out' },
    );
    return () => tween.kill();
  }, []);

  const dismiss = useCallback(
    (event) => {
      if (busyRef.current) return;
      busyRef.current = true;

      const root = rootRef.current;
      const ripple = rippleRef.current;
      const heading = headingRef.current;

      // Ripple originates at the pointer. Falls back to centre for keyboard.
      if (flash && ripple && root) {
        const r = root.getBoundingClientRect();
        const x = event?.clientX ?? r.width / 2;
        const y = event?.clientY ?? r.height / 2;
        gsap.set(ripple, { left: x, top: y, scale: 0, opacity: 0.9 });
        gsap.to(ripple, { scale: 1, opacity: 0, duration: 0.9, ease: 'power2.out' });
      }

      // Release the lock and hand off IMMEDIATELY, not in onComplete.
      //
      // Two reasons. Safety: if the timeline ever fails to complete — killed by a
      // context revert, or starved because the tab was backgrounded mid-tween —
      // an onComplete-only unlock leaves the page permanently unscrollable, which
      // is the worst failure this component can have. And it reads better: the
      // headline underneath now reveals while the mask is still clearing, instead
      // of waiting for it to finish.
      unlock(LOCK_OWNER);
      onDismissed?.();

      const tl = gsap.timeline({ onComplete: () => setGone(true) });

      if (flash) {
        // Letters brighten as they let go, then the whole block drifts up and out.
        if (heading) {
          tl.to(heading, { filter: 'brightness(1.9)', duration: 0.18, ease: 'power1.out' }, 0)
            .to(heading, { filter: 'brightness(1)', duration: 0.4, ease: 'power2.out' }, 0.18)
            .to(heading, { scale: 1.06, y: -28, duration: 0.8, ease: 'power3.inOut' }, 0.1);
        }
        if (hintRef.current) {
          tl.to(hintRef.current, { opacity: 0, duration: 0.2, ease: 'power1.out' }, 0);
        }
        tl.to(root, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 0.34);
      } else {
        // Flash-less: tap and it is gone. A short fade with the faintest lift, so
        // it reads as a handoff rather than a cut, and nothing pulses or ripples.
        if (heading) tl.to(heading, { scale: 1.03, duration: 0.45, ease: 'power2.out' }, 0);
        if (hintRef.current) tl.to(hintRef.current, { opacity: 0, duration: 0.14 }, 0);
        tl.to(root, { opacity: 0, duration: 0.42, ease: 'power2.inOut' }, 0.04);
      }
    },
    [flash, onDismissed, unlock],
  );

  // Keyboard parity — Enter/Space must do what a tap does.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        dismiss(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismiss]);

  if (gone) return null;

  return (
    <div
      className="entry"
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-label="Enter the Convex Funding site"
      onPointerDown={dismiss}
    >
      <span className="entry__ripple" ref={rippleRef} aria-hidden="true" />

      <div className="entry__heading" ref={headingRef}>
        <MaskedHeading
          tag="h1"
          text="CONVEX FUNDING"
          mediaType="image"
          src={src}
          reveal="rise"
          trigger="mount"
          duration={1.35}
          stagger={0.14}
          align="center"
          weight={800}
          tracking={-0.045}
          lineHeight={0.94}
          /* Upstream default on desktop (0.115); phones pass a larger value,
             because font size is derived from container width and a 359px
             container would otherwise yield ~41px type. */
          textScale={textScale}
          fillScale={1.35}
          parallax={38}
          drift={16}
          brightness={1.18}
          saturation={1.05}
        />
      </div>

      <span className="entry__hint" ref={hintRef}>
        Tap anywhere to enter
      </span>
    </div>
  );
}
