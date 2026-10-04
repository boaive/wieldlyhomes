/**
 * Brand, contact and navigation constants.
 * Contact details are taken from the Wieldy Homes Product Catalogue 2026.
 */

export const brand = {
  name: 'Wieldy Homes',
  tagline: 'Construction, made wieldy.',
  descriptor: 'Manufactured, modular & portable homes · India',
  year: 2026,
} as const;

export const contact = {
  email: 'sales@wieldyhomes.com',
  phone: '+91 74163 00561',
  phoneHref: 'tel:+917416300561',
} as const;

/**
 * Production credit. `url` stays null until BOAIVE's official website address
 * is confirmed — the credit renders as plain text when no URL is set.
 */
export const studioCredit = {
  name: 'BOAIVE',
  line: 'Float Your Thrive',
  url: null as string | null,
} as const;

/** Optional enquiry endpoint. When unset, forms hand the enquiry to the visitor's mail client. */
export const enquiryEndpoint: string | undefined = import.meta.env.VITE_ENQUIRY_ENDPOINT;

export const navLinks = [
  { label: 'Experience', href: '#enter' },
  { label: 'Modular Precast', href: '#precast' },
  { label: 'Future', href: '#precamp' },
  { label: 'Contact', href: '#contact' },
] as const;
