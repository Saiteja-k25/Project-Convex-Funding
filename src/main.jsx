import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Open at the top, every time.
 *
 * Browsers restore the previous scroll offset on reload, which on a scroll-driven
 * page drops the visitor into the middle of the film with no context — and past
 * the entry reveal entirely.
 *
 * Three things are needed, because each covers a case the others miss:
 *   1. `scrollRestoration = 'manual'` stops the browser restoring the old offset.
 *   2. `scrollTo(0, 0)` handles a hash in the URL, which would otherwise jump the
 *      page even with restoration disabled. The hero CTA used to be the source of
 *      those — it pointed at a non-existent #start and left the hash behind on
 *      every click. It routes to /contact now, so this guard is here for shared
 *      and pasted links rather than for anything the site does to itself.
 *   3. A `load` listener repeats it, because restoration can be applied after
 *      module evaluation — setting the flag alone does not undo a scroll that has
 *      already happened.
 * ScrollProvider then resets Lenis, which keeps its own scroll value.
 *
 * Trade-off accepted: Back no longer restores position. On a single long scroll
 * narrative that is the right side of the trade.
 */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('load', () => window.scrollTo(0, 0), { once: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
