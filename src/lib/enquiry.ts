import { contact, enquiryEndpoint } from '../config/site';

export interface Enquiry {
  kind: 'project' | 'partner' | 'catalogue';
  subject: string;
  fields: Record<string, string>;
}

export type EnquiryResult = { via: 'endpoint' } | { via: 'mail'; href: string };

const body = (e: Enquiry) =>
  Object.entries(e.fields)
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');

/**
 * Sends an enquiry.
 *
 * V1 has no backend. If VITE_ENQUIRY_ENDPOINT is configured the enquiry is
 * POSTed there as JSON; otherwise it is handed to the visitor's mail client as
 * a pre-filled message to the Wieldy sales address, and the UI says so — the
 * site never claims a submission that did not happen.
 */
export async function sendEnquiry(enquiry: Enquiry): Promise<EnquiryResult> {
  if (enquiryEndpoint) {
    const response = await fetch(enquiryEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enquiry),
    });
    if (!response.ok) throw new Error(`Enquiry endpoint responded ${response.status}`);
    return { via: 'endpoint' };
  }
  const href = `mailto:${contact.email}?subject=${encodeURIComponent(enquiry.subject)}&body=${encodeURIComponent(body(enquiry))}`;
  window.location.href = href;
  return { via: 'mail', href };
}
