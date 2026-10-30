// Everything Ken does, in three. One list for the whole site: the Mac room
// shows it, the brief asks from it, the phone page lists it. `say` is how an
// item reads inside the brief's message; `blurb` is the category in a line.
// `work` is the Portfolio (Finder) category that shows it.

export const SERVICES = [
  {
    id: 'brand',
    name: 'Brand',
    blurb: 'Who you are, made visible.',
    work: 'brand-identity',
    items: [
      { id: 'identity', label: 'Identity systems', say: 'a brand identity' },
      { id: 'logo', label: 'Logos', say: 'a logo' },
      { id: 'guidelines', label: 'Brand guidelines', say: 'brand guidelines' },
      { id: 'naming', label: 'Naming and strategy', say: 'naming and strategy' },
      { id: 'packaging', label: 'Packaging, print and merch', say: 'packaging and print' },
      { id: 'web', label: 'Websites and UI', say: 'a website' },
    ],
  },
  {
    id: 'campaigns',
    name: 'Campaigns',
    blurb: 'Getting the right people to notice.',
    work: 'campaigns',
    items: [
      { id: 'strategy', label: 'Campaign strategy', say: 'a campaign' },
      { id: 'direction', label: 'Creative direction', say: 'creative direction' },
      { id: 'team', label: 'Leading creative teams', say: 'someone to lead the creative team' },
      { id: 'social', label: 'Social and ads', say: 'social and ads' },
      { id: 'event', label: 'Event visuals', say: 'event visuals' },
      { id: 'deck', label: 'Pitch decks', say: 'a pitch deck' },
    ],
  },
  {
    id: 'motion',
    name: 'Motion',
    blurb: 'Stories that move, on every screen.',
    work: 'motion',
    items: [
      { id: 'shoot', label: 'Video shoots', say: 'a video shoot' },
      { id: 'edit', label: 'Video editing', say: 'video editing' },
      { id: 'mograph', label: 'Motion graphics', say: 'motion graphics' },
      { id: 'aivideo', label: 'AI video', say: 'AI video' },
      { id: 'aishots', label: 'AI product shots', say: 'AI product shots' },
      { id: 'aiscale', label: 'AI content at scale', say: 'AI content at scale' },
    ],
  },
];
