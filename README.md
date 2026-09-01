# Convex Funding

**[project-convex-funding.info69k.workers.dev](https://project-convex-funding.info69k.workers.dev/)**

The official website for **Convex Funding**, a proprietary trading firm backing traders with capital, professional trading conditions, and a clear path to growth.

The site is built as a single scroll-driven film. A 150-frame sequence is scrubbed frame by frame against the scroll position on an HTML canvas, with typography resolving over it in four distinct phases — so the story of the firm is told by moving through it rather than by scrolling past a stack of sections.

---

## Deployment

**Live:** <https://project-convex-funding.info69k.workers.dev/>

| | |
|---|---|
| **Platform** | Cloudflare Workers — static assets |
| **Configuration** | `wrangler.jsonc` |
| **Source branch** | `main` — every push triggers a production build |
| **Build command** | `npm run build` |
| **Assets directory** | `dist` |
| **Node version** | 22, pinned in `.nvmrc` |
| **Intended brand domain** | `convexfunding.com` — not yet attached |

```jsonc
{
  "name": "project-convex-funding",
  "compatibility_date": "2026-08-31",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

### Routing

The site is a single-page application: only `index.html` physically exists, and every other route is produced by the router at runtime. Without a fallback, a direct link, a hard refresh or a shared URL would return a 404 — which is every legal link in the footer.

`not_found_handling: "single-page-application"` serves `index.html` with a `200` for any path that is not a real file. The `200` rather than a redirect is what matters: the shell is served *at* the requested URL, so the router still sees `/about` and search engines index a real page.

Real files always take precedence, so `/sequence-desktop/frame_000.webp` and `/assets/*` are unaffected by the fallback.

### Caching

`public/_headers` sets cache policy per asset class. The frame sequences are the single largest cost of a visit, and unlike the bundle their filenames are not content-hashed, so they are given an explicit long cache rather than the short default.

| Path | Cache-Control | Verified on production |
|---|---|---|
| `/sequence-desktop/*`, `/sequence-mobile/*` | `public, max-age=2592000` (30 days) | ✅ |
| `/assets/*` | `public, max-age=31536000, immutable` | ✅ |

Thirty days rather than a year with `immutable`: frame filenames are stable, so a re-export would serve different bytes from the same URL, and `immutable` would strand visitors on the old sequence.

### Environment

| Variable | Purpose |
|---|---|
| `VITE_CONTACT_ENDPOINT` | Endpoint the contact form POSTs to. Without it the form validates and hands the visitor a prefilled email rather than failing silently. |
| `VITE_CONTACT_ACCESS_KEY` | Optional public key for relays that require one. |

Variables prefixed `VITE_` are compiled into the client bundle and are therefore **public**. A form-relay key is designed for that; a mail-provider API key is not, and belongs in a server-side function.

---

## Tech stack

| Layer | Choice | Version |
|---|---|---|
| Framework | React | 19.2 |
| Build | Vite | 8.2 |
| Routing | React Router | 7.18 |
| Animation | GSAP — ScrollTrigger, SplitText | 3.15 |
| Smooth scroll | Lenis | 1.3 |
| WebGL | OGL — cursor trail only | 1.0 |
| Icons | lucide-react, plus hand-drawn brand SVGs | 1.34 |
| Styling | Vanilla CSS with custom-property tokens | — |

No CSS framework. The design system is a set of custom properties in `src/index.css`, and every component styles itself against those tokens.

---

## How it is built

**The scroll engine.** The canvas is held in place with `position: sticky` and the frame index is derived from scroll progress, rather than using a pinning library. Frames stream in progressively — frame 0, then every tenth frame, then the gaps — so the sequence is usable within the first second and sharpens as it loads. Drawing happens once per animation frame on a single shared ticker, so a burst of scroll events can never queue several redraws against one paint.

**Scroll position** is owned by Lenis, which drives the GSAP ticker, which in turn updates ScrollTrigger. One clock for the whole page.

**Two sequences, chosen by shape.** Portrait viewports receive a 9:16 cut and landscape viewports a 16:9 one, decided once at load by comparing height to width rather than by a width breakpoint — so a tablet held upright gets the portrait film rather than a cropped widescreen one.

**Typography over footage.** The four copy phases occupy the same viewport box and are separated purely by opacity, with non-overlapping windows and a deliberate gap between each, so two blocks of text can never be on screen at once. Headline reveals are scrubbed character by character against scroll rather than played on a timer, so nothing moves unless the visitor moves it.

**Grading, not scrims.** Legibility over moving footage is handled by grading every frame as it is drawn — one even darkening plus a soft vignette — instead of laying translucent panels behind each text block.

---

## Typography

Three families, each with one job.

| Role | Typeface | Weights | Used for |
|---|---|---|---|
| Display | **Cormorant Garamond** | 400 · 600 · 700 | Headlines, statement bands, statistic numerals |
| Body | **Archivo** | 400 · 500 · 600 · 700 | Ledes, body copy, wordmark, UI |
| Mono | **IBM Plex Mono** | 400 · 500 | Eyebrows, labels, metadata, navigation numbering |

Served from Google Fonts with `display=swap`, preconnected in `index.html`.

Archivo was selected from a five-option specimen set against the real copy: Archivo, Satoshi, Bricolage Grotesque, Space Grotesk and Cormorant Garamond.

Serif tracking is set to `-0.015em`, deliberately looser than the `-0.045em` that suited the sans: tight negative tracking collides serifs.

The footer wordmark sizes itself in `cqw` — a fraction of its container's width — with a coefficient calibrated once against the real webfont. Text width therefore stays a fixed fraction of container width at every viewport, with no JavaScript in the resize path.

---

## Assets

### Frame sequences

Both sequences were cut from 1080p source footage with ffmpeg and encoded as WebP.

| Sequence | Dimensions | Frames | Size | Encode |
|---|---|---|---|---|
| `public/sequence-desktop` | 1600 × 900 | 150 | 11.4 MB | `fps=15`, libwebp q70 |
| `public/sequence-mobile` | 810 × 1440 | 120 | 5.6 MB | `fps=12`, libwebp q62 |

Naming is `frame_000.webp` upward, zero-padded to three digits and zero-indexed. The pattern is generated in one place, `src/config/sequence.js`.

Scroll distance is computed from a target of ~24px per frame rather than a fixed viewport multiple, so the scrub feels identical on a laptop and on a tall monitor.

### Brand mark

No vector of the logo existed — the company held only flat JPEGs. `src/components/ConvexMark.jsx` is a **vector redraw**, with bar positions and the swoosh curve measured off the 3209px original rather than eyeballed. It carries its own aspect ratio (0.9393) so callers set only a height and it cannot be distorted, and it ships three palettes so the same geometry works on light and dark grounds.

Brand icons for LinkedIn, Instagram and WhatsApp are hand-drawn inline SVG in `src/components/BrandIcons.jsx`, matched to lucide's stroke conventions — lucide-react 1.x removed brand glyphs entirely.

### Icons and social card

| Asset | Size | Purpose |
|---|---|---|
| `favicon.svg` | 64 × 64 | Primary favicon |
| `favicon-32.png` | 32 × 32 | Fallback for browsers that ignore SVG favicons |
| `apple-touch-icon.png` | 180 × 180 | iOS home screen — full-bleed, as iOS applies its own mask |
| `og-image.jpg` | 1200 × 630 | Open Graph and Twitter card |

The favicon is a redraw rather than the mark scaled down: the narrowest bar in the full mark is 5.7% of its width, which renders as half a pixel at 16px and disappears. The favicon keeps the composition at weights that hold in a tab strip.

The social card is drawn from the real mark geometry, set in the site's own typefaces.

---

## Palette

Lifted from the logo — navy bars, deep teal, signal green — and used sparingly. One accent hue family across the whole site.

| Token | Value | Role |
|---|---|---|
| `--ink` | `#070B11` | Page ground |
| `--ink-raised` | `#0C131C` | Panels, inputs |
| `--navy` | `#12314F` | Mark, depth |
| `--teal` | `#0B4F4A` | Mark, statement grounds |
| `--green` | `#22B573` | Primary accent |
| `--mint` | `#34C88A` | Links, highlights, cursor trail |
| `--paper` | `#F7F9F8` | Primary text |
| `--lede` / `--label` | `#B6C3CC` / `#A9B7C2` | Copy over footage |
| `--muted-bright` / `--muted` | `#8FA0AC` / `#62727E` | Secondary text |

---

## Pages

| Route | Contents |
|---|---|
| `/` | The scroll film — entry reveal, frame sequence, four copy phases, footer |
| `/about` | The firm, what it looks for, leadership |
| `/how-convex-works` | Published figures and the path from evaluation to payout |
| `/programs` · `/rules` · `/faq` | Published once the underlying terms are confirmed |
| `/contact` | Direct contacts and a validated enquiry form |
| `/legal/terms` · `/legal/privacy` · `/legal/risk` | Awaiting drafted copy |

Nothing on this site states an account size, price, profit target, drawdown limit or biography that has not been supplied. Where a fact is outstanding, the page says so rather than estimating it.

---

## Credits

Interface components adapted from [React Bits](https://reactbits.dev) — `StaggeredMenu`, `BubbleMenu`, `MaskedHeading` and `ElectricBorder`. The electric border effect is inspired by [@BalintFerenczy](https://codepen.io/BalintFerenczy/pen/KwdoyEN). Each has been reworked for this project's palette, motion budget and accessibility rules.

Motion by [GSAP](https://gsap.com). Smooth scrolling by [Lenis](https://lenis.darkroom.engineering). Icons by [Lucide](https://lucide.dev).

Designed and built by [Kurapati Sai Teja](https://portfolio-ks-beta.vercel.app/).

---

© Convex Funding. All rights reserved.
