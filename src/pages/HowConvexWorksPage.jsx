import { Link } from 'react-router-dom';

import { PageHero, PageShell, Section, StatementBand } from '../components/PageShell';
import { METRICS, QUALITIES } from '../data/site';

/**
 * /how-convex-works — mechanism.
 *
 * WHAT THIS PAGE DOES NOT DO, and why it matters more than what it does:
 *
 * It publishes no account sizes, no profit targets, no drawdown limits, no daily
 * loss caps and no prices, because none of those have been supplied. Those are
 * the terms of a financial agreement; inventing plausible ones so the page looked
 * complete would be the single most damaging thing that could be written here.
 *
 * Everything below is drawn from copy that is already published on this site:
 * the four figures in the scroll overlay, the three qualities in the company's
 * own LinkedIn description, and the risk language already carried in the footer
 * disclosure. The steps describe the SHAPE of the process, not its parameters.
 *
 * When the real mechanics arrive they belong in `site.js` beside METRICS, and this
 * page grows a table. Until then it stays honest and short.
 */

const STEPS = [
  {
    num: '01',
    title: 'Take the evaluation',
    body:
      'You trade a simulated account and show that your approach holds up. The evaluation exists ' +
      'to establish one thing — that the edge is repeatable rather than a good run.',
  },
  {
    num: '02',
    title: 'Get funded',
    body:
      'Pass, and Convex Funding backs you with firm capital rather than your own. Access to that ' +
      'capital is the product; the evaluation is only the gate in front of it.',
  },
  {
    num: '03',
    title: 'Trade under defined risk',
    body:
      'Funded accounts run under agreed risk parameters. They are the boundaries the capital is ' +
      'lent inside, and they are set out in the trader agreement rather than improvised.',
  },
  {
    num: '04',
    title: 'Take your payout',
    body:
      'Profit is split 90/10 in the trader’s favour, and approved payout requests are processed ' +
      'in under 24 hours.',
  },
];

export default function HowConvexWorksPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="How it works"
        title="From evaluation to funded account."
        lede="One evaluation stands between a trader with a proven edge and our capital. This is what that path looks like, and what we publish about it."
      />

      <Section title="The numbers">
        <div className="page-metrics">
          {METRICS.map((m) => (
            <div className="page-metric" key={m.label}>
              <span className="page-metric__label">{m.label}</span>
              <span className="page-metric__value">{m.value}</span>
              <span className="page-metric__note">{m.note}</span>
            </div>
          ))}
        </div>
        {/* The pass rate is the reason this section exists in this order. Leading
            with 90% and hiding 31.4% would be the marketing version. */}
        <p className="page__body">
          The pass rate is published because it is the one figure a trader actually needs before
          committing to an evaluation. Most participants do not pass.
        </p>
      </Section>

      <Section title="The path">
        <ol className="page-steps">
          {STEPS.map((step) => (
            <li className="page-step" key={step.num}>
              <span className="page-step__num">{step.num}</span>
              <div>
                <h3 className="page-step__title">{step.title}</h3>
                <p className="page-step__body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <StatementBand attribution="What the evaluation is for">
        Rewarding skill, consistency, and disciplined performance.
      </StatementBand>

      <Section title="What the evaluation measures">
        <div className="page-qualities">
          {QUALITIES.map((q) => (
            <div className="page-quality" key={q.key}>
              <h3 className="page-quality__title">{q.title}</h3>
              <p className="page-quality__body">{q.measured}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Same substance as the footer disclosure, stated once more where a trader
          is actually reading about the programme. Not new claims. */}
      <Section title="Good to know">
        <p className="page__body">
          Accounts offered through the evaluation are <strong>simulated</strong> unless expressly
          stated otherwise in the trader agreement. Convex Funding is a proprietary trading firm —
          it is not a broker, does not hold client funds, and does not offer investment advice.
        </p>
        <p className="page__body">
          Programme terms, profit split, leverage and payout schedules are set out in the trader
          agreement and may change. Availability may be restricted in some jurisdictions. Past
          performance of any trader or programme does not indicate future results.
        </p>
      </Section>

      <Section title="Next">
        <p className="page__body">
          Specific account sizes, profit targets and risk limits are confirmed directly. Get in
          touch and we will send the current terms.
        </p>
        <div className="page__cta">
          <Link className="btn btn--primary" to="/contact">
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
          <Link className="btn btn--ghost" to="/about">
            <span className="btn__label">About Convex</span>
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
