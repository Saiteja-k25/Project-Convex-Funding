import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import Footer from './Footer';
import './StubPage.css';

/**
 * Honest placeholder for the routes the footer links to.
 *
 * These exist so no footer link is dead. They deliberately carry NO invented
 * copy — a fabricated privacy policy or risk disclosure would look finished and
 * be worse than an obvious gap.
 */
export default function StubPage({ title, note }) {
  return (
    <>
      <div className="stub">
        <Link className="stub__back" to="/">
          <ArrowLeft size={15} strokeWidth={1.7} aria-hidden="true" />
          Back to Convex Funding
        </Link>
        <h1 className="stub__title">{title}</h1>
        <p className="stub__note">{note}</p>
        <span className="stub__flag">Content pending</span>
      </div>
      <Footer />
    </>
  );
}
