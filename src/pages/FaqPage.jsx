import ComingSoonPage from './ComingSoonPage';

/**
 * /faq — was the '#faq' footer anchor, the last one with no section behind it.
 *
 * Framed as "not collected yet" rather than "not written yet", because that is
 * the honest position: an FAQ assembled before anyone has asked anything is not a
 * FAQ, it is marketing copy in question form. It also happens to be true that
 * most of what belongs here depends on the programs and the rules, and neither is
 * final — so publishing answers now would mean rewriting them later.
 *
 * Same two rules as the other pending pages (see ComingSoonPage): no dates, and
 * no sample questions with invented answers.
 */
export default function FaqPage() {
  return (
    <ComingSoonPage
      eyebrow="FAQ"
      chip="Being collected"
      title="The questions are still being collected."
      lede="A useful FAQ is written from what traders actually ask, not from what a firm guesses they might. This page fills up as those questions arrive."
      detail="Most of what belongs here depends on the programs and the trading rules, and neither is settled yet — answers published now would only have to be rewritten. Until then every question goes straight to a person rather than into a search box, which is usually the faster answer anyway."
    />
  );
}
