import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import './Overlay.css';

gsap.registerPlugin(SplitText);

/**
 * Opacity partitioning: each phase gets a strictly non-overlapping window with
 * a dead zone after it, so two text blocks can never be on screen at once.
 * In the gaps only the canvas is visible.
 *
 * Ramps are deliberately SHORT and peaks LONG. The first cut used ~0.06 ramps
 * around a 0.10 peak, which meant a scrolling visitor spent more time looking
 * at half-transparent grey text than at readable white text. Now each phase
 * snaps in over ~0.04 and holds for ~0.16.
 *
 * `reveal` is the sub-window the character/line stagger is scrubbed across. It
 * sits inside the fade-in so the letters finish arriving as the phase reaches
 * full opacity.
 */
const calculateOpacity = (progress, fadeIn, peakStart, peakEnd, fadeOut) => {
  if (progress < fadeIn || progress > fadeOut) return 0;
  if (progress >= peakStart && progress <= peakEnd) return 1;
  if (progress < peakStart) return (progress - fadeIn) / (peakStart - fadeIn);
  if (fadeOut === peakEnd) return 1;
  return 1 - (progress - peakEnd) / (fadeOut - peakEnd);
};

const PHASES = [
  { fadeIn: 0.0, peakStart: 0.0, peakEnd: 0.165, fadeOut: 0.215, reveal: [0.0, 0.075] },
  { fadeIn: 0.255, peakStart: 0.295, peakEnd: 0.455, fadeOut: 0.495, reveal: [0.255, 0.33] },
  { fadeIn: 0.535, peakStart: 0.575, peakEnd: 0.715, fadeOut: 0.755, reveal: [0.535, 0.61] },
  // Ramp deliberately short. This phase carries the CTA, and a button drawn at
  // partial alpha over bright footage is unreadable — so it reaches full opacity
  // in ~1.7% of scroll rather than 4%.
  { fadeIn: 0.795, peakStart: 0.812, peakEnd: 1.0, fadeOut: 1.0, reveal: [0.795, 0.87] },
];

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Driven imperatively from the rAF loop — no React state at 60fps. */
const Overlay = forwardRef(function Overlay(_props, ref) {
  const phaseRefs = useRef([]);
  const headingRefs = useRef([]);
  const ledeRefs = useRef([]);
  const statsRefs = useRef([]);
  // Per phase, keyed by slot, so a re-split replaces its own timeline and
  // nothing else. (Keying by array position broke when autoSplit re-fired.)
  const timelinesRef = useRef([{}, {}, {}, {}]);
  // 'idle' -> 'playing' -> 'done'. Governs the phase-1 special case in update().
  const introRef = useRef('idle');

  /* --- Build the reveals once the webfont has actually landed --------------
   *
   * Deliberately NOT gated on prefers-reduced-motion.
   *
   * This reveal is scroll-scrubbed: its progress is set from scroll position,
   * so nothing moves unless the visitor moves it, and it stops the instant they
   * stop. That is the same category of motion as the frame sequence this page is
   * built on — which is the whole product and is not gated either. Disabling a
   * character stagger while a full-screen scrubbing film runs would be
   * inconsistent, not accessible.
   *
   * Autonomous, self-running motion is a different matter: GlowCursor pulses and
   * fades on its own timer, so THAT stays gated (see ScrollyCanvas).
   */
  useEffect(() => {
    let ctx;
    let cancelled = false;

    // Split AFTER fonts load. Cormorant Garamond arrives async, and splitting
    // against the fallback metrics produces wrong breaks and a visible reflow.
    document.fonts.ready.then(() => {
      if (cancelled) return;

      ctx = gsap.context(() => {
        headingRefs.current.forEach((el, i) => {
          if (!el) return;
          SplitText.create(el, {
            type: 'words, chars',
            smartWrap: true, // stops chars-only splits breaking mid-word
            autoSplit: true, // re-split on font load / width change
            onSplit(self) {
              const tl = gsap.timeline({ paused: true });
              tl.from(self.chars, {
                yPercent: 42,
                opacity: 0,
                duration: 0.6,
                ease: 'power3.out',
                stagger: { each: 0.012, from: 'start' },
              });
              timelinesRef.current[i].heading = tl;
              return tl;
            },
          });
        });

        // The stat rows are already discrete elements, so they need no split —
        // just their own paused timeline on the same scrub window.
        statsRefs.current.forEach((el, i) => {
          if (!el) return;
          const rows = el.querySelectorAll('.stat');
          if (!rows.length) return;
          const tl = gsap.timeline({ paused: true });
          tl.from(rows, {
            yPercent: 30,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.14,
          });
          timelinesRef.current[i].stats = tl;
        });

        ledeRefs.current.forEach((el, i) => {
          if (!el) return;
          SplitText.create(el, {
            type: 'lines',
            mask: 'lines', // wraps each line in an overflow-clip box
            autoSplit: true,
            onSplit(self) {
              const tl = gsap.timeline({ paused: true });
              tl.from(self.lines, {
                yPercent: 110,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.1,
              });
              timelinesRef.current[i].lede = tl;
              return tl;
            },
          });
        });
      });
    });

    return () => {
      cancelled = true;
      // Reverts the splits and kills the timelines in one call.
      ctx?.revert();
      timelinesRef.current = [{}, {}, {}, {}];
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      /**
       * Play phase 1's reveal as a real, time-based animation.
       *
       * Needed because phase 1's reveal window starts at progress 0, so a purely
       * scroll-scrubbed reveal leaves every character at opacity 0 while the
       * visitor sits at the top of the page — the section is "visible" but its
       * letters are not. That is why the hero looked like bare footage before
       * anyone scrolled. The entry reveal calls this on dismissal so
       * "Empowering traders" is on screen the instant the wordmark clears.
       */
      playIntro() {
        if (introRef.current !== 'idle') return;

        const start = () => {
          const slots = timelinesRef.current[0];
          const tls = [slots.heading, slots.lede, slots.stats].filter(Boolean);
          if (!tls.length) return false;

          introRef.current = 'playing';
          let settled = 0;
          tls.forEach((tl) => {
            tl.eventCallback('onComplete', () => {
              settled += 1;
              if (settled === tls.length) introRef.current = 'done';
            });
            tl.play(0);
          });
          return true;
        };

        // The splits only exist after the webfont lands, so this can be called
        // before there is anything to play.
        if (!start()) document.fonts.ready.then(start).catch(() => {});
      },

      update(progress) {
        for (let i = 0; i < PHASES.length; i += 1) {
          const el = phaseRefs.current[i];
          if (!el) continue;
          const { fadeIn, peakStart, peakEnd, fadeOut, reveal } = PHASES[i];

          const o = calculateOpacity(progress, fadeIn, peakStart, peakEnd, fadeOut);
          el.style.opacity = o;
          // Subtle parallax lift as the phase resolves. Transform only — GPU composited.
          el.style.transform = `translate3d(0, ${(1 - o) * 26}px, 0)`;
          el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';

          // Phase 1 is special-cased once the intro has run: while it plays, the
          // scrub keeps its hands off so the tween is not overwritten every
          // frame; afterwards its reveal is pinned complete, so scrolling back to
          // the very top leaves the headline standing instead of dissolving it.
          if (i === 0 && introRef.current !== 'idle') {
            if (introRef.current === 'playing') continue;
            const slots = timelinesRef.current[0];
            if (slots.heading) slots.heading.progress(1);
            if (slots.lede) slots.lede.progress(1);
            if (slots.stats) slots.stats.progress(1);
            continue;
          }

          // Scrub the character/line stagger across the reveal window. Setting
          // progress (rather than play/reverse) means scrolling back up runs the
          // letters out again, in step with the scroll.
          const [rStart, rEnd] = reveal;
          const local = clamp01((progress - rStart) / (rEnd - rStart));
          const slots = timelinesRef.current[i];
          if (slots.heading) slots.heading.progress(local);
          if (slots.lede) slots.lede.progress(local);
          if (slots.stats) slots.stats.progress(local);
        }
      },
    }),
    [],
  );

  const setPhaseRef = (i) => (el) => {
    phaseRefs.current[i] = el;
  };
  const setHeadingRef = (i) => (el) => {
    headingRefs.current[i] = el;
  };
  const setLedeRef = (i) => (el) => {
    ledeRefs.current[i] = el;
  };
  const setStatsRef = (i) => (el) => {
    statsRefs.current[i] = el;
  };

  return (
    <div className="overlay">
      <section className="overlay__phase overlay__phase--center" ref={setPhaseRef(0)}>
        <h1 className="display display--hero" ref={setHeadingRef(0)}>
          Empowering traders with{' '}
          <br />
          capital, opportunity,{' '}
          <br />
          and growth.
        </h1>
        <p className="lede" ref={setLedeRef(0)}>
          A proprietary trading firm backing traders with a proven edge.
        </p>
      </section>

      <section className="overlay__phase overlay__phase--left" ref={setPhaseRef(1)}>
        <h2 className="display display--lg" ref={setHeadingRef(1)}>
          Rewarding skill,{' '}
          <br />
          consistency, and{' '}
          <br />
          disciplined performance.
        </h2>
        <p className="lede" ref={setLedeRef(1)}>
          Convex Funding gives talented traders access to capital, professional trading
          opportunities, and a clear path to growth &mdash; helping them unlock their full potential
          in today&rsquo;s dynamic financial markets.
        </p>
      </section>

      <section className="overlay__phase overlay__phase--right" ref={setPhaseRef(2)}>
        <div className="stats" ref={setStatsRef(2)}>
          <div className="stat">
            <span className="stat__label">Profit split</span>
            <span className="stat__value">90%</span>
          </div>
          <div className="stat">
            <span className="stat__label">Max funding</span>
            <span className="stat__value">$200K</span>
          </div>
          <div className="stat">
            <span className="stat__label">Payout speed</span>
            {/* &lt; is required — a bare "<" opens a tag in JSX. */}
            <span className="stat__value">&lt;24h</span>
          </div>
          <div className="stat">
            <span className="stat__label">Pass rate</span>
            <span className="stat__value">31.4%</span>
          </div>
        </div>
      </section>

      {/* Left-aligned, not centred: the footage ends on a centred CONVEX FUNDING
          logo reveal, and centred text landed straight on top of the wordmark —
          two focal points cancelling each other out. The left third of that
          frame is dark glass and empty, so the closing copy lives there.
          On phones the portrait frame puts that wordmark dead centre, so the
          block is anchored high instead (see Overlay.css). */}
      <section className="overlay__phase overlay__phase--left overlay__phase--close" ref={setPhaseRef(3)}>
        <h2 className="display display--lg" ref={setHeadingRef(3)}>One evaluation{' '}
          <br />
          stands between you{' '}
          <br />
          and our capital.
        </h2>
        {/* One action, not two. "See funding tiers" competed with the real
            conversion step and pointed at a section that does not exist yet. */}
        <div className="cta-row">
          {/* Routes to /contact. It was href="#start" — an anchor with nothing
              behind it, so the single most important click on the site did
              nothing except append #start to the URL. Contact is the real next
              step for someone who has just watched the film; /programs was the
              alternative and is currently a coming-soon page, which is a poor
              landing for the highest-intent click on the page.

              A router Link, not a plain href, so it does not full-page reload
              and throw away the frame sequence the visitor just streamed.

              Structure unchanged: the label needs its own element so it can sit
              above the travelling puck, and the arrow lives inside the puck. */}
          <Link className="btn btn--primary" to="/contact">
            <span className="btn__label">Start an evaluation</span>
            <span className="btn__icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11 11 3" />
                <path d="M5 3h6v6" />
              </svg>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
});

export default Overlay;
