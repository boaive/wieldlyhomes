import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { contact } from '../config/site';
import { sendEnquiry, type Enquiry, type EnquiryResult } from '../lib/enquiry';
import { Arrow } from './Arrow';

export interface FieldSpec {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  required?: boolean;
  options?: readonly string[];
  autoComplete?: string;
  wide?: boolean;
}

interface EnquiryFormProps {
  kind: Enquiry['kind'];
  subject: string;
  fields: readonly FieldSpec[];
  cta: string;
  /** Extra lines appended to the enquiry, e.g. the configuration summary. */
  extra?: Record<string, string>;
  /** Rendered between the fields and the submit button. */
  children?: ReactNode;
}

type Status = { state: 'idle' } | { state: 'sending' } | { state: 'sent'; result: EnquiryResult } | { state: 'error' };

/** Underlined, labelled fields with native validation and an honest confirmation state. */
export function EnquiryForm({ kind, subject, fields, cta, extra, children }: EnquiryFormProps) {
  const uid = useId();
  const [status, setStatus] = useState<Status>({ state: 'idle' });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    for (const f of fields) values[f.label] = String(data.get(f.name) ?? '');
    setStatus({ state: 'sending' });
    try {
      const result = await sendEnquiry({ kind, subject, fields: { ...values, ...extra } });
      setStatus({ state: 'sent', result });
    } catch {
      setStatus({ state: 'error' });
    }
  };

  if (status.state === 'sent') {
    return (
      <div className="form__done" role="status">
        <p className="label label--lime">{status.result.via === 'endpoint' ? 'Enquiry sent' : 'Enquiry prepared'}</p>
        {status.result.via === 'endpoint' ? (
          <p>Thank you. Wieldy Homes will be in touch.</p>
        ) : (
          <p>
            Your mail app has opened with the enquiry addressed to {contact.email}. Send it from there to complete the request. If nothing opened,{' '}
            <a href={status.result.href}>open the message</a> or write to us directly.
          </p>
        )}
        <button type="button" className="btn btn--quiet" onClick={() => setStatus({ state: 'idle' })}>
          Edit enquiry
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate={false}>
      <div className="form__grid">
        {fields.map((f) => {
          const id = `${uid}-${f.name}`;
          const common = { id, name: f.name, required: f.required, autoComplete: f.autoComplete };
          return (
            <div key={f.name} className={`field ${f.wide || f.type === 'textarea' ? 'field--wide' : ''}`}>
              <label htmlFor={id}>
                {f.label}
                {!f.required && <span> · optional</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea {...common} rows={3} />
              ) : f.type === 'select' ? (
                <select {...common} defaultValue="">
                  <option value="" disabled>
                    Select
                  </option>
                  {f.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input {...common} type={f.type ?? 'text'} />
              )}
            </div>
          );
        })}
      </div>
      {children}
      <div className="form__foot">
        <button type="submit" className="btn btn--solid" disabled={status.state === 'sending'}>
          {cta}
          <Arrow />
        </button>
        {status.state === 'error' && (
          <p className="form__error" role="alert">
            The enquiry could not be sent. Please write to <a href={`mailto:${contact.email}`}>{contact.email}</a>.
          </p>
        )}
      </div>
    </form>
  );
}
