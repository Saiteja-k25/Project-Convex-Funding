import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { MapPin } from 'lucide-react';

import { BRAND_ICONS } from './BrandIcons';
import { useFitText } from '../lib/useFitText';
import { useScroll } from '../lib/ScrollProvider';
import { CONTACT, CREDIT, FOOTER_COLUMNS, SITE, SOCIALS } from '../data/site';
import './Footer.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * Footer reveal — ONE panel, rising from the bottom to cover the hero.
 *
 * Previously two stacked panels (links, then wordmark), which had two faults,
 * measured on a 1900x930 screen: each panel held only 291px and 229px of content
 * inside a 930px frame — 69% and 75% empty — and the stage carried a held frame of
 * footage behind them, so the sequence read as THREE beats (footage holds, links
 * rise, wordmark rises) rather than one reveal.
 *
 * One panel puts ~520px of content in a single frame, spaced top-to-bottom so it
 * fills the height, and reduces the whole thing to one clean rise.
 *
 * WHY NOT GSAP `pin: true` (which the reference CodePen uses): pinning wraps the
 * trigger in a pin-spacer and transforms it, changing document height and adding a
 * second pinning mechanism. The hero already pins with `position: sticky` over a
 * container whose height this project computes in px and re-measures on resize.
 * Sticky plus a scrubbed transform gives the identical effect and is already the
 * idiom here — the text overlay sits over the canvas the same way.
 *
 * PHONES SCROLL IT NORMALLY — see PANEL_QUERY. The rise is desktop and tablet
 * only, which also retires the pinned stage, the clipping guard and the fit check
 * on mobile.
 */

/**
 * PHONES DO NOT PANELISE. Width >= 768 AND height >= 700.
 *
 * The height floor is about clipping: an absolutely positioned panel cannot
 * scroll its own overflow into view, so whatever does not fit is silently lost.
 * Measured at 1024x640, 693px of content clipped 53px — the foot of the wordmark.
 *
 * The WIDTH floor is about the transition being worth its cost. A phone briefly
 * had the rise, and it measured badly: 591px of scroll — 0.70 of a viewport —
 * during which the backdrop is the only thing on screen, because the panel must
 * travel a full screen height with nothing behind it. That is most of a screen of
 * nothing to deliver one screen of footer, and no amount of spacing inside the
 * panel touches it. Phones scroll their footer like any other site.
 */
const PANEL_QUERY = '(min-width: 768px) and (min-height: 700px)';

/** Viewports of scroll the panel takes to arrive. */
const BEAT = 0.7;

export default function Footer() {
  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const { boxRef, textRef } = useFitText();
  const { scrollTo } = useScroll();
  const navigate = useNavigate();

  const [canPanel, setCanPanel] = useState(() => window.matchMedia(PANEL_QUERY).matches);
  const [overflows, setOverflows] = useState(false);
  /**
   * Reduced motion has to be part of the PANELISE decision, not just a guard on
   * the animation.
   *
   * The CSS reduced-motion block flattens the stage and the panel to normal flow.
   * If React does not know that, it still writes the inline
   * `height: calc(100svh + 70svh)` onto a footer the CSS has already collapsed —
   * the two disagree, and the container reserves ~145svh of scroll containing
   * nothing. `height: auto !important` in that block currently masks it, which is
   * the only reason it has not shipped as a visible hole.
   */
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(PANEL_QUERY);
    const onChange = (e) => setCanPanel(e.matches);
    mq.addEventListener('change', onChange);

    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onRM = (e) => setReducedMotion(e.matches);
    rm.addEventListener('change', onRM);

    return () => {
      mq.removeEventListener('change', onChange);
      rm.removeEventListener('change', onRM);
    };
  }, []);

  /* --- runtime fit guard ---------------------------------------------------
   *
   * PANEL_QUERY is a fast path based on heights measured today. It cannot know
   * about tomorrow's copy: the footer still carries [LEGAL ENTITY NAME] and
   * [JURISDICTION] placeholders, and replacing either with something long adds a
   * line. At 390x844 there are only 33px of headroom, so one extra line clips —
   * and what gets clipped is the bottom of the risk disclosure.
   *
   * So the media query proposes and the measurement decides. Deliberately
   * ONE-DIRECTIONAL: it can only ever turn panelising OFF. Allowing it back on
   * would oscillate, because switching to normal flow changes the very heights
   * being measured.
   */
  useEffect(() => {
    if (!canPanel || overflows || reducedMotion) return;
    const panel = panelRef.current;
    const stage = panel?.parentElement;
    if (!panel || !stage) return;

    const check = () => {
      const main = panel.querySelector('.footer__main');
      if (!main) return;

      /* Measure the INTRINSIC height, which needs the flex-grow dropped first.
       *
       * `.footer__main` has `flex: 1 1 auto`, so it always grows to exactly fill
       * the panel — summing the children while it is flexed returns the panel's
       * own height no matter how much or little content there is. An earlier
       * version of this guard did exactly that and reported ~1px of headroom at
       * every viewport including a 1900x930 desktop, which was the tell.
       *
       * So: un-flex, read, restore. One forced reflow, on mount / fonts.ready /
       * resize only.
       */
      const prevFlex = main.style.flex;
      const prevJustify = panel.style.justifyContent;
      main.style.flex = '0 0 auto';
      panel.style.justifyContent = 'flex-start';

      const cs = getComputedStyle(panel);
      const needed =
        [...panel.children].reduce((sum, el) => sum + el.offsetHeight, 0) +
        parseFloat(cs.paddingTop || 0) +
        parseFloat(cs.paddingBottom || 0);

      main.style.flex = prevFlex;
      panel.style.justifyContent = prevJustify;

      if (needed > stage.clientHeight) setOverflows(true);
    };

    check();
    // Re-check once webfonts land — fallback metrics reflow the disclosure.
    document.fonts?.ready.then(check).catch(() => {});
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [canPanel, overflows, reducedMotion]);

  const panelise = canPanel && !overflows && !reducedMotion;

  /* --- the rise ------------------------------------------------------------ */
  useEffect(() => {
    // `panelise` already accounts for size, overflow AND reduced motion, so if it
    // is false the CSS has flattened everything and there is nothing to animate.
    if (!panelise) return;

    const container = containerRef.current;
    const panel = panelRef.current;
    if (!container || !panel) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        panel,
        { yPercent: 100 },
        {
          yPercent: 0,
          ease: 'none',
          scrollTrigger: { trigger: container, start: 'top top', end: 'bottom bottom', scrub: true },
        },
      );
    }, container);

    // The container's height depends on panelise, so cached start/end are stale.
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [panelise]);

  // Anchors go through Lenis; routes through the router. A raw href would jump
  // natively and fight the smooth scroll.
  const go = (event, link, external) => {
    if (external) return;
    event.preventDefault();
    if (link.startsWith('#')) scrollTo(document.querySelector(link) ?? 0);
    else navigate(link);
  };

  return (
    <footer
      className="footer-reveal"
      id="footer"
      /* One viewport for the sticky stage, plus one beat for the panel to arrive.
         Viewports too small to panelise take their height from content instead. */
      /* data-flow lets the CSS flatten the panel when the RUNTIME check bailed —
         a media query cannot express "the content did not fit". */
      data-flow={panelise ? undefined : ''}
      style={panelise ? { height: `calc(100svh + ${BEAT * 100}svh)` } : undefined}
      ref={containerRef}
    >
      <div className="footer-reveal__stage">
        <section className="footer-panel" ref={panelRef}>
          <div className="footer__main">
            {FOOTER_COLUMNS.map((col, i) => (
              <div className="footer__col" key={col.title}>
                <div>
                  <h3 className="footer__colTitle">{col.title}</h3>
                  <ul className="footer__list">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <a
                          className="footer__link"
                          href={l.link}
                          target={l.external ? '_blank' : undefined}
                          rel={l.external ? 'noopener noreferrer' : undefined}
                          onClick={(e) => go(e, l.link, l.external)}
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* First column only, pinned to the baseline of the stretched row. */}
                {i === 0 && (
                  <div className="footer__follow">
                    <div className="footer__socials">
                      {SOCIALS.map((soc) => {
                        const Icon = BRAND_ICONS[soc.icon];
                        const glyph = Icon ? <Icon size={17} /> : soc.label;

                        // No URL yet: render the mark, but as a span. An anchor
                        // with no href is not a link, and href="#" would be a
                        // dead one — both are worse than an inert icon.
                        return soc.link ? (
                          <a
                            key={soc.label}
                            className="footer__social"
                            href={soc.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={soc.label}
                          >
                            {glyph}
                          </a>
                        ) : (
                          <span
                            key={soc.label}
                            className="footer__social footer__social--pending"
                            aria-label={`${soc.label} — link coming soon`}
                            title="Link coming soon"
                          >
                            {glyph}
                          </span>
                        );
                      })}
                    </div>

                    <address className="footer__location">
                      <MapPin size={15} strokeWidth={1.8} aria-hidden="true" />
                      <span>{CONTACT.location}</span>
                    </address>
                  </div>
                )}
              </div>
            ))}

            <div className="footer__disclosure">
              <h4>All trading involves risk.</h4>
              <p>
                <strong>Convex Funding is a proprietary trading firm.</strong> It is not a broker,
                does not hold client funds, and does not offer investment advice or portfolio
                management. Nothing on this site is a recommendation to buy or sell any instrument.
              </p>
              <p>
                Accounts offered through the evaluation are <strong>simulated</strong> unless
                expressly stated otherwise in the trader agreement. Past performance of any trader
                or program does not indicate future results, and the majority of participants do not
                pass an evaluation.
              </p>
              <p>
                Program terms, profit split, leverage and payout schedules are set out in the trader
                agreement and may change. Availability may be restricted in some jurisdictions.
              </p>
              <p>
                Enquiries:{' '}
                <a className="footer__inlineLink" href={`mailto:${CONTACT.email}`}>
                  {CONTACT.email}
                </a>
                .
              </p>
            </div>
          </div>

          <div className="footer__signoff">
            <div className="footer__meta">
              <span className="footer__metaItem">
                &copy; {SITE.year} {SITE.name}
              </span>
              {/* A byline, not navigation — a link with no link affordances. */}
              <a
                className="footer__credit"
                href={CREDIT.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${CREDIT.prefix} ${CREDIT.name} — opens portfolio in a new tab`}
              >
                <span className="footer__creditPrefix">{CREDIT.prefix}</span>
                <span className="footer__creditWord">{CREDIT.name}</span>
              </a>
              <span className="footer__metaItem">All rights reserved</span>
            </div>

            {/*
              Set in Archivo, not the real logo face — the brand wordmark has not
              been supplied as a vector. The outer div is useFitText's measuring
              box; the span is what gets sized.
            */}
            <div className="footer__wordmarkBox" ref={boxRef}>
              <span className="footer__wordmark" ref={textRef} aria-label={SITE.name}>
                Convex<span>&nbsp;Funding</span>
              </span>
            </div>
          </div>
        </section>
      </div>
    </footer>
  );
}
