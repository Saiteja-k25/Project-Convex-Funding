/**
 * Single source of truth for navigation, socials and footer links.
 *
 * Hybrid routing: the story lives on the landing page as anchors, while Contact
 * and the legal pages are real routes. Anchor items start with '#', route items
 * with '/', and the nav decides how to handle each from that prefix.
 */

export const NAV_ITEMS = [
  { label: 'Home', ariaLabel: 'Back to the top', link: '#top' },
  { label: 'Programs', ariaLabel: 'Funding programs and account sizes', link: '/programs' },
  // A real route, not an anchor. The evaluation story needed more room than a
  // phase of the scroll film, and it has to be linkable on its own.
  { label: 'How Convex works', ariaLabel: 'How the evaluation works', link: '/how-convex-works' },
  { label: 'Rules', ariaLabel: 'Trading rules and risk parameters', link: '/rules' },
  { label: 'Contact', ariaLabel: 'Get in touch', link: '/contact' },
];

/** Real contact details, supplied 2026-08-28. */
export const CONTACT = {
  email: 'support@convexfunding.com',
  phone: '+1 (248) 491-9357',
  // Digits only for the tel: URI — punctuation breaks dialling on some handsets.
  phoneHref: 'tel:+12484919357',
  // Same number as `phone`. WhatsApp confirmed by Saiteja, so this is no longer a
  // pending item. wa.me wants full international form, digits only.
  whatsapp: 'https://wa.me/12484919357',
  location: 'Frisco, Texas, United States',
};

export const SOCIALS = [
  { label: 'LinkedIn', icon: 'linkedin', link: 'https://www.linkedin.com/company/convex-funding/' },
  // `?igsi=...` stripped — that is Instagram's share-tracking parameter, tied to
  // the session the link was copied from. It is noise in a permanent footer link.
  { label: 'Instagram', icon: 'instagram', link: 'https://www.instagram.com/convexfunding' },
  // wa.me wants the number in full international form, digits only.
  { label: 'WhatsApp', icon: 'whatsapp', link: 'https://wa.me/12484919357' },
];

/** Superseded by `link: null` above. Kept exported so nothing breaks on import. */
export const SOCIALS_PENDING = [];

export const FOOTER_COLUMNS = [
  {
    title: 'Programs',
    links: [
      { label: 'Evaluation', link: '/programs' },
      { label: 'How Convex works', link: '/how-convex-works' },
      { label: 'Trading rules', link: '/rules' },
      { label: 'FAQ', link: '/faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', link: '/about' },
      { label: 'Contact', link: '/contact' },
      // external: true so `go()` leaves mailto:/tel: to the OS instead of
      // preventDefault-ing them into the router.
      { label: 'support@convexfunding.com', link: 'mailto:support@convexfunding.com', external: true },
      { label: '+1 (248) 491-9357', link: 'tel:+12484919357', external: true },
      // No LinkedIn text link here — the social icon below the first column
      // already covers it, and two routes to the same page in one footer is
      // clutter, not convenience.
    ],
  },
  {
    title: 'Legal',
    // Routes exist as stubs so nothing here is a dead link. Which of these you
    // actually publish is still open — see PENDING below.
    links: [
      { label: 'Terms & Conditions', link: '/legal/terms' },
      { label: 'Privacy Policy', link: '/legal/privacy' },
      { label: 'Risk Disclosure', link: '/legal/risk' },
    ],
  },
];

/**
 * Facts not yet supplied. Never invented.
 *
 * CURRENTLY UNRENDERED. The footer disclosure used to read "Operated by
 * [LEGAL ENTITY NAME], registered in [JURISDICTION]. Enquiries: ...", which put
 * the bracketed placeholders in front of real visitors. That clause was removed
 * on request; the disclosure now opens at "Enquiries:". This object is kept
 * deliberately — it is the record of what is still outstanding, and the clause
 * goes back into Footer.jsx once both values are real. Do not delete it as dead
 * code, and do not re-render the brackets publicly.
 *
 * NOTE: the office is in Frisco, Texas, but that is NOT the same claim as the
 * registered entity or its jurisdiction of registration, so those two stay
 * pending. Filling them in from the office address would be a guess about a
 * regulated fact.
 */
export const PENDING = {
  entity: '[LEGAL ENTITY NAME]',
  jurisdiction: '[JURISDICTION]',
};

/**
 * The company's own description, as published on its LinkedIn page — split into
 * the two claims it actually makes. Verbatim client copy; do not paraphrase it
 * for tone.
 *
 * Split rather than stored as one blob because /about uses the two halves at two
 * different moments — `positioning` as the opening statement, `belief` as the
 * full-bleed band a screen later. Printing the whole paragraph twice on one page
 * is what it would otherwise amount to, since the band wants exactly the sentence
 * the paragraph already ends on.
 *
 * `closing` is the paragraph's tail, used as the /about hero lede.
 */
export const OVERVIEW = {
  positioning:
    'Convex Funding is a proprietary trading firm dedicated to empowering talented ' +
    'traders with access to capital, professional trading opportunities, and a clear ' +
    'path to growth.',
  belief: 'We believe in rewarding skill, consistency, and disciplined performance.',
  closing:
    'Helping traders unlock their full potential in today’s dynamic financial markets.',
};

/**
 * The three qualities the overview names. Used twice, deliberately differently:
 * /about frames them as what the firm believes, /how-convex-works as what the
 * evaluation measures. Same source claim, two frames — which is what keeps the
 * pages from reading as duplicates of each other.
 */
export const QUALITIES = [
  {
    key: 'skill',
    title: 'Skill',
    belief: 'An edge is something you demonstrate, not something you describe.',
    measured: 'Whether the results hold up over a full evaluation, not a lucky week.',
  },
  {
    key: 'consistency',
    title: 'Consistency',
    belief: 'A repeatable process outlives any single winning trade.',
    measured: 'Whether returns arrive steadily rather than in one outsized position.',
  },
  {
    key: 'discipline',
    title: 'Disciplined performance',
    belief: 'Risk control is the difference between a trader and a gambler.',
    measured: 'Whether risk limits are respected under pressure, not just on paper.',
  },
];

/**
 * Leadership, as published on their own LinkedIn profiles.
 *
 * Scope is deliberate and agreed: NAME, Convex-Funding ROLE, LOCATION. Nothing
 * else. Specifically NOT included, and not to be added without Saiteja saying so:
 *
 *   - No biography. Neither profile carries one, and inventing a founding story
 *     for a named, identifiable person on a financial services site is the one
 *     kind of copy this project must never generate.
 *   - No photographs. Their LinkedIn portraits are personal data and not ours to
 *     republish. The monogram treatment exists because of this, not as a
 *     placeholder waiting for images.
 *   - No other companies. Both profiles list Cresco Prime and Matrix Missions
 *     alongside Convex Funding; on Convex's own site the Convex role is the only
 *     relevant one.
 *
 * Kalyan's profile string reads 'Director , Founder & CEO'. Reduced to the senior
 * title here.
 */
export const LEADERSHIP = [
  {
    name: 'Kalyan Boddula',
    role: 'Founder & CEO',
    initials: 'KB',
    location: 'Hyderabad, Telangana, India',
  },
  {
    name: 'Varun Carter',
    role: 'Director of Operations',
    initials: 'VC',
    location: 'Hyderabad, Telangana, India',
  },
];

/**
 * The four figures already published in the scroll overlay. Single source now
 * that /how-convex-works shows them too — two different numbers for one claim on
 * one site is a credibility problem, not a copy problem.
 */
export const METRICS = [
  { label: 'Profit split', value: '90%', note: 'of profit paid to the trader' },
  { label: 'Max funding', value: '$200K', note: 'in firm capital' },
  { label: 'Payout speed', value: '<24h', note: 'from approved request' },
  { label: 'Pass rate', value: '31.4%', note: 'published, not marketed' },
];

/**
 * Footer credit. Rendered as solid pills rather than an underlined anchor: it is
 * a byline that happens to be clickable, so it should read as a wordmark, not as
 * navigation.
 */
export const CREDIT = {
  prefix: 'Created by',
  // One string, one pill. Splitting the name across two bubbles read as two
  // separate tags rather than one person's name.
  name: 'Kurapati Sai Teja',
  link: 'https://portfolio-ks-beta.vercel.app/',
};

export const SITE = {
  name: 'Convex Funding',
  domain: 'convexfunding.com',
  tagline: 'Empowering Traders with Capital, Opportunity, and Growth.',
  year: new Date().getFullYear(),
};
