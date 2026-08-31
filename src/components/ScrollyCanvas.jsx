import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import StickyCanvas from './StickyCanvas';
import Overlay from './Overlay';
import GlowCursor from './GlowCursor';
import { createFrameLoader } from '../lib/frameLoader';
import { useScroll } from '../lib/ScrollProvider';
import { computeStageHeight, getSequenceConfig } from '../config/sequence';

gsap.registerPlugin(ScrollTrigger);

const ScrollyCanvas = forwardRef(function ScrollyCanvas(_props, ref) {
  const { lenis } = useScroll();

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const framesRef = useRef([]);
  const progressRef = useRef(0);
  const loaderRef = useRef(null);
  const dirtyRef = useRef(true);

  // Resolved once, at boot. See getSequenceConfig for why it is not reactive.
  const [config] = useState(getSequenceConfig);

  // GlowCursor is pointer-driven and costs a second WebGL context, so it only
  // mounts where there is a real cursor and motion is welcome.
  const [wantsGlow] = useState(
    () =>
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Stage height IS reactive — it keeps px-per-frame constant across displays.
  const [stageHeight, setStageHeight] = useState(() => computeStageHeight(config.totalFrames));

  /* --- Keep px-per-frame steady when the viewport changes ------------------- */
  useEffect(() => {
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Mobile browsers resize by ~60-100px as their chrome hides on scroll.
      // Reacting to that would re-measure the stage mid-scroll and jump the page.
      if (w === lastW && Math.abs(h - lastH) < 120) return;
      lastW = w;
      lastH = h;
      setStageHeight(computeStageHeight(config.totalFrames));
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [config]);

  // The stage box changed, so ScrollTrigger's cached start/end are stale.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [stageHeight]);

  // The entry reveal has to be able to kick phase 1's reveal once it clears.
  useImperativeHandle(ref, () => ({ playIntro: () => overlayRef.current?.playIntro() }), []);

  /* --- 1. Frames stream in quietly. Nothing blocks the page. ---------------- */
  useEffect(() => {
    const loader = createFrameLoader(config);
    loaderRef.current = loader;
    framesRef.current = loader.frames;

    // Any newly arrived frame may be a better match for where we are sitting,
    // so mark the canvas dirty and let the ticker redraw it.
    let lastStats = null;
    const off = loader.onProgress((stats) => {
      lastStats = stats;
      dirtyRef.current = true;
    });

    loader
      .start({
        onFirstFrame: () => {
          dirtyRef.current = true;
          canvasRef.current?.draw(0, 0);
        },
      })
      .then(() => {
        if (lastStats?.failedCount) {
          console.warn(
            `[ScrollyCanvas] ${lastStats.failedCount}/${lastStats.totalFrames} frames failed to load ` +
              `from ${config.folder}. Those positions fall back to the nearest frame that did load.`,
          );
        }
      });

    return () => {
      off();
      loader.cancel();
      loaderRef.current = null;
    };
  }, [config]);

  /* --- 2. ScrollTrigger + the draw loop -----------------------------------
   *
   * Lenis itself lives in ScrollProvider now (it drives gsap.ticker and calls
   * ScrollTrigger.update there), because the entry reveal and the menu both need
   * to lock scrolling and could not reach an instance scoped to this component.
   * This effect only owns the trigger and the canvas draw loop.
   */
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    // Draws happen on the ticker, not in onUpdate — one rAF loop for the whole
    // page, and a scroll burst can never queue several draws per frame.
    const { totalFrames } = config;
    let lastDrawn = -1;

    const render = () => {
      const p = progressRef.current;
      const target = Math.min(totalFrames - 1, Math.floor(p * totalFrames));
      const index = loaderRef.current ? loaderRef.current.nearestLoaded(target) : -1;

      if (index !== lastDrawn || dirtyRef.current) {
        canvasRef.current?.draw(index, p);
        lastDrawn = index;
        dirtyRef.current = false;
      }

      overlayRef.current?.update(p);
    };

    gsap.ticker.add(render);
    ScrollTrigger.refresh();
    render();

    // Dev-only diagnostic handle. Stripped from production builds.
    if (import.meta.env.DEV) {
      window.__convex = {
        trigger,
        lenis,
        config,
        get tickerFrame() {
          return gsap.ticker.frame;
        },
        get progress() {
          return progressRef.current;
        },
        get triggerProgress() {
          return trigger.progress;
        },
        get stage() {
          const stagePx = containerRef.current?.offsetHeight ?? 0;
          const scrollable = Math.max(0, stagePx - window.innerHeight);
          return {
            stagePx,
            asVh: Math.round((stagePx / window.innerHeight) * 100),
            scrollable,
            pxPerFrame: +(scrollable / totalFrames).toFixed(1),
          };
        },
      };
    }

    return () => {
      gsap.ticker.remove(render);
      trigger.kill();
      if (import.meta.env.DEV) delete window.__convex;
    };
  }, [config, lenis]);

  return (
    <div className="scroll-container" ref={containerRef} style={{ height: `${stageHeight}px` }}>
      <StickyCanvas ref={canvasRef} framesRef={framesRef} />

      {/* Sits between the footage (z1) and the copy (z3). The overlay above it is
          pointer-events:none, so pointermove still reaches this layer, while the
          CTA — which IS pointer-events:auto — stays clickable on top. Brand green
          rather than the demo's cyan/purple. */}
      {wantsGlow && (
        <GlowCursor
          className="stage-glow"
          color="#34C88A"
          secondaryColor="#22B573"
          trailLength={38}
          trailWidth={7}
          trailTaper={0.85}
          followSpeed={0.15}
          glowIntensity={1.5}
          glowSpread={1.1}
          hotspot={0.5}
          brightness={1.1}
          opacity={0.85}
          pulseSpeed={0.9}
          noiseStrength={0.03}
          idleFade
          idleTimeout={900}
          fadeDuration={1000}
          blendMode="screen"
          maxDevicePixelRatio={1.5}
        />
      )}

      <Overlay ref={overlayRef} />
    </div>
  );
});

export default ScrollyCanvas;
