import { useCallback, useEffect, useRef } from 'react';
import './ElectricBorder.css';

// CREDIT
// Component inspired by @BalintFerenczy on X
// https://codepen.io/BalintFerenczy/pen/KwdoyEN
//
// Three deliberate deviations from the published React Bits source. Each is
// noted at the point it happens, but in summary:
//
//   1. `animate` prop. Upstream runs an unconditional rAF loop for as long as the
//      component is mounted. That is autonomous, self-running motion — the same
//      category as GlowCursor, which this project gates on prefers-reduced-motion
//      and on having a real cursor. With `animate={false}` this draws exactly ONE
//      frame and never schedules another, so the border still reads as a jagged
//      electric outline; it simply holds still and costs nothing.
//
//   2. Alpha variants are computed in JS, not with `oklch(from ...)`. Relative
//      colour syntax needs Chrome 131+ / Safari 18. On anything older the custom
//      property is invalid, `--electric-light-color` resolves to nothing, and the
//      two glow rings vanish with no error. We always pass a hex, so deriving
//      rgba() here is both exact and universally supported.
//
//   3. First-frame delta is clamped. Upstream seeds `lastFrameTimeRef` at 0 and
//      subtracts it from `performance.now()`, so the very first frame advances the
//      noise clock by however long the page has been open. Harmless when looping,
//      but it makes a single static frame's phase depend on load time.

/** #rgb / #rrggbb -> "rgba(r, g, b, a)". Non-hex input is returned untouched. */
const withAlpha = (color, alpha) => {
  if (typeof color !== 'string' || color[0] !== '#') return color;
  let hex = color.slice(1);
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return color;
  const n = Number.parseInt(hex, 16);
  if (Number.isNaN(n)) return color;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const ElectricBorder = ({
  children,
  color = '#5227FF',
  speed = 1,
  chaos = 0.12,
  borderRadius = 24,
  animate = true,
  /* Starting point on the noise clock. Two frozen borders of the same size are
     otherwise pixel-identical, which reads as a repeated texture rather than two
     instances of an effect — give each card its own phase. */
  phase = 0,
  className,
  style,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  // Noise functions
  const random = useCallback((x) => {
    return (Math.sin(x * 12.9898) * 43758.5453) % 1;
  }, []);

  const noise2D = useCallback(
    (x, y) => {
      const i = Math.floor(x);
      const j = Math.floor(y);
      const fx = x - i;
      const fy = y - j;

      const a = random(i + j * 57);
      const b = random(i + 1 + j * 57);
      const c = random(i + (j + 1) * 57);
      const d = random(i + 1 + (j + 1) * 57);

      const ux = fx * fx * (3.0 - 2.0 * fx);
      const uy = fy * fy * (3.0 - 2.0 * fy);

      return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
    },
    [random],
  );

  const octavedNoise = useCallback(
    (x, octaves, lacunarity, gain, baseAmplitude, baseFrequency, time, seed, baseFlatness) => {
      let y = 0;
      let amplitude = baseAmplitude;
      let frequency = baseFrequency;

      for (let i = 0; i < octaves; i++) {
        let octaveAmplitude = amplitude;
        if (i === 0) {
          octaveAmplitude *= baseFlatness;
        }
        y += octaveAmplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
        frequency *= lacunarity;
        amplitude *= gain;
      }

      return y;
    },
    [noise2D],
  );

  const getCornerPoint = useCallback((centerX, centerY, radius, startAngle, arcLength, progress) => {
    const angle = startAngle + progress * arcLength;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  }, []);

  const getRoundedRectPoint = useCallback(
    (t, left, top, width, height, radius) => {
      const straightWidth = width - 2 * radius;
      const straightHeight = height - 2 * radius;
      const cornerArc = (Math.PI * radius) / 2;
      const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
      const distance = t * totalPerimeter;

      let accumulated = 0;

      // Top edge
      if (distance <= accumulated + straightWidth) {
        const progress = (distance - accumulated) / straightWidth;
        return { x: left + radius + progress * straightWidth, y: top };
      }
      accumulated += straightWidth;

      // Top-right corner
      if (distance <= accumulated + cornerArc) {
        const progress = (distance - accumulated) / cornerArc;
        return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, progress);
      }
      accumulated += cornerArc;

      // Right edge
      if (distance <= accumulated + straightHeight) {
        const progress = (distance - accumulated) / straightHeight;
        return { x: left + width, y: top + radius + progress * straightHeight };
      }
      accumulated += straightHeight;

      // Bottom-right corner
      if (distance <= accumulated + cornerArc) {
        const progress = (distance - accumulated) / cornerArc;
        return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, progress);
      }
      accumulated += cornerArc;

      // Bottom edge
      if (distance <= accumulated + straightWidth) {
        const progress = (distance - accumulated) / straightWidth;
        return { x: left + width - radius - progress * straightWidth, y: top + height };
      }
      accumulated += straightWidth;

      // Bottom-left corner
      if (distance <= accumulated + cornerArc) {
        const progress = (distance - accumulated) / cornerArc;
        return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, progress);
      }
      accumulated += cornerArc;

      // Left edge
      if (distance <= accumulated + straightHeight) {
        const progress = (distance - accumulated) / straightHeight;
        return { x: left, y: top + height - radius - progress * straightHeight };
      }
      accumulated += straightHeight;

      // Top-left corner
      const progress = (distance - accumulated) / cornerArc;
      return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, progress);
    },
    [getCornerPoint],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const octaves = 10;
    const lacunarity = 1.6;
    const gain = 0.7;
    const amplitude = chaos;
    const frequency = 10;
    const baseFlatness = 0;
    const displacement = 60;
    const borderOffset = 60;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width + borderOffset * 2;
      const height = rect.height + borderOffset * 2;

      // Use device pixel ratio for sharp rendering
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      return { width, height };
    };

    let { width, height } = updateSize();
    let lastDpr = Math.min(window.devicePixelRatio || 1, 2);

    // Seed the noise clock, and reset the frame stamp so a re-run of this effect
    // (a colour or animate change) starts clean rather than inheriting a delta.
    timeRef.current = phase;
    lastFrameTimeRef.current = 0;

    /* Off-screen pause.
     *
     * Defaults to TRUE, and that direction is the whole point: an
     * IntersectionObserver callback is delivered as part of the rendering
     * lifecycle, exactly like rAF and ResizeObserver, so there are contexts in
     * this project where it never arrives at all (measured — see useFitText).
     * Starting from `true` means a browser that never reports intersection simply
     * animates forever, which is the harmless outcome. Starting from `false`
     * would mean the border never lights up, which is the bug.
     *
     * Worth having because the Leadership section sits ~1500px down /about: with
     * no gate, both cards run a canvas loop the whole time a visitor is reading
     * the top of the page. Each frame walks the full perimeter through ten
     * octaves of noise on two axes, so it is not free. */
    let onScreen = true;

    const drawElectricBorder = (currentTime) => {
      if (!canvas || !ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (dpr !== lastDpr) {
        lastDpr = dpr;
        const newSize = updateSize();
        width = newSize.width;
        height = newSize.height;
      }

      // DEVIATION 3: on the first frame there is no previous timestamp, so treat
      // the delta as zero instead of as "milliseconds since the page loaded".
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = currentTime;
      const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000;
      timeRef.current += deltaTime * speed;
      lastFrameTimeRef.current = currentTime;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const scale = displacement;
      const left = borderOffset;
      const top = borderOffset;
      const borderWidth = width - 2 * borderOffset;
      const borderHeight = height - 2 * borderOffset;
      const maxRadius = Math.min(borderWidth, borderHeight) / 2;
      const radius = Math.min(borderRadius, maxRadius);

      const approximatePerimeter = 2 * (borderWidth + borderHeight) + 2 * Math.PI * radius;
      const sampleCount = Math.floor(approximatePerimeter / 2);

      ctx.beginPath();

      for (let i = 0; i <= sampleCount; i++) {
        const progress = i / sampleCount;

        const point = getRoundedRectPoint(progress, left, top, borderWidth, borderHeight, radius);

        const xNoise = octavedNoise(
          progress * 8,
          octaves,
          lacunarity,
          gain,
          amplitude,
          frequency,
          timeRef.current,
          0,
          baseFlatness,
        );

        const yNoise = octavedNoise(
          progress * 8,
          octaves,
          lacunarity,
          gain,
          amplitude,
          frequency,
          timeRef.current,
          1,
          baseFlatness,
        );

        const displacedX = point.x + xNoise * scale;
        const displacedY = point.y + yNoise * scale;

        if (i === 0) {
          ctx.moveTo(displacedX, displacedY);
        } else {
          ctx.lineTo(displacedX, displacedY);
        }
      }

      ctx.closePath();
      ctx.stroke();

      // DEVIATION 1: only keep the loop alive when motion is wanted AND the card
      // is actually on screen.
      if (animate && onScreen) {
        animationRef.current = requestAnimationFrame(drawElectricBorder);
      } else {
        animationRef.current = null;
      }
    };

    // Handle resize. Kept in the static case too, so a frozen border re-draws at
    // the right size after a rotate or a font-driven reflow instead of stretching.
    const resizeObserver = new ResizeObserver(() => {
      const newSize = updateSize();
      width = newSize.width;
      height = newSize.height;
      if (!animate) drawElectricBorder(performance.now());
    });
    resizeObserver.observe(container);

    /* Pause the loop while the card is off screen, resume when it returns.
     *
     * `rootMargin` starts it a little before the card scrolls into view, so it is
     * already alive by the time it is looked at rather than visibly kicking off.
     * On resume the frame stamp is cleared so the first frame after a pause has a
     * zero delta instead of a jump proportional to how long it was idle. */
    let io = null;
    if (animate && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          const next = entries.some((e) => e.isIntersecting);
          if (next === onScreen) return;
          onScreen = next;
          if (onScreen && !animationRef.current) {
            lastFrameTimeRef.current = 0;
            animationRef.current = requestAnimationFrame(drawElectricBorder);
          }
        },
        { rootMargin: '200px 0px' },
      );
      io.observe(container);
    }

    /* DEVIATION 1b: the FIRST frame is drawn synchronously, always — animated or
       not — and drawElectricBorder schedules the next one itself, so this single
       call starts the loop when it should.
     *
     * Upstream begins with `requestAnimationFrame(draw)`, which has two costs.
     * The small one: the card paints for one frame with no border, then it
     * appears. The large one: rAF is delivered as part of the rendering
     * lifecycle, so in a tab that is not compositing it never arrives at all —
     * measured repeatedly in this project (see useFitText, where a
     * ResizeObserver fired zero times for the same reason). A border whose very
     * first frame is owed to rAF is a border that is simply absent there. */
    drawElectricBorder(performance.now());

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      io?.disconnect();
      resizeObserver.disconnect();
    };
  }, [color, speed, chaos, borderRadius, animate, phase, octavedNoise, getRoundedRectPoint]);

  // DEVIATION 2: alpha variants resolved here rather than in CSS.
  const vars = {
    '--electric-border-color': color,
    '--electric-light-color': color,
    '--electric-border-color-soft': withAlpha(color, 0.6),
    borderRadius: borderRadius,
  };

  return (
    <div ref={containerRef} className={`electric-border ${className ?? ''}`} style={{ ...vars, ...style }}>
      <div className="eb-canvas-container">
        <canvas ref={canvasRef} className="eb-canvas" />
      </div>
      <div className="eb-layers">
        <div className="eb-glow-1" />
        <div className="eb-glow-2" />
        <div className="eb-background-glow" />
      </div>
      <div className="eb-content">{children}</div>
    </div>
  );
};

export default ElectricBorder;
