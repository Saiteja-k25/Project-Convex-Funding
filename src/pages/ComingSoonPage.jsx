import { Link } from 'react-router-dom';

import { PageHero, PageShell, Section } from '../components/PageShell';
import { CONTACT } from '../data/site';

/**
 * Shared treatment for pages whose content exists as a plan but not yet as
 * publishable fact — currently /programs and /rules.
 *
 * Distinct from StubPage on purpose. StubPage says "CONTENT PENDING" and is an
 * internal-looking placeholder holding the legal routes open so no footer link is
 * dead. These two are different: a visitor arrived here from the main menu,
 * expecting a real destination, so the page has to read as a deliberate "not yet"
 * rather than as something unfinished that shipped by accident.
 *
 * Two rules for anything written into these:
 *
 *   1. NO DATES. "Soon", "once confirmed" — never "in January", never "next
 *      quarter". A date is a commitment about how the business will operate, and
 *      nobody has made one.
 *   2. NO SPECIFICS DRESSED AS PREVIEW. No sample account sizes, no indicative
 *      pricing, no example drawdown limits. The entire reason these pages exist
 *      is that those numbers are not settled; inventing a taste of them is worse
 *      than the empty page.
 *
 * Every one of them ends with somewhere else to go. A dead end that apologises is
 * still a dead end.
 */
export default function ComingSoonPage({ eyebrow, title, lede, detail, chip }) {
  return (
    <PageShell>
      <PageHero eyebrow={eyebrow} title={title} lede={lede} />

      <Section>
        <div className="page-soon">
          <span className="page-soon__chip">
            <span className="page-soon__dot" aria-hidden="true" />
            {chip}
          </span>
          <p className="page-soon__detail">{detail}</p>
        </div>
      </Section>

      <Section title="In the meantime">
        <p className="page__body">
          The evaluation itself, the profit split and the payout process are already documented. If
          you want the current terms directly, ask us — we will send what is confirmed today.
        </p>
        <div className="page__cta">
          <Link className="btn btn--primary" to="/how-convex-works">
            <span className="btn__label">How Convex works</span>
            <span className="btn__icon" aria-hidden="true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 11 11 3" />
                <path d="M5 3h6v6" />
              </svg>
            </span>
          </Link>
          <Link className="btn btn--ghost" to="/contact">
            <span className="btn__label">Contact Convex</span>
            <span className="btn__icon" aria-hidden="true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 11 11 3" />
                <path d="M5 3h6v6" />
              </svg>
            </span>
          </Link>
        </div>
        <p className="page-soon__reach">
          Or reach us straight away on{' '}
          <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>{' '}
          or at <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
        </p>
      </Section>
    </PageShell>
  );
}
