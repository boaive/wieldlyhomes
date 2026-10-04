import { useMemo } from 'react';
import { brandAssets } from '../config/assets';
import { brand, contact, studioCredit } from '../config/site';
import { contactCopy } from '../content/copy';
import { describe } from '../lib/grid';
import { useConfig } from '../state/config';
import { useEnquiry, type EnquiryPath } from '../state/enquiry';
import { Chapter, Label, Title } from '../ui/Chapter';
import { EnquiryForm, type FieldSpec } from '../ui/EnquiryForm';
import { goTo } from '../ui/Nav';

const PERSON: FieldSpec[] = [
  { name: 'name', label: 'Name', required: true, autoComplete: 'name' },
  { name: 'company', label: 'Company', autoComplete: 'organization' },
  { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', required: true, autoComplete: 'tel' },
  { name: 'location', label: 'Location', required: true, autoComplete: 'address-level2' },
];

const FIELDS: Record<EnquiryPath, FieldSpec[]> = {
  project: [
    ...PERSON,
    { name: 'requirement', label: 'Requirement', type: 'select', required: true, options: contactCopy.requirements },
    { name: 'size', label: 'Approximate size / number of units', wide: true },
    { name: 'message', label: 'Message', type: 'textarea' },
  ],
  partner: [
    ...PERSON,
    { name: 'interest', label: 'Partnership interest', required: true },
    { name: 'message', label: 'Message', type: 'textarea' },
  ],
};

const PATHS: EnquiryPath[] = ['project', 'partner'];

/** 11 Final CTA — one path for customers, one for partners. */
export function Contact() {
  const path = useEnquiry((s) => s.path);
  const setPath = useEnquiry((s) => s.setPath);
  const withConfiguration = useEnquiry((s) => s.withConfiguration);
  const setWithConfiguration = useEnquiry((s) => s.setWithConfiguration);
  const modules = useConfig((s) => s.modules);
  const summary = useMemo(() => describe(modules), [modules]);
  const attach = path === 'project' && withConfiguration && modules.length > 0;

  return (
    <Chapter id="contact" className="contact">
      <div className="contact__inner">
        <header className="contact__head">
          <Label>{contactCopy.label}</Label>
          <Title lines={contactCopy.title} className="title--xl" />
          <p className="body">{contactCopy.body}</p>
          <dl className="contact__direct">
            <div>
              <dt className="label">Email</dt>
              <dd>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </dd>
            </div>
            <div>
              <dt className="label">Phone</dt>
              <dd>
                <a href={contact.phoneHref}>{contact.phone}</a>
              </dd>
            </div>
          </dl>
        </header>

        <div className="contact__form">
          <div className="paths" role="tablist" aria-label="Enquiry type">
            {PATHS.map((p, i) => (
              <button key={p} type="button" role="tab" id={`path-${p}`} aria-selected={path === p} aria-controls="enquiry-panel" className={path === p ? 'is-on' : ''} onClick={() => setPath(p)}>
                <span className="label">0{i + 1}</span>
                {contactCopy.paths[p].tab}
              </button>
            ))}
          </div>

          <div id="enquiry-panel" role="tabpanel" aria-labelledby={`path-${path}`}>
            <EnquiryForm
              key={path}
              kind={path}
              subject={path === 'project' ? 'Project enquiry — Modular Precast' : 'Partnership enquiry'}
              fields={FIELDS[path]}
              cta={contactCopy.paths[path].cta}
              extra={attach ? { Configuration: summary } : undefined}
            >
              {path === 'project' && modules.length > 0 && (
                <label className="check">
                  <input type="checkbox" checked={withConfiguration} onChange={(e) => setWithConfiguration(e.target.checked)} />
                  <span>
                    Include my configuration
                    <em>{summary}</em>
                  </span>
                </label>
              )}
            </EnquiryForm>
            <p className="contact__note">{contactCopy.note}</p>
          </div>
        </div>
      </div>
    </Chapter>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <a
          className="footer__brand"
          href="#enter"
          onClick={(e) => {
            e.preventDefault();
            goTo('#enter');
          }}
        >
          <img src={brandAssets.mark} alt="" width={200} height={156} />
          <span>
            <strong>{brand.name}</strong>
            <em>{brand.tagline}</em>
          </span>
        </a>
        <p className="label">{brand.descriptor}</p>
        <div className="footer__contact">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={contact.phoneHref}>{contact.phone}</a>
        </div>
      </div>
      <div className="footer__base">
        <p>
          © {brand.year} {brand.name} — All rights reserved.
        </p>
        <p className="footer__credit">
          Digital experience crafted by{' '}
          {studioCredit.url ? (
            <a href={studioCredit.url} target="_blank" rel="noreferrer">
              {studioCredit.name}
            </a>
          ) : (
            <strong>{studioCredit.name}</strong>
          )}
          <span> · {studioCredit.line}</span>
        </p>
      </div>
    </footer>
  );
}
