import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ConvexMark from './ConvexMark';
import StaggeredMenu from '../reactbits/StaggeredMenu';
import BubbleMenu from '../reactbits/BubbleMenu';
import { useScroll } from '../lib/ScrollProvider';
import { NAV_ITEMS, SOCIALS, SOCIALS_PENDING } from '../data/site';
import './Nav.css';

/**
 * One nav, two presentations.
 *
 * Desktop AND tablet get StaggeredMenu; phones get BubbleMenu. The switch is on
 * width, not orientation — unlike the frame sequence, which switches on shape
 * because it is cropping footage. A tablet in portrait is still a tablet-sized
 * menu.
 *
 * It IS reactive here (a resize re-renders), which is safe: swapping menu
 * components costs nothing, whereas swapping frame sequences would re-download
 * 11MB.
 */
const PHONE_QUERY = '(max-width: 767px)';

/** Brand greens per item. The upstream demo's rainbow is off-brand. */
const BUBBLE_TINTS = ['#22B573', '#34C88A', '#0B4F4A', '#22B573', '#34C88A'];
const BUBBLE_ROTATIONS = [-8, 8, -6, 8, -8];

const LOCK_OWNER = 'nav-menu';

/**
 * Rewind to the hero, at a speed that scales with how far away it is.
 *
 * ScrollProvider's default is a flat 1.1s for any distance. From the footer that
 * is ~3900px in 1.1s — roughly 3500px/sec — and because the whole page is a
 * scrubbed frame sequence, the film does not read as rewinding at that rate, it
 * reads as a cut. The fix is duration proportional to distance, so the travel
 * speed is constant no matter where the visitor started.
 *
 * ~1400px/sec puts a full-page rewind at about 2.8s: long enough to watch the
 * sequence run backwards, short enough not to trap anyone who just wanted the top.
 * Clamped at both ends so a short hop is not sluggish and a very tall viewport
 * cannot produce a ten-second ride.
 */
const REWIND_PX_PER_SEC = 1400;
const REWIND_MIN_SEC = 0.9;
const REWIND_MAX_SEC = 4.5;

/**
 * easeInOutQuad. Deliberately not Lenis's default expo-out, which spends most of
 * its time decelerating — that front-loads the motion and is exactly what makes a
 * long travel feel like a jump. This accelerates out of rest, holds a near-constant
 * velocity through the middle where the frames are actually being watched, then
 * settles onto the hero.
 */
const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// The lockup is a link home. `href="#top"` matches the Home item in NAV_ITEMS
// and targets the <span id="top" /> in App.jsx, so it still behaves like a real
// link for middle-click and right-click; onHome preventDefaults the native jump
// and hands the scroll to Lenis instead.
function Lockup({ inverted = false, onHome }) {
  return (
    <a
      className={inverted ? 'nav-home nav-home--bubble' : 'nav-home'}
      href="#top"
      onClick={onHome}
      aria-label="Convex Funding — back to the top"
    >
      {/* Vector mark (redraw v2). Sizes itself from `height` and carries the
          measured 0.9393 aspect internally, so nothing can distort it and there
          is no decode step to shift the header.

          Tones differ by ground on purpose: the mobile lockup sits on a PAPER
          pill, where the true brand navy is correct; the desktop header is
          near-black, where that same navy reads as a hole rather than a shape, so
          it uses the lifted palette. Pass tone="brand" here to see the literal
          brand colours on dark instead. */}
      <ConvexMark
        height={inverted ? 27 : 34}
        /* Both grounds are dark now that the mobile pill is gone, so both use the
           lifted palette — the true brand navy reads as a hole on near-black. */
        tone="onDark"
        className={inverted ? 'bubble-logo-mark' : 'sm-logo-mark'}
      />
      {inverted ? (
        <span className="logo-word">
          <b>CONVEX</b>
          <i>FUNDING</i>
        </span>
      ) : (
        <span className="sm-logo-word">
          <b>CONVEX</b>
          <i>FUNDING</i>
        </span>
      )}
    </a>
  );
}

export default function Nav() {
  const [isPhone, setIsPhone] = useState(() => window.matchMedia(PHONE_QUERY).matches);
  const { lenis, lock, unlock, scrollTo } = useScroll();
  const navigate = useNavigate();
  const menuOpenRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY);
    const onChange = (e) => setIsPhone(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Releasing on unmount matters: switching breakpoints while the menu is open
  // unmounts the component mid-lock and would otherwise freeze the page.
  useEffect(() => () => unlock(LOCK_OWNER), [unlock]);

  const handleOpenChange = useCallback(
    (open) => {
      // Mirrored into a ref as well as the lock: handleHome below needs to know
      // the CURRENT open state synchronously, inside an event handler.
      menuOpenRef.current = open;
      if (open) lock(LOCK_OWNER);
      else unlock(LOCK_OWNER);
    },
    [lock, unlock],
  );

  /**
   * Clicking the lockup rewinds to the hero — scroll position 0, which is where
   * overlay phase 1 ("Empowering traders…") sits.
   *
   * scrollTo(0) rather than scrollTo('#top'): the hero is phase 1 of the scrubbed
   * stage, so "the hero section" IS progress 0, not an element with a box of its
   * own. Unlocking first matches handleItemClick — a locked Lenis is stopped, and
   * scrolling it before releasing the lock fights the stop.
   *
   * The duration is computed rather than fixed so the return reads as scrolling
   * back up through the film, at the same pace from wherever it starts. See
   * REWIND_PX_PER_SEC above.
   *
   * On phones the pill menu has no click-away (StaggeredMenu does, via mousedown,
   * so the desktop panel has already begun closing by the time this runs). Left
   * alone, an open BubbleMenu would sit over the hero we just scrolled to, so its
   * own toggle is clicked to run the component's real close animation rather than
   * yanking the state from outside. The selector finds nothing on desktop, where
   * the toggle is `.sm-toggle`, so this is a no-op there.
   */
  const handleHome = useCallback(
    (event) => {
      event.preventDefault();
      if (menuOpenRef.current) {
        document.querySelector('.bubble.toggle-bubble')?.click();
      }
      unlock(LOCK_OWNER);

      // Lenis's own value, not window.scrollY: during an in-flight scroll the two
      // differ, and Lenis is the one that will actually animate from here.
      const from = Math.abs(lenis?.scroll ?? window.scrollY ?? 0);
      const duration = Math.min(REWIND_MAX_SEC, Math.max(REWIND_MIN_SEC, from / REWIND_PX_PER_SEC));

      scrollTo(0, { offset: 0, duration, easing: easeInOutQuad });
    },
    [lenis, scrollTo, unlock],
  );

  /**
   * Anchors must not be left to the browser. A native `#id` jump bypasses Lenis
   * and lands at the wrong offset, and it fires while the panel is still closing.
   * Returns true so the menu knows to close itself.
   */
  const handleItemClick = useCallback(
    (event, item) => {
      const href = item.link ?? item.href ?? '';
      if (href.startsWith('#')) {
        event.preventDefault();
        unlock(LOCK_OWNER);
        const target = href === '#top' ? 0 : document.querySelector(href);
        // A section that has not been built yet would silently do nothing, so
        // fall back to the top rather than appearing broken.
        scrollTo(target ?? 0, { offset: 0 });
        return true;
      }
      if (href.startsWith('/')) {
        event.preventDefault();
        unlock(LOCK_OWNER);
        navigate(href);
        return true;
      }
      return true; // external links open normally
    },
    [navigate, scrollTo, unlock],
  );

  if (isPhone) {
    return (
      <BubbleMenu
        logo={<Lockup inverted onHome={handleHome} />}
        items={NAV_ITEMS.map((it, i) => ({
          label: it.label,
          href: it.link,
          ariaLabel: it.ariaLabel,
          rotation: BUBBLE_ROTATIONS[i % BUBBLE_ROTATIONS.length],
          hoverStyles: { bgColor: BUBBLE_TINTS[i % BUBBLE_TINTS.length], textColor: '#06231A' },
        }))}
        menuAriaLabel="Toggle navigation"
        menuBg="#F7F9F8"
        /* No pill behind the lockup — it sits directly on the footage. */
        logoBg="transparent"
        /* Glass, not white. A fully transparent toggle would dissolve into the
           moving footage and stop reading as a control, so it keeps a tinted ink
           ground plus a hairline ring and a blur (see BubbleMenu.css) — present
           enough to be a button, dark enough not to be a white chip. */
        toggleBg="rgba(7, 11, 17, 0.42)"
        toggleLineColor="#F7F9F8"
        menuContentColor="#070B11"
        useFixedPosition
        animationEase="back.out(1.5)"
        animationDuration={0.5}
        staggerDelay={0.1}
        onMenuClick={handleOpenChange}
        onItemClick={handleItemClick}
      />
    );
  }

  return (
    <StaggeredMenu
      className="convex-menu"
      position="right"
      isFixed
      items={NAV_ITEMS}
      socialItems={SOCIALS}
      pendingSocials={SOCIALS_PENDING}
      displaySocials
      displayItemNumbering
      logo={<Lockup onHome={handleHome} />}
      colors={['#0B4F4A', '#22B573']}
      menuButtonColor="#F7F9F8"
      openMenuButtonColor="#070B11"
      accentColor="#22B573"
      changeMenuColorOnOpen
      closeOnClickAway
      onMenuOpen={() => handleOpenChange(true)}
      onMenuClose={() => handleOpenChange(false)}
      onItemClick={handleItemClick}
    />
  );
}
