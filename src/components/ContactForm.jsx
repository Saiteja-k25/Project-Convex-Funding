import { useCallback, useRef, useState } from 'react';

import { CONTACT } from '../data/site';
import './ContactForm.css';

/**
 * Contact form.
 *
 * DELIVERY — read this before changing anything here.
 *
 * This site is a static build. There is no server, so the browser cannot put a
 * message in an inbox on its own; something has to accept the POST and forward
 * it. That endpoint is configuration, not code:
 *
 *   VITE_CONTACT_ENDPOINT    the URL to POST to
 *   VITE_CONTACT_ACCESS_KEY  optional, sent as `access_key` in the body
 *
 * Both are read at BUILD time (that is what the VITE_ prefix means), so changing
 * them needs a redeploy, and neither is a secret — anything in a client bundle is
 * public. A form-relay public key is designed for that; a mail-provider API key
 * is NOT, and must never be put here. If you end up using SendGrid/Resend
 * directly, the key belongs in a serverless function and this should point at
 * that function instead.
 *
 * With no endpoint configured the form still validates fully and then hands the
 * visitor a prefilled email to support@ instead of pretending to have sent
 * something. A contact form that silently drops messages is worse than no form.
 */

const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT || '';
const ACCESS_KEY = import.meta.env.VITE_CONTACT_ACCESS_KEY || '';

/* Deliberately permissive. Email validation that tries to be clever rejects real
   addresses — plus-tags, new TLDs, apostrophes — and the only true test of an
   address is sending to it. This catches typos and nothing else. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Digits, spaces and the usual punctuation, 7-20 digits. Optional field, so this
   only runs when something was actually typed. */
const PHONE_RE = /^[+()\-.\s\d]{7,24}$/;

const MESSAGE_MIN = 20;
const MESSAGE_MAX = 2000;

const TOPICS = [
  'Evaluation and funding',
  'An existing account',
  'Payouts',
  'Partnership or media',
  'Something else',
];

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  topic: TOPICS[0],
  message: '',
  consent: false,
  // Honeypot. Never shown, never filled by a person.
  company: '',
};

function validate(values) {
  const errors = {};

  const name = values.name.trim();
  if (!name) errors.name = 'Please enter your name.';
  else if (name.length < 2) errors.name = 'That looks too short to be a name.';

  const email = values.email.trim();
  if (!email) errors.email = 'Please enter an email address so we can reply.';
  else if (!EMAIL_RE.test(email)) errors.email = 'That email address does not look right.';

  const phone = values.phone.trim();
  if (phone && !PHONE_RE.test(phone)) errors.phone = 'Please check that phone number.';

  const message = values.message.trim();
  if (!message) errors.message = 'Please tell us what you need.';
  else if (message.length < MESSAGE_MIN) {
    const short = MESSAGE_MIN - message.length;
    errors.message = `A little more detail helps — ${short} more character${short === 1 ? '' : 's'}.`;
  } else if (message.length > MESSAGE_MAX) {
    errors.message = `That is over the ${MESSAGE_MAX}-character limit.`;
  }

  if (!values.consent) errors.consent = 'Please confirm we can reply to you.';

  return errors;
}

/** Prefilled email, used when no endpoint is configured and when a send fails. */
function mailtoHref(values) {
  const subject = `Convex Funding enquiry — ${values.topic}`;
  const body = [
    `Name: ${values.name.trim()}`,
    `Email: ${values.email.trim()}`,
    values.phone.trim() ? `Phone: ${values.phone.trim()}` : null,
    `Topic: ${values.topic}`,
    '',
    values.message.trim(),
  ]
    .filter(Boolean)
    .join('\n');

  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  // Which fields the visitor has finished with. Errors only appear for these, so
  // the form is not correcting someone halfway through typing their own name.
  const [touched, setTouched] = useState({});
  // 'idle' | 'sending' | 'sent' | 'failed' | 'unconfigured'
  const [status, setStatus] = useState('idle');
  const formRef = useRef(null);

  const setField = useCallback(
    (field, value) => {
      setValues((prev) => {
        const next = { ...prev, [field]: value };
        // Re-validate a field that has already been flagged, so the error clears
        // as soon as it is fixed rather than on the next submit.
        setErrors((prevErrors) => (prevErrors[field] ? validate(next) : prevErrors));
        return next;
      });
    },
    [],
  );

  const handleBlur = useCallback(
    (field) => {
      setTouched((t) => ({ ...t, [field]: true }));
      setErrors(validate(values));
    },
    [values],
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const found = validate(values);
      setErrors(found);
      setTouched({ name: true, email: true, phone: true, message: true, consent: true });

      if (Object.keys(found).length) {
        // Move focus to the first problem rather than leaving the visitor to hunt
        // for it — the errors can be below the fold on a phone.
        const first = ['name', 'email', 'phone', 'message', 'consent'].find((k) => found[k]);
        formRef.current?.querySelector(`[name="${first}"]`)?.focus();
        return;
      }

      // Honeypot tripped. Report success and send nothing: telling a bot it failed
      // just invites it to try again with the field left empty.
      if (values.company) {
        setStatus('sent');
        return;
      }

      if (!ENDPOINT) {
        setStatus('unconfigured');
        return;
      }

      setStatus('sending');
      try {
        const payload = {
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          topic: values.topic,
          message: values.message.trim(),
          // Most relays use these to label the forwarded email.
          subject: `Convex Funding enquiry — ${values.topic}`,
          from_name: values.name.trim(),
        };
        if (ACCESS_KEY) payload.access_key = ACCESS_KEY;

        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Relay responded ${res.status}`);

        setStatus('sent');
        setValues(EMPTY);
        setTouched({});
      } catch {
        // Deliberately no error detail in the UI. The visitor cannot act on
        // "relay responded 502"; they can act on "here is the address instead".
        setStatus('failed');
      }
    },
    [values],
  );

  const showError = (field) => (touched[field] ? errors[field] : undefined);
  const remaining = MESSAGE_MAX - values.message.length;

  if (status === 'sent') {
    return (
      <div className="cform__done" role="status">
        <h3 className="cform__doneTitle">Message sent.</h3>
        <p className="cform__doneBody">
          Thank you — we have your enquiry and will reply to the address you gave us. If it is
          urgent, WhatsApp is the fastest route.
        </p>
        <button type="button" className="cform__again" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="cform" ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="cform__row">
        <div className="cform__field">
          <label className="cform__label" htmlFor="cf-name">
            Name <span aria-hidden="true">*</span>
          </label>
          <input
            className={`cform__input${showError('name') ? ' cform__input--bad' : ''}`}
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            aria-invalid={showError('name') ? 'true' : undefined}
            aria-describedby={showError('name') ? 'cf-name-err' : undefined}
            required
          />
          {showError('name') && (
            <p className="cform__err" id="cf-name-err">
              {errors.name}
            </p>
          )}
        </div>

        <div className="cform__field">
          <label className="cform__label" htmlFor="cf-email">
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            className={`cform__input${showError('email') ? ' cform__input--bad' : ''}`}
            id="cf-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            aria-invalid={showError('email') ? 'true' : undefined}
            aria-describedby={showError('email') ? 'cf-email-err' : undefined}
            required
          />
          {showError('email') && (
            <p className="cform__err" id="cf-email-err">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="cform__row">
        <div className="cform__field">
          <label className="cform__label" htmlFor="cf-phone">
            Phone <span className="cform__optional">optional</span>
          </label>
          <input
            className={`cform__input${showError('phone') ? ' cform__input--bad' : ''}`}
            id="cf-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => setField('phone', e.target.value)}
            onBlur={() => handleBlur('phone')}
            aria-invalid={showError('phone') ? 'true' : undefined}
            aria-describedby={showError('phone') ? 'cf-phone-err' : undefined}
          />
          {showError('phone') && (
            <p className="cform__err" id="cf-phone-err">
              {errors.phone}
            </p>
          )}
        </div>

        <div className="cform__field">
          <label className="cform__label" htmlFor="cf-topic">
            What is this about?
          </label>
          <select
            className="cform__input cform__select"
            id="cf-topic"
            name="topic"
            value={values.topic}
            onChange={(e) => setField('topic', e.target.value)}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="cform__field">
        <label className="cform__label" htmlFor="cf-message">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          className={`cform__input cform__textarea${showError('message') ? ' cform__input--bad' : ''}`}
          id="cf-message"
          name="message"
          rows={6}
          maxLength={MESSAGE_MAX}
          value={values.message}
          onChange={(e) => setField('message', e.target.value)}
          onBlur={() => handleBlur('message')}
          aria-invalid={showError('message') ? 'true' : undefined}
          aria-describedby={showError('message') ? 'cf-message-err' : 'cf-message-count'}
          required
        />
        <div className="cform__meta">
          {showError('message') ? (
            <p className="cform__err" id="cf-message-err">
              {errors.message}
            </p>
          ) : (
            <span className="cform__count" id="cf-message-count">
              {remaining} characters left
            </span>
          )}
        </div>
      </div>

      {/* Honeypot. Hidden from sight AND from assistive tech, and skipped in the
          tab order, so only an automated filler ever reaches it. Not `display:
          none` — some bots specifically ignore fields hidden that way. */}
      <div className="cform__pot" aria-hidden="true">
        <label htmlFor="cf-company">Company</label>
        <input
          id="cf-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.company}
          onChange={(e) => setField('company', e.target.value)}
        />
      </div>

      <div className="cform__field">
        <label className={`cform__consent${showError('consent') ? ' cform__consent--bad' : ''}`}>
          <input
            type="checkbox"
            name="consent"
            checked={values.consent}
            onChange={(e) => setField('consent', e.target.checked)}
            onBlur={() => handleBlur('consent')}
            aria-invalid={showError('consent') ? 'true' : undefined}
            aria-describedby={showError('consent') ? 'cf-consent-err' : undefined}
            required
          />
          <span>
            I agree that Convex Funding may use these details to respond to my enquiry.
          </span>
        </label>
        {showError('consent') && (
          <p className="cform__err" id="cf-consent-err">
            {errors.consent}
          </p>
        )}
      </div>

      <div className="cform__actions">
        <button className="btn btn--primary cform__submit" type="submit" disabled={status === 'sending'}>
          <span className="btn__label">{status === 'sending' ? 'Sending…' : 'Send message'}</span>
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
        </button>
      </div>

      {/* One live region for both outcomes, so a screen reader is told what
          happened without the message being announced twice. */}
      <div className="cform__status" role="status" aria-live="polite">
        {status === 'failed' && (
          <p className="cform__statusText cform__statusText--bad">
            That did not go through. Please{' '}
            <a href={mailtoHref(values)}>email us directly</a> — your message is prefilled — or
            reach us on WhatsApp.
          </p>
        )}
        {status === 'unconfigured' && (
          <p className="cform__statusText">
            Your details are ready to go.{' '}
            <a href={mailtoHref(values)}>Open this in your email app</a> to send it to{' '}
            {CONTACT.email}, or message us on WhatsApp.
          </p>
        )}
      </div>
    </form>
  );
}
