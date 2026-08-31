import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

import ElectricBorder from '../reactbits/ElectricBorder';
import { PageHero, PageShell, Section, StatementBand } from '../components/PageShell';
import { CONTACT, LEADERSHIP, OVERVIEW, QUALITIES, SITE } from '../data/site';

/**
 * /about — identity.
 *
 * Split of responsibility with /how-convex-works: this page answers "who is
 * Convex Funding and who runs it", that one answers "how does a trader get
 * funded". Both draw on the same published overview, but this page uses it as a
 * self-description while that page re-expresses it as a process — so no
 * paragraph appears on both.
 */

/**
 * Electric border: always animating, on every device.
 *
 * This deliberately departs from the GlowCursor precedent, which gates autonomous
 * motion behind `(hover: hover) and (pointer: fine)` and
 * `prefers-reduced-motion`. Saiteja asked for these to be continuously alive
 * after seeing the gated version render as a frozen outline on his own machine
 * (Windows animation settings off report reduced-motion, so the gate was always
 * closed there).
 *
 * Recorded here so a later session does not "restore consistency" with
 * GlowCursor and quietly turn the cards back into a still image. If it ever needs
 * gating again, that is a decision to take with him, not a tidy-up.
 *
 * The cost of always-on is handled inside ElectricBorder instead: the loop pauses
 * whenever a card is scrolled off screen, so nothing runs while it cannot be seen.
 */
function PersonCard({ person, phase }) {
  return (
    <ElectricBorder
      /* Mint, not the demo's #7df9ff cyan — same reasoning as GlowCursor. */
      color="#34C88A"
      /* chaos stays at 0.08 — that is the border shape already approved. Only the
         travel rate went up, from 0.7 to the demo's 1, so the crawl is clearly
         readable as motion rather than a slow drift you have to stare at. */
      speed={1}
      chaos={0.08}
      borderRadius={14}
      animate
      phase={phase}
      style={{ borderRadius: 14 }}
    >
      <article className="person">
        <div className="person__monogram" aria-hidden="true">
          {person.initials}
        </div>
        <div>
          <h3 className="person__name">{person.name}</h3>
          <span className="person__role">{person.role}</span>
          <p className="person__location">
            <MapPin size={15} strokeWidth={1.7} aria-hidden="true" />
            {person.location}
          </p>
        </div>
      </article>
    </ElectricBorder>
  );
}

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About"
        title="Capital, opportunity, and a clear path to growth."
        lede={OVERVIEW.closing}
      />

      {/* No heading: this IS the opening statement, and a label above it would
          only repeat the page title. */}
      <Section>
        <p className="page__statement">{OVERVIEW.positioning}</p>
      </Section>

      <StatementBand attribution={SITE.name}>{OVERVIEW.belief}</StatementBand>

      <Section title="What we believe">
        <div className="page-qualities">
          {QUALITIES.map((q) => (
            <div className="page-quality" key={q.key}>
              <h3 className="page-quality__title">{q.title}</h3>
              <p className="page-quality__body">{q.belief}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Leadership" wide>
        <div className="page-people">
          {LEADERSHIP.map((person, i) => (
            <PersonCard
              key={person.name}
              person={person}
              /* Arbitrary but fixed offsets, so the two borders never travel in
                 lockstep with each other. */
              phase={i * 4.3}
            />
          ))}
        </div>
      </Section>

      <Section title="At a glance">
        <ul className="page-facts">
          <li className="page-fact">
            <span className="page-fact__label">Website</span>
            <span className="page-fact__value">
              <a href={`https://${SITE.domain}`} target="_blank" rel="noopener noreferrer">
                {SITE.domain}
              </a>
            </span>
          </li>
          <li className="page-fact">
            <span className="page-fact__label">Office</span>
            <span className="page-fact__value">{CONTACT.location}</span>
          </li>
          <li className="page-fact">
            <span className="page-fact__label">Enquiries</span>
            <span className="page-fact__value">
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </span>
          </li>
          <li className="page-fact">
            <span className="page-fact__label">Telephone</span>
            <span className="page-fact__value">
              <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
            </span>
          </li>
        </ul>
      </Section>

      <Section title="Next">
        <p className="page__body">
          The evaluation, the profit split and the payout process are set out in full on the next
          page.
        </p>
        {/* Reuses the landing page's button, deliberately: its label is fixed and
            only the arrow moves on hover, which was a measured decision. */}
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
            <span className="btn__label">Contact</span>
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
      </Section>
    </PageShell>
  );
}
