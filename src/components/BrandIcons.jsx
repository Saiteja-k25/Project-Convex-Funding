/**
 * Brand marks drawn in LUCIDE'S STYLE — not imported from lucide.
 *
 * lucide-react 1.x removed every brand icon (LinkedIn, Instagram, WhatsApp and
 * the rest) over trademark concerns; `import { Linkedin } from 'lucide-react'`
 * does not build. So these are hand-drawn to lucide's spec instead: 24x24 grid,
 * `stroke: currentColor`, `stroke-width: 2`, round caps and joins, `fill: none`.
 * Placed beside a real lucide icon such as MapPin they read as one set.
 *
 * The LinkedIn and Instagram geometry is lucide's own retired artwork, redrawn.
 * WhatsApp never shipped in lucide, so that one is drawn to match.
 */

const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
});

export function LinkedInIcon({ size = 19, ...rest }) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" rx="1" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function InstagramIcon({ size = 19, ...rest }) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 19, ...rest }) {
  return (
    <svg {...base(size)} {...rest}>
      {/* Speech bubble with the tail at lower-left, as the real mark has it. */}
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.45L3 21l2.05-5.4A8.5 8.5 0 1 1 21 11.5z" />
      {/* Handset, simplified to two strokes so it survives at 19px. */}
      <path d="M9 9.6c.25 1.5 1.4 3.2 2.9 4.1" />
      <path d="M9 9.6c.2-.5.6-.8 1-.85l.9 1.5-.75.8" />
      <path d="M11.9 13.7c.5.2 1.05.25 1.5.05l.8-.75 1.5.9c-.1.45-.4.8-.85 1" />
    </svg>
  );
}

export const BRAND_ICONS = {
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  whatsapp: WhatsAppIcon,
};
