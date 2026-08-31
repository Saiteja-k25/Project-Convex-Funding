import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import ScrollyCanvas from './components/ScrollyCanvas';
import EntryReveal from './components/EntryReveal';
import Nav from './components/Nav';
import Footer from './components/Footer';
import StubPage from './components/StubPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';
import HowConvexWorksPage from './pages/HowConvexWorksPage';
import ProgramsPage from './pages/ProgramsPage';
import RulesPage from './pages/RulesPage';
import { ScrollProvider } from './lib/ScrollProvider';
import ScrollToTop from './lib/ScrollToTop';

/**
 * Hybrid routing: the story is one long scroll at '/', while Contact and the
 * legal pages are real routes. The legal routes exist as honest stubs so no
 * footer link is dead — their copy has to come from the client, not from me.
 */

/**
 * The entry reveal now runs on phones as well, using the PORTRAIT globe frame and
 * larger type. Resolved once at mount — a reveal that appeared or vanished on
 * resize would be worse than either choice.
 */
/**
 * The GLOBE, not the closing logo sign: a late frame put a CONVEX FUNDING sign
 * inside letters that already spell CONVEX FUNDING, which read as a duplicate.
 * Each of these is the bright green network globe near the head of its sequence,
 * matched to the viewport's shape so the fill is not stretched.
 */
const MASK_FILL = {
  landscape: '/sequence-desktop/frame_012.webp',
  portrait: '/sequence-mobile/frame_010.webp',
};

/**
 * A phone's container is ~359px wide, so it needs a bigger scale than desktop to
 * read at all. But 0.21 put "FUNDING" at 317px inside a 342px box — 93% full,
 * i.e. 7% margin on a component whose letter positions are set by a re-sync that
 * happens AFTER webfonts load. Any timing or metric variance on a real device
 * clips the last letter. 0.16 lands it at roughly 71%, which survives that.
 */
const TEXT_SCALE = { landscape: 0.115, portrait: 0.16 };

/**
 * Has the masked CONVEX FUNDING reveal already been shown and cleared?
 *
 * Module scope on purpose, so it is exactly as long-lived as it needs to be:
 *
 *   - It survives client-side navigation, which is the point. Landing unmounts
 *     when you open /how-convex-works and remounts on Back, and without this the
 *     visitor is put back behind the "tap anywhere to enter" gate every time they
 *     return — the reveal is an entrance to the site, not to the route.
 *   - It does NOT survive a reload, which is also correct: a fresh load of the
 *     site is a fresh arrival, and main.jsx already treats it that way by forcing
 *     scroll back to the top.
 *
 * Not state, and not in ScrollProvider: nothing needs to re-render when it
 * changes, and it is read exactly once per Landing mount.
 */
let entryRevealCleared = false;

function Landing() {
  const stageRef = useRef(null);
  const [isPhone] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  // Resolved at mount, so the reveal can never appear or vanish mid-visit.
  const [showEntryReveal] = useState(() => !entryRevealCleared);

  // Phase 1's reveal is scrubbed from progress 0, so at the top of the page its
  // characters sit at opacity 0. The reveal hands off by playing it once.
  const handleDismissed = useCallback(() => {
    entryRevealCleared = true;
    stageRef.current?.playIntro();
  }, []);

  /**
   * Returning visitors skip the reveal, so nothing calls playIntro for them — and
   * without it phase 1 sits at opacity 0 and the hero renders as bare footage.
   * That is the invisible-headline bug, and this is the same handoff the reveal
   * performs on dismissal, just triggered by mount instead of by a tap.
   */
  useEffect(() => {
    if (!showEntryReveal) stageRef.current?.playIntro();
  }, [showEntryReveal]);

  return (
    <>
      <span id="top" />
      <Nav />
      <ScrollyCanvas ref={stageRef} />
      <Footer />
      {showEntryReveal && (
        <EntryReveal
          src={isPhone ? MASK_FILL.portrait : MASK_FILL.landscape}
          textScale={isPhone ? TEXT_SCALE.portrait : TEXT_SCALE.landscape}
          /* No ripple or brightness pulse on a phone — see EntryReveal. */
          flash={!isPhone}
          onDismissed={handleDismissed}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollProvider>
        {/* Must sit inside BOTH providers: it needs useLocation from the router
            and the Lenis instance from ScrollProvider. */}
        <ScrollToTop />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            {/* Real content routes. These were '#about' and '#how-convex-works'
                anchors that had no sections behind them and silently fell back to
                scrolling to the top. */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-convex-works" element={<HowConvexWorksPage />} />
            {/* Real destinations that say "not yet" rather than nav items that
                silently scrolled the landing page back to the top. */}
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route
              path="/legal/terms"
              element={<StubPage title="Terms & Conditions" note="Awaiting the drafted trader agreement and site terms." />}
            />
            <Route
              path="/legal/privacy"
              element={<StubPage title="Privacy Policy" note="Awaiting the data-handling policy." />}
            />
            <Route
              path="/legal/risk"
              element={<StubPage title="Risk Disclosure" note="Awaiting the reviewed risk disclosure." />}
            />
            <Route path="*" element={<StubPage title="Not found" note="That page does not exist." />} />
          </Routes>
        </main>
      </ScrollProvider>
    </BrowserRouter>
  );
}
