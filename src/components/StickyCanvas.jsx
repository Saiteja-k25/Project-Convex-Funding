import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { GRADE, MAX_DPR } from '../config/sequence';

/**
 * Low-level canvas: owns the element, the DPI-scaled backing store, and drawImage.
 *
 * Exposes an imperative `draw(frameIndex, progress)` rather than taking props,
 * because this is called from a requestAnimationFrame loop at 60fps and React
 * state updates at that rate would thrash the reconciler.
 */
const StickyCanvas = forwardRef(function StickyCanvas({ framesRef }, ref) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const lastRef = useRef({ index: -1, progress: 0 });

  /** Size the backing store to devicePixelRatio, keep the drawing API in CSS px. */
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxRef.current = ctx;
    sizeRef.current = { w, h };
  }, []);

  /**
   * Grade the footage: one even darkening plus a soft vignette, applied after
   * every frame. Replaces the per-phase text scrims, which read as black panels.
   */
  const applyGrade = useCallback((ctx, w, h) => {
    ctx.fillStyle = `rgba(7, 11, 17, ${GRADE.flat})`;
    ctx.fillRect(0, 0, w, h);

    const vg = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.22,
      w / 2, h / 2, Math.max(w, h) * 0.72,
    );
    vg.addColorStop(0, 'rgba(7, 11, 17, 0)');
    vg.addColorStop(1, `rgba(7, 11, 17, ${GRADE.vignette})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }, []);

  /** Brand-coloured stand-in for a frame that failed to load. */
  const drawFallback = useCallback((ctx, w, h, progress) => {
    ctx.fillStyle = '#070B11';
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.78, h * 0.22, 0, w * 0.78, h * 0.22, w * 0.62);
    glow.addColorStop(0, 'rgba(34,181,115,0.20)');
    glow.addColorStop(0.42, 'rgba(18,49,79,0.16)');
    glow.addColorStop(1, 'rgba(7,11,17,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // The convex curve from the logo mark, drawn in proportion to scroll.
    const x0 = w * 0.1;
    const y0 = h * 0.82;
    const x1 = w * 0.9;
    const y1 = h * 0.2;
    const t = Math.max(0.02, Math.min(1, progress));

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, x0 + (x1 - x0) * t, h);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x0 + (x1 - x0) * 0.45, y0 - (y0 - y1) * 0.04, x0 + (x1 - x0) * 0.72, y0 - (y0 - y1) * 0.42, x1, y1);
    ctx.strokeStyle = '#22B573';
    ctx.lineWidth = Math.max(2, w * 0.0018);
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }, []);

  /** Object-fit: cover, computed by hand — canvas has no such property. */
  const draw = useCallback(
    (index, progress) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const { w, h } = sizeRef.current;
      if (!w || !h) return;

      lastRef.current = { index, progress };

      const img = framesRef.current?.[index];
      if (!img || !img.complete || !img.naturalWidth) {
        drawFallback(ctx, w, h, progress);
        return;
      }

      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = w / h;

      let renderW;
      let renderH;
      let renderX;
      let renderY;

      if (canvasRatio > imgRatio) {
        renderW = w;
        renderH = w / imgRatio;
        renderX = 0;
        renderY = (h - renderH) / 2;
      } else {
        renderH = h;
        renderW = h * imgRatio;
        renderX = (w - renderW) / 2;
        renderY = 0;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, renderX, renderY, renderW, renderH);
      applyGrade(ctx, w, h);
    },
    [framesRef, drawFallback, applyGrade],
  );

  useImperativeHandle(ref, () => ({ draw, resize }), [draw, resize]);

  useEffect(() => {
    resize();
    const onResize = () => {
      resize();
      const { index, progress } = lastRef.current;
      draw(index < 0 ? 0 : index, progress);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [resize, draw]);

  return <canvas ref={canvasRef} className="sticky-canvas" aria-hidden="true" />;
});

export default StickyCanvas;
