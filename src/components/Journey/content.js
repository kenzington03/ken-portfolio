// Everything the v5/v6 journeys say, in one place. Hiring-first: who, what,
// where and how long are readable with zero interaction; the depth lives in
// the Mac.

import { KUDOS_QUOTES } from '../../data/kudosQuotes.js';

export const ME = {
  hello: "Hey, I'm Ken.",
  name: 'Kenneth Nathanael',
  role: 'Creative Lead',
  line: 'I direct brands, motion and interfaces.',
  city: 'Hyderabad',
  years: '10 yrs',
  email: 'kennethnathanael@gmail.com',
};

// Company and years only, no titles (Ken's call). Oldest first.
// Years verified against Ken's LinkedIn (Oct 2026).
export const CAREER = [
  { company: 'DreamWorks', when: '2015' },
  { company: 'Cowboy Studios', when: '2016' },
  { company: 'MiGrocer', when: '2018' },
  { company: 'WebAnatomy', when: '2020' },
  { company: 'Tandem Digital', when: '2020' },
  { company: 'Milestone Technologies', when: '2023 - now' },
];

export const STORY = [
  'Ten years shaping brands, campaigns and interfaces.',
  'I lead the idea, and I still push the pixels.',
  'The rest of the story lives on my Mac.',
];

// Real marks only. Ask Ken for Sheraton, Aloft, Tandem, Truearte,
// Step-Set-Go and Sampoorna files before adding them.
export const LOGOS = [
  { name: 'Milestone Technologies', src: '/assets/logos/milestone.png', w: 150 },
  { name: 'Marriott', src: '/assets/logos/marriott.svg', w: 40 },
  { name: 'Nike', src: '/assets/logos/nike.svg', w: 54 },
  { name: 'Fluid AI', src: '/assets/logos/fluid-ai.jpg', w: 90 },
];

// Real work, shown as images (project lives in the Mac).
export const WORK = [
  { title: 'Nike × LeBron', src: '/assets/journey/hero-lebron-nike.jpg' },
  { title: 'Fluid AI', src: '/assets/journey/hero-fluidai.jpg' },
  { title: 'Marriott · Aloft', src: '/assets/journey/hero-mariott.jpg' },
  { title: 'Motion', src: '/assets/journey/hero-motion.jpg' },
  { title: 'Branding', src: '/assets/journey/hero-branding.jpg' },
  { title: 'Web and UI', src: '/assets/journey/hero-web-ui.jpg' },
  { title: 'Social', src: '/assets/journey/hero-social-media.jpg' },
  { title: 'Print and info', src: '/assets/journey/hero-print-info.jpg' },
];

const tidy = (q) =>
  q
    .replace(/\s*[—–]\s*/g, '. ')
    .replace(/~/g, ',')
    .replace(/!{2,}/g, '!')
    .replace(/\.\s+(\w)/g, (m, c) => `. ${c.toUpperCase()}`);

export const KUDOS = KUDOS_QUOTES.map((k) => ({ ...k, quote: tidy(k.quote) }));

// Shown under the Build / Move / Ship words in the Mac room.
export const CHAPTER_CAPTIONS = {
  build: 'Identities with a reason behind every curve.',
  move: 'Motion that explains before it impresses.',
  ship: 'Interfaces that feel obvious the first time.',
};
