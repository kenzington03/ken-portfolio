// The brief: pick what you need from Ken's three (src/data/services.js),
// say what it's for, and the message to Ken writes itself.

import { SERVICES } from '../../data/services.js';

export const EMAIL = 'kennethnathanael@gmail.com';
// Same number as the contact card. WhatsApp opens on it with the message typed.
export const WHATSAPP = '917204662258';

// How a whole category reads when nothing finer is picked inside it.
const ASK = { brand: 'help with my brand', campaigns: 'a campaign', motion: 'video work' };

const ITEMS = SERVICES.flatMap((s) => s.items.map((it) => ({ ...it, cat: s.id })));

/** "a, b and c" */
export const joinList = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** What they asked for, in words: the items picked, or the category itself. */
export function asks(cats, items) {
  return SERVICES.filter((s) => cats.includes(s.id)).flatMap((s) => {
    const inside = ITEMS.filter((it) => it.cat === s.id && items.includes(it.id)).map((it) => it.say);
    return inside.length ? inside : [ASK[s.id]];
  });
}

export function letterText({ cats, items, about, name }) {
  const says = asks(cats, items);
  const lines = ['Hey Ken,'];
  if (says.length) lines.push(`I need ${joinList(says)}${about ? ` for ${about}` : ''}.`);
  else lines.push(about ? `I'm working on ${about}. Can we talk?` : 'I have a project in mind. Can we talk?');
  lines.push(name ? `Thanks, ${name}` : 'Thanks!');
  return lines.join('\n');
}

export function subjectLine(cats) {
  const names = SERVICES.filter((s) => cats.includes(s.id)).map((s) => s.name);
  return names.length ? `Project: ${names.join(', ')}` : 'Hello from your portfolio';
}
