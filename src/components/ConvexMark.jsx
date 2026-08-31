/**
 * Convex Funding mark, redrawn as vector.
 *
 * WHY THIS EXISTS: no vector of the logo exists — the company was given only flat
 * JPEGs. A keyed-from-JPEG raster has a soft alpha matte by construction, cannot
 * produce a light-on-dark variant, and breaks down when scaled up.
 *
 * IT IS A REDRAW, NOT A TRACE, but the geometry is measured off the 3209px
 * original rather than eyeballed.
 *
 * SECOND PASS — the first version had three faults, all traced to one cause: the
 * green mask used to sample the swoosh was loose enough (`G > R+28`) to also
 * catch the dark teal bar at the left, which dragged the curve fit off.
 * Re-measured with a strict bright-green test (`G > 130 && G > R+40`):
 *   - the tip is at x 75.8%, blunt — not a needle point at 74.5%
 *   - the band was ~3.5% too thick through the upper middle
 *   - a whole bar after the peak (x 80-85.7%) was missing
 *   - the short right bar runs to x 100%, and the green "stem" is its own right
 *     edge, not a separate element floating past a gap
 *
 * viewBox 939x1000 is the measured aspect of the ink box (0.9393), so the drawing
 * carries its own proportions and callers set only a height.
 */

/* Measured bar rects: [x, width, top] in viewBox units. */
const BARS = [
  { x: 54.8, w: 113.6, y: 639.0, fill: 'teal' },
  { x: 189.1, w: 133.9, y: 551.5, fill: 'tealDeep' },
  { x: 347.2, w: 120.7, y: 419.3, fill: 'navy' },
  { x: 497.3, w: 107.4, y: 252.9, fill: 'navy' },
  { x: 635.0, w: 108.4, y: 91.7, fill: 'navy' }, // tallest
  { x: 751.2, w: 53.5, y: 255.0, fill: 'navy' }, // the step down after the peak
];

/**
 * The swoosh, plus the left axis stem as one continuous shape.
 *
 * Outer edge runs from the stem top (5,679) to the blunt tip (704,15); the return
 * leg is the measured INNER edge, which is what makes the band taper — thin at
 * the left (4.7% of height), thickest around x50-55% (16.7%), narrowing again
 * into the tip.
 */
const SWOOSH =
  'M 5 679 L 28 674 ' +
  'C 100 650, 175 605, 235 568 ' +
  'C 320 505, 425 400, 516 301 ' +
  'C 580 230, 650 115, 704 15 ' +
  'L 710 34 ' +
  'C 675 205, 600 400, 516 467 ' +
  'C 460 505, 330 600, 235 655 ' +
  'C 180 680, 105 705, 47 714 ' +
  'L 38 716 L 38 1000 L 5 1000 Z';

/* The short right bar is an OUTLINED shape: teal body, green stroke along its top
   edge and down its right edge, running flush to the mark's right edge. */
const RIGHT_BAR = { x: 826.3, w: 112.7, y: 775.0, stroke: 22.0, edge: 19.0 };

export default function ConvexMark({ height = 34, tone = 'brand', className, title }) {
  // `tone` swaps the palette without touching geometry. 'onDark' lifts the navy,
  // which on a near-black header would read as a hole rather than a shape — what
  // the old CSS brightness filter was crudely approximating.
  const p =
    tone === 'onDark'
      ? { navy: '#2C5A85', teal: '#158C77', tealDeep: '#0E6E7C', tealMid: '#189189', green: '#2FC98F' }
      : tone === 'mono'
        ? { navy: 'currentColor', teal: 'currentColor', tealDeep: 'currentColor', tealMid: 'currentColor', green: 'currentColor' }
        : { navy: '#10344F', teal: '#0E6155', tealDeep: '#084D57', tealMid: '#116C66', green: '#16AB83' };

  return (
    <svg
      viewBox="0 0 939 1000"
      height={height}
      width={(height * 939) / 1000}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ display: 'block' }}
    >
      {title ? <title>{title}</title> : null}

      {BARS.map((b) => (
        <rect key={b.x} x={b.x} y={b.y} width={b.w} height={1000 - b.y} fill={p[b.fill]} />
      ))}

      {/* Short right bar: body, then its green top stroke and right edge. */}
      <rect x={RIGHT_BAR.x} y={RIGHT_BAR.y} width={RIGHT_BAR.w} height={1000 - RIGHT_BAR.y} fill={p.tealMid} />
      <rect x={RIGHT_BAR.x} y={RIGHT_BAR.y} width={RIGHT_BAR.w} height={RIGHT_BAR.stroke} fill={p.green} />
      <rect
        x={RIGHT_BAR.x + RIGHT_BAR.w - RIGHT_BAR.edge}
        y={RIGHT_BAR.y}
        width={RIGHT_BAR.edge}
        height={1000 - RIGHT_BAR.y}
        fill={p.green}
      />

      <path d={SWOOSH} fill={p.green} />
    </svg>
  );
}
