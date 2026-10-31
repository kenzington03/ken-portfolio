// The brief: pick what you need, in plain words (no jargon: nobody should
// have to know what "brand" or "motion" covers), say what it's for, and the
// message to Ken writes itself.

export const EMAIL = 'kennethnathanael@gmail.com';
// Same number as the contact card. WhatsApp opens on it with the message typed.
export const WHATSAPP = '917204662258';
// A short call, booked straight into Ken's calendar (his Cal.com link).
// Empty: the brief offers no call.
export const BOOKING_URL = '';

// What people come to Ken for, as they would say it. `hint` is what it
// covers, in a line; `say` how it reads in the message; `short` in a subject
// line; `icon` a small line drawing (24 x 24).
export const NEEDS = [
  { id: 'logo', name: 'A logo', hint: 'The mark people know you by', say: 'a logo', short: 'Logo', icon: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z' },
  { id: 'look', name: 'A whole new look', hint: 'Logo, colours, fonts and how it all fits', say: 'a whole new look for the brand', short: 'Brand look', icon: 'M12 3a9 9 0 100 18c1.2 0 1.6-.9 1.2-1.8-.5-1-.1-2.2 1.2-2.2H17a4 4 0 004-4c0-5-4-10-9-10zM7.5 12.5h.01M9.5 8h.01M14.5 8h.01' },
  { id: 'web', name: 'A website', hint: 'From a one pager to a full site', say: 'a website', short: 'Website', icon: 'M3 5h18v14H3zM3 9h18M6 7h.01M8.5 7h.01' },
  { id: 'pack', name: 'Packaging or print', hint: 'Boxes, labels, menus, merch, signs', say: 'packaging and print', short: 'Packaging', icon: 'M3 7.5L12 3l9 4.5v9L12 21l-9-4.5zM3 7.5L12 12l9-4.5M12 12v9' },
  { id: 'social', name: 'Social posts and ads', hint: 'Posts, stories and ads that look like you', say: 'social posts and ads', short: 'Social', icon: 'M7 2.5h10a1.5 1.5 0 011.5 1.5v16a1.5 1.5 0 01-1.5 1.5H7A1.5 1.5 0 015.5 20V4A1.5 1.5 0 017 2.5zM10 18.5h4' },
  { id: 'launch', name: 'A launch', hint: 'Everything for one big moment: the idea, ads, event, posts', say: 'everything for a launch', short: 'Launch', icon: 'M4 14l3 6 2-1-1.5-4.5L16 18V6L7.5 9.5H4zM19 9.5v5' },
  { id: 'video', name: 'A video', hint: 'Shot, edited or animated', say: 'a video', short: 'Video', icon: 'M3 6h13v12H3zM16 10l5-3v10l-5-3' },
  { id: 'anim', name: 'Things that move', hint: 'Animated logos, explainers, moving posts', say: 'some animation', short: 'Animation', icon: 'M4 18c3-9 6-12 8-12s3 4 2 6-4 1-3-2 4-6 9-6M4 18h.01' },
  { id: 'deck', name: 'A pitch deck', hint: 'Slides that win the room', say: 'a pitch deck', short: 'Deck', icon: 'M3 4h18v12H3zM12 16v4M8 20h8' },
  { id: 'event', name: 'Event visuals', hint: 'Stage, screens, banners, passes', say: 'event visuals', short: 'Event', icon: 'M4 7h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4zM10 7v10' },
  { id: 'ai', name: 'AI images or video', hint: 'Product shots and content, made fast with AI', say: 'AI images or video', short: 'AI content', icon: 'M5 19L15 9M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 11l.6 1.4L21 13l-1.4.6L19 15l-.6-1.4L17 13l1.4-.6z' },
  { id: 'unsure', name: 'Not sure yet', hint: 'Tell me the problem and we\'ll work it out', say: null, short: null, icon: 'M9 9a3 3 0 115 2.2c-1.2.8-2 1.4-2 2.8M12 18h.01' },
];

/** "a, b and c" */
export const joinList = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** What they asked for, in words. */
export function asks(picked) {
  return NEEDS.filter((n) => picked.includes(n.id) && n.say).map((n) => n.say);
}

export function letterText({ picked, about, name }) {
  const says = asks(picked);
  const unsure = picked.includes('unsure');
  const lines = ['Hey Ken,'];
  if (says.length) lines.push(`I need ${joinList(says)}${about ? ` for ${about}` : ''}.`);
  else if (unsure) lines.push(about ? `I'm working on ${about} and not sure yet what I need. Can we talk?` : "I'm not sure yet what I need. Can we talk?");
  else lines.push(about ? `I'm working on ${about}. Can we talk?` : 'I have a project in mind. Can we talk?');
  if (says.length && unsure) lines.push('Maybe more, happy to talk it through.');
  lines.push(name ? `Thanks, ${name}` : 'Thanks!');
  return lines.join('\n');
}

export function subjectLine(picked) {
  const names = NEEDS.filter((n) => picked.includes(n.id) && n.short).map((n) => n.short);
  return names.length ? `Project: ${names.join(', ')}` : 'Hello from your portfolio';
}
