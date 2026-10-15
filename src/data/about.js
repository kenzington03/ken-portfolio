// Single source of truth for the About copy: the About app, the Intro3
// story/timeline sections and the proof strip all read from here.

export const POSITIONING = {
  line: 'I direct brands, motion & interfaces.',
  chip: 'Creative Lead · 10 yrs · Hyderabad',
};

// Intro3 "get to know me", one line per scroll beat. Lines marked PLACEHOLDER
// are invented prompts (habit / obsession / win / team) for Ken to swap for
// the real story; they are not facts yet.
export const STORY = [
  "Hi, I'm Ken. Ten years of brands, campaigns and interfaces, and a flat idea starting to move still makes me giddy.",
  // PLACEHOLDER (habit)
  'I screenshot everything. My desktop holds 3,000 of them: good kerning, bad signage, one very confident pigeon.',
  // PLACEHOLDER (obsession)
  "I'll lose an evening to a 200-millisecond ease. Nobody notices when it's right. Everybody feels it.",
  // PLACEHOLDER (small win)
  'Best note I ever got on a launch film: “I forgot it was an ad.”',
  // PLACEHOLDER (team)
  "On a team I'm the one asking “what if it moved?”, then staying late to make it move.",
];

export const SKILLS = [
  'Brand Identity',
  'Motion Graphics',
  'UI/UX',
  'Video Production',
  'Campaigns',
  'Print',
];

// `from`/`to` are decimal years (Dec 2023 = 2023.9) so the Intro3 timeline
// can place each role proportionally. `to: null` means "now".
// Dates verified against Ken's LinkedIn (Oct 2026). Titles are Ken's own wording.
export const ROLES = [
  { company: 'Milestone Technologies', role: 'Design Lead', dates: 'Dec 2023 - Present', from: 2023.92, to: null },
  { company: 'Tandem Digital', role: 'Lead Graphic & UI Designer', dates: 'Jul 2020 - Sep 2023', from: 2020.5, to: 2023.75 },
  { company: 'WebAnatomy', role: 'Visual Designer', dates: 'Jan 2020 - Jun 2020', from: 2020.0, to: 2020.5 },
  { company: 'MiGrocer', role: 'Visual Designer', dates: 'Nov 2018 - Feb 2020', from: 2018.83, to: 2020.12 },
  { company: 'Cowboy Studios', role: 'Graphic Designer', dates: 'Jun 2016 - Jul 2018', from: 2016.42, to: 2018.58 },
  { company: 'DreamWorks Dedicated Unit', role: 'Artist Model', dates: 'Aug 2015 - Feb 2016', from: 2015.58, to: 2016.17 },
];

export const NOW = 'Now: Design Lead at Milestone Technologies. Learning R3F, shipping motion.';

export const CLIENTS = [
  'Milestone Technologies',
  'Marriott · Sheraton · Aloft',
  'Nike × LeBron',
  'Fluid AI',
  'Tandem Digital',
  'Truearte',
  'Step-Set-Go',
  'Sampoorna',
];

export const STATS = [
  { value: 10, suffix: '+', label: 'years designing' },
  { value: 9, suffix: '', label: 'project collections' },
  { value: 5, suffix: '', label: 'studios and teams' },
];
