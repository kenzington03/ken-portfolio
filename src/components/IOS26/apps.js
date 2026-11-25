import { projects, getProjectCoverUrl } from '../../data/projects.js';
import { HOME_APPS } from '../IPhoneHome/appData.jsx';
import { BOOKING_URL, WHATSAPP } from '../Brief/briefData.js';

/* iOS 26 home screen content. Apple's own icons for the standard apps (from
   the Figma kit, public/assets/ios26/icons), the portfolio's own tiles for
   About / Brief / Resume (icons.jsx), and two folders: the work, and play.

   Each entry says what a tap does:
     appKey  → opens that app (AppSheet knows the content for each key)
     action  → 'book' opens the booking page, 'tel' dials
     folder  → 'work' | 'play' opens that folder */

export const ICON = (name) => `/assets/ios26/icons/${name}.png`;

export const HOME_PAGE_1 = [
  { id: 'about', label: 'About', custom: 'about', appKey: 'about' },
  { id: 'brief', label: 'Brief', custom: 'brief', appKey: 'brief' },
  { id: 'resume', label: 'Resume', custom: 'resume', appKey: 'resume' },
  { id: 'contact', label: 'Contact', icon: 'mail', appKey: 'contact', badge: 1 },
  { id: 'work', label: 'Work', folder: 'work' },
  { id: 'play', label: 'Play', folder: 'play' },
  { id: 'book', label: 'Book a Call', icon: 'calendar', action: 'book' },
];

export const DOCK = [
  { id: 'phone', label: 'Phone', icon: 'phone', action: 'tel' },
  { id: 'safari', label: 'Safari', icon: 'safari', appKey: 'chrome' },
  { id: 'messages', label: 'Messages', icon: 'messages', appKey: 'imessage' },
  { id: 'music', label: 'Music', icon: 'music', appKey: 'spotify' },
];

/** What is inside each folder. Work: every project, with its own cover. */
export const FOLDERS = {
  work: {
    title: 'Work',
    apps: projects.map((p) => ({
      id: `project-${p.id}`,
      label: p.name,
      appKey: `project-${p.slug}`,
      cover: getProjectCoverUrl(p),
    })),
  },
  play: {
    title: 'Play',
    apps: (HOME_APPS.find((a) => a.id === 'games')?.apps || []).map((a) => ({
      id: a.id,
      label: a.label,
      appKey: a.appKey,
      imgSrc: a.imgSrc,
      style: a.style,
      glyph: a.icon,
    })),
  },
};

/** The first nine tiles show on the folder's face, as on iOS. */
export const folderFace = (key) => FOLDERS[key].apps.slice(0, 9);

export const TEL = `tel:+${WHATSAPP}`;
export { BOOKING_URL };

/* Lock screen notifications. They are the site talking: tap one and it opens
   the app it came from. */
export const NOTIFICATIONS = [
  { id: 'n1', title: 'Messages', body: 'Ken: Thanks for stopping by.', time: 'now', icon: 'messages', appKey: 'imessage' },
  { id: 'n2', title: 'Calendar', body: 'Want to talk? Book a call.', time: '1m ago', icon: 'calendar', action: 'book' },
  { id: 'n3', title: 'Photos', body: 'The work, one tap away.', time: '2m ago', icon: 'photos', folder: 'work', stack: true },
];
