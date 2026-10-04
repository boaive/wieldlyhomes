/**
 * All on-page copy.
 *
 * SOURCE-OF-TRUTH RULE: product facts, figures and terminology below come from
 * the Wieldy Homes Product Catalogue 2026 and the client meeting summary
 * (30/09/2026). Do not add technical claims that are not in those documents.
 */

export interface Beat {
  index: string;
  title: string;
  body: string;
  items?: string[];
}

export const hero = {
  label: '01 / Enter Wieldy',
  title: ['Construction,', 'made wieldy.'],
  body: 'A modular construction system engineered from factory to site.',
  cta: 'Explore the system',
};

export const offsite = {
  label: '02 / Off-site construction',
  title: ['Build', 'where', 'control', 'matters.'],
  body: 'A controlled environment for consistent quality, efficient production and reduced on-site variability.',
  beats: [
    {
      index: '01',
      title: 'Design',
      body: 'Share the site and the requirement. A layout and a fixed estimate come first.',
    },
    {
      index: '02',
      title: 'Planning',
      body: 'Each footprint ships as a set of pre-engineered layouts. Pick the option that fits the site, not a custom redraw.',
    },
    {
      index: '03',
      title: 'Engineering',
      body: 'Lightweight forming and reinforced panels, built to match the strength of traditional precast concrete without its bulk.',
    },
    {
      index: '04',
      title: 'Manufacturing',
      body: 'Panels and capsules are cast indoors under controlled tolerances.',
    },
    {
      index: '05',
      title: 'Construction',
      body: 'Foundation and utilities are readied in parallel. Capsules are craned into place and finished, typically in days.',
    },
  ] satisfies Beat[],
};

export const reveal = {
  label: '02 / Controlled environment',
  title: ['One module.', 'A complete', 'system.'],
  body: 'Every capsule leaves the factory as a finished, engineered volume.',
  beats: [
    { index: 'A', title: 'Structure', body: 'Reinforced panels form the shell.' },
    { index: 'B', title: 'Insulation', body: 'Aerogel, PIR or glass wool cores.' },
    { index: 'C', title: 'Services', body: 'Electrical and plumbing, integrated in the module.' },
    { index: 'D', title: 'Interior', body: 'Flooring, joinery and fixtures, finished as one space.' },
  ] satisfies Beat[],
};

export const why = {
  label: '03 / Why Wieldy',
  title: ['Six reasons,', 'one module.'],
  beats: [
    {
      index: '01',
      title: 'Controlled',
      body: 'Components are made indoors under consistent tolerances, not weather-dependent site work.',
    },
    {
      index: '02',
      title: 'Insulated',
      body: 'Panels built with aerogel, PIR or glass wool cores for year-round thermal comfort.',
    },
    {
      index: '03',
      title: 'Modular',
      body: 'Two standardized capsules. The same pair scales from a single studio to a stacked, multi-storey building.',
    },
    {
      index: '04',
      title: 'Lighter',
      body: 'Half the weight of traditional precast concrete. Simple lifting equipment. No heavy transport.',
    },
    {
      index: '05',
      title: 'Scalable',
      body: 'Single-floor homes, multi-floor dwellings, or mid-rise buildings up to 5 storeys.',
    },
    {
      index: '06',
      title: 'Site-ready',
      body: 'Factory manufacturing runs in parallel with site prep. 30–60% faster build.',
    },
  ] satisfies Beat[],
};

export const ledger = {
  label: '03 / The system, compared',
  title: ['Precast,', 'without the weight.'],
  figures: [
    { value: '30–60%', label: 'Faster build' },
    { value: '½×', label: 'Weight of precast concrete' },
    { value: '4 hr', label: 'Fire rated' },
  ],
  marks: ['Thermally insulated', 'Sound proof'],
  compare: {
    ours: 'Wieldy Homes system',
    theirs: 'Traditional precast concrete',
    rows: [
      ['Flexible forming', 'Heavy molds'],
      ['Design freedom', 'Design limitations'],
      ['Simple lifting equipment', 'Large lifting equipment'],
      ['No heavy transport', 'Heavy transport vehicles'],
      ['Low entry barriers on site', 'Large setup, high entry barriers'],
      ['Cost-efficient per module', 'Premium pricing'],
    ],
  },
  principles: [
    {
      title: 'Small and micro infrastructure',
      body: 'A system sized for compact buildings rather than large-scale infrastructure.',
    },
    {
      title: 'Foundation to finish',
      body: 'One end-to-end service, from the first footing to the final fixture.',
    },
    {
      title: 'Energy-efficient by design',
      body: 'Environmentally friendly construction, with reduced fossil-fuel usage and wastage.',
    },
    {
      title: 'Easier to modify',
      body: 'Corrections and modifications stay simple.',
    },
    {
      title: 'An integrated ecosystem',
      body: 'Engineering, licensing and technical support under one roof.',
    },
    {
      title: 'Predictable budgets',
      body: 'Less labour, less material waste, fewer delays. Costs are known upfront.',
    },
  ],
};

export const story = {
  label: '04 / Construction story',
  title: ['Ground', 'to habitat.'],
  beats: [
    {
      index: '01',
      title: 'Foundation',
      body: 'Footing, plinth and piers are prepared on site.',
      items: ['Footing', 'Plinth', 'Piers'],
    },
    {
      index: '02',
      title: 'Shell',
      body: 'The structural shell of the module takes shape in the factory.',
      items: ['Structural shell'],
    },
    {
      index: '03',
      title: 'Insulation',
      body: 'Thermal insulation is built into the shell.',
      items: ['Thermal insulation'],
    },
    {
      index: '04',
      title: 'Services',
      body: 'Electrical and plumbing routes are set, with mechanical services where applicable.',
      items: ['Electrical', 'Plumbing', 'Mechanical'],
    },
    {
      index: '05',
      title: 'Forming',
      body: 'Green formwork closes around the module.',
      items: ['Green formwork'],
    },
    {
      index: '06',
      title: 'Casting',
      body: 'Mixer to pump to form. The concrete is cast.',
      items: ['Concrete mixer', 'Concrete pump', 'Casting'],
    },
    {
      index: '07',
      title: 'Finishing',
      body: 'Flooring, joinery, tiles and fixtures complete the interior.',
      items: ['Flooring', 'Joinery', 'Tiles', 'Electrical', 'Plumbing', 'Fixtures'],
    },
    {
      index: '08',
      title: 'Installation',
      body: 'Lifted, transported and placed. Deck, stairs, shades and roof follow.',
      items: ['Lifting', 'Transportation', 'Installation', 'Deck', 'Stairs', 'Shades', 'Roof'],
    },
    {
      index: '09',
      title: 'Habitat',
      body: 'A completed modular space, ready for use.',
      items: ['Finished environment'],
    },
  ] satisfies Beat[],
};

export const precast = {
  label: '05 / Modular Precast',
  title: ['Two modules.', 'Multiple', 'possibilities.'],
  body: 'Every Wieldy Homes project is built from two standardized precast concrete capsules.',
  modules: [
    {
      id: 'base' as const,
      name: 'Base capsule',
      short: '3×3',
      area: '100 sq ft',
      footprint: '3m × 3m footprint',
    },
    {
      id: 'extended' as const,
      name: 'Extended capsule',
      short: '3×6',
      area: '200 sq ft',
      footprint: '6m × 3m footprint',
    },
  ],
  beats: [
    {
      index: 'A',
      title: 'Base capsule',
      body: '100 sq ft on a 3m × 3m footprint.',
    },
    {
      index: 'B',
      title: 'Extended capsule',
      body: '200 sq ft on a 6m × 3m footprint.',
    },
    {
      index: 'C',
      title: 'Combined',
      body: 'Standardized capsule units combine into single-floor homes, multi-floor dwellings, or mid-rise buildings up to 5 storeys.',
    },
  ] satisfies Beat[],
  footprints: [
    { name: 'Single unit', sqm: '18 sqm', sqft: '≈200 sq ft' },
    { name: 'Two units', sqm: '27 sqm', sqft: '≈290 sq ft' },
    { name: 'Combined', sqm: '36 sqm', sqft: '≈390 sq ft' },
    { name: 'Extended', sqm: '54 sqm', sqft: '≈580 sq ft' },
  ],
  applications: [
    'Villas & farmhouses',
    'Commercial spaces',
    'Industrial structures',
    'Healthcare & education',
    'Modular housing projects',
    'Portable houses',
  ],
};

export const plansCopy = {
  label: '05 / Layouts',
  title: ['Pre-engineered', 'layouts.'],
  body: 'Each footprint ships as a set of pre-engineered layouts.',
  note: 'Layouts shown are indicative. Room dimensions, openings and finishes can be adjusted to the site and requirement.',
  cta: 'Configure this layout',
};

export const configure = {
  label: '06 / Configure',
  title: ['Pick. Place.', 'Combine.'],
  body: 'Select a module and place it on the grid. The plan follows.',
};

export const journey = {
  label: '07 / Transport → Site → Installation',
  beats: [
    {
      index: '01',
      title: 'Lift',
      body: 'The configuration leaves the factory floor, one complete module at a time.',
    },
    {
      index: '02',
      title: 'Transport',
      body: 'Capsules travel as finished units. No heavy transport.',
    },
    {
      index: '03',
      title: 'Site',
      body: 'Foundation and utilities are readied in parallel with manufacturing.',
    },
    {
      index: '04',
      title: 'Placement',
      body: 'Capsules are craned into place with simple lifting equipment.',
    },
    {
      index: '05',
      title: 'Finish',
      body: 'Deck, stairs, shades and roof complete the building.',
    },
  ] satisfies Beat[],
};

export const habitat = {
  label: '08 / Interior',
  title: ['Finished', 'as one space.'],
  beats: [
    { index: '01', title: 'Living', body: 'Daylight from the deck side. Concrete overhead, timber underfoot.' },
    { index: '02', title: 'Kitchen', body: 'A pantry kitchen along the living wall.' },
    { index: '03', title: 'Bedroom', body: 'A quiet room with built-in joinery.' },
    { index: '04', title: 'Bathroom', body: 'Tiled, compact and complete.' },
    { index: '05', title: 'Deck', body: 'The module, extended outdoors.' },
  ] satisfies Beat[],
};

export const future = {
  precamp: {
    id: 'labour-precamp',
    label: '09 / Future offering',
    status: 'Coming soon',
    name: 'Labour Precamp',
    title: ['Labour', 'Precamp'],
    body: 'Staff accommodation and labour camps that can expand as project needs grow. Presented here as a concept.',
    cta: 'Request catalogue',
  },
  capsule: {
    id: 'capsule-house',
    label: '10 / Future offering',
    status: 'Coming soon',
    name: 'Capsule House',
    title: ['Capsule', 'House'],
    body: 'A relocatable unit for temporary sites, remote locations, or projects that need to move. Presented here as a concept.',
    cta: 'Request catalogue',
  },
};

export const contactCopy = {
  label: '11 / Contact',
  title: ['Build with', 'Wieldy.'],
  body: 'Share your location and requirements. A fixed estimate typically follows within a day.',
  note: 'Actual cost per sq ft varies with material choice, city and site accessibility. Request a site-specific quote for an exact number.',
  paths: {
    project: { tab: 'I have a project', cta: 'Request a quote' },
    partner: { tab: 'I want to partner', cta: 'Start a conversation' },
  },
  requirements: [
    'Villa or farmhouse',
    'Commercial space',
    'Industrial structure',
    'Healthcare or education',
    'Modular housing project',
    'Portable house',
    'Other',
  ],
};
