import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import Footer from './Footer';
import './PageShell.css';

/**
 * Shared furniture for the real content routes (/about, /how-convex-works).
 *
 * These are NOT StubPages — they carry finished copy — but they keep StubPage's
 * "Back to Convex Funding" convention so the routed pages behave as one family.
 *
 * They deliberately do NOT mount <Nav />. The nav's remaining anchors (#programs,
 * #rules) have no sections behind them yet, and Nav.handleItemClick falls back to
 * `scrollTo(0)` when a target is missing — which on the landing page means "go to
 * the hero" but on a routed page means "silently scroll this unrelated page to its
 * own top". A menu whose items do nothing visible is worse than no menu. Onward
 * navigation comes from the footer, which links both of these pages plus Contact.
 */
export function PageShell({ children }) {
  return (
    <>
      <div className="page">
        <Link className="page__back" to="/">
          <ArrowLeft size={15} strokeWidth={1.7} aria-hidden="true" />
          Back to Convex Funding
        </Link>
        {children}
      </div>
      <Footer />
    </>
  );
}

/** Page opening: small mono eyebrow, display headline, optional lede. */
export function PageHero({ eyebrow, title, lede }) {
  return (
    <header className="page__hero">
      <span className="page__eyebrow">{eyebrow}</span>
      <h1 className="page__title">{title}</h1>
      {lede ? <p className="page__lede">{lede}</p> : null}
    </header>
  );
}

/**
 * A titled block. `title` is optional — the overview statement wants no heading
 * above it, because it IS the opening statement.
 */
export function Section({ id, title, children, wide = false }) {
  return (
    <section className={`page__section${wide ? ' page__section--wide' : ''}`} id={id}>
      {title ? <h2 className="page__sectionTitle">{title}</h2> : null}
      {children}
    </section>
  );
}

/**
 * Full-bleed statement band.
 *
 * The reference for this was Robinhood's saturated lime values panel. Not
 * copied: index.css commits to "one hue family, used sparingly", and a
 * full-bleed #22B573 panel would be the single loudest element on a site whose
 * whole argument is dark and cinematic. This is a deep navy/teal ground with the
 * green kept as a hairline and a soft bloom, so it still reads as a deliberate
 * change of gear without breaking the palette.
 */
export function StatementBand({ children, attribution }) {
  return (
    <section className="page__band">
      <p className="page__bandText">{children}</p>
      {attribution ? <span className="page__bandAttr">{attribution}</span> : null}
    </section>
  );
}

export default PageShell;
