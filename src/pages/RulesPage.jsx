import ComingSoonPage from './ComingSoonPage';

/**
 * /rules — was the '#rules' nav anchor, which had no section behind it.
 *
 * Saiteja's steer was "still being brewed". Kept the sense, dropped the wink: on
 * the one page a trader visits specifically to find out how they can LOSE a
 * funded account, sounding casual about it is the wrong note. "Still being
 * written" says the same thing and sounds like a firm that takes its own risk
 * parameters seriously. Easy to warm up if he wants it lighter.
 */
export default function RulesPage() {
  return (
    <ComingSoonPage
      eyebrow="Rules"
      chip="Being written"
      title="The rules are still being written."
      lede="Trading rules, risk parameters and evaluation targets are being assembled by Convex Funding, and will be published here once they are final."
      detail="These are the terms a funded account lives or dies by, so they are not going up in draft. When they are settled you will find the daily and overall limits, what counts as a breach, and how each one is measured — stated once, precisely, with nothing held back for the small print."
    />
  );
}
