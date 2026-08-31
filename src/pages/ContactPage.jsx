import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

import ContactForm from '../components/ContactForm';
import { PageHero, PageShell, Section } from '../components/PageShell';
import { CONTACT } from '../data/site';

/**
 * /contact — replaces the StubPage placeholder.
 *
 * Direct routes first, form second. Someone who already knows what they want
 * should not have to fill in a form to find an email address, and the two people
 * running this firm are reachable faster on WhatsApp than through any relay.
 *
 * No response-time promise anywhere on this page ("we reply within 24 hours" and
 * similar). That is a commitment about how the business operates, and nobody has
 * made it.
 */
export default function ContactPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Contact"
        title="Talk to Convex Funding."
        lede="Questions about the evaluation, an existing account, or a payout — reach us directly, or send the form below."
      />

      <Section title="Direct">
        <ul className="page-facts">
          <li className="page-fact">
            <span className="page-fact__label">
              <Mail size={13} strokeWidth={1.8} aria-hidden="true" /> Email
            </span>
            <span className="page-fact__value">
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </span>
          </li>
          <li className="page-fact">
            <span className="page-fact__label">
              <MessageCircle size={13} strokeWidth={1.8} aria-hidden="true" /> WhatsApp
            </span>
            <span className="page-fact__value">
              <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
                {CONTACT.phone}
              </a>
            </span>
          </li>
          <li className="page-fact">
            <span className="page-fact__label">
              <Phone size={13} strokeWidth={1.8} aria-hidden="true" /> Telephone
            </span>
            <span className="page-fact__value">
              <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
            </span>
          </li>
          <li className="page-fact">
            <span className="page-fact__label">
              <MapPin size={13} strokeWidth={1.8} aria-hidden="true" /> Office
            </span>
            <span className="page-fact__value">{CONTACT.location}</span>
          </li>
        </ul>
      </Section>

      <Section title="Send a message">
        <ContactForm />
      </Section>
    </PageShell>
  );
}
