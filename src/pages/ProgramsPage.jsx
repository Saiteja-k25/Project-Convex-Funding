import ComingSoonPage from './ComingSoonPage';

/**
 * /programs — was the '#programs' nav anchor, which had no section behind it and
 * silently scrolled to the top of the landing page instead.
 *
 * Copy is deliberately measured rather than playful. The rest of this site
 * ("Rewarding skill, consistency, and disciplined performance", the published
 * 31.4% pass rate) does not wink at the reader, and a prop firm being coy about
 * its own pricing reads badly. Saying plainly that nothing is listed until it is
 * confirmed is the more confident position — and it is the same argument the
 * footer already makes by leaving the legal entity blank rather than guessing.
 */
export default function ProgramsPage() {
  return (
    <ComingSoonPage
      eyebrow="Programs"
      chip="Being listed"
      title="Programs are still being listed."
      lede="Account sizes, pricing and the funding tiers that go with them will appear here as soon as Convex Funding confirms them."
      detail="Nothing goes on this page before it is real. When the programs are set they are published here in full — the tiers, what each one costs, and the capital it unlocks — rather than as a teaser you have to enquire about to decode."
    />
  );
}
