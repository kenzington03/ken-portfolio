import { projects, getProjectCoverUrl } from '../../data/projects.js';
import { HOME_APPS } from '../IPhoneHome/appData.jsx';
import { BOOKING_URL, EMAIL, WHATSAPP } from '../Brief/briefData.js';
import { INSTAGRAM, LINKEDIN } from '../../data/links.js';

/* iOS 26 home screen content: two pages you swipe between, and a dock.
   Apple's own icons for the standard apps (from the Figma kit,
   public/assets/ios26/icons), our own tiles for the rest (icons.jsx).

   What a tap does:
     appKey  → opens that app (AppSheet knows the content for each key)
     action  → 'book' opens the booking page, 'tel' dials
     folder  → 'work' | 'play' opens that folder */

export const ICON = (name) => `/assets/ios26/icons/${name}.png`;

export const HOME_PAGES = [
  [
    { id: 'about', label: 'About', custom: 'contacts', appKey: 'about' },
    { id: 'resume', label: 'Resume', icon: 'notes', appKey: 'resume' },
    { id: 'design', label: 'Get a Design', custom: 'design', appKey: 'brief' },
    { id: 'contact', label: 'Contact', icon: 'mail', appKey: 'contact', badge: 1 },
    { id: 'work', label: 'Work', folder: 'work' },
    { id: 'play', label: 'Play', folder: 'play' },
    { id: 'calendar', label: 'Calendar', live: 'calendar', appKey: 'calendar' },
    { id: 'photos', label: 'Photos', icon: 'photos', appKey: 'photos' },
    { id: 'camera', label: 'Camera', icon: 'camera', appKey: 'camera' },
    { id: 'claude', label: 'Claude', custom: 'claude', appKey: 'claude' },
    { id: 'instagram', label: 'Instagram', custom: 'instagram', appKey: 'link-instagram' },
    { id: 'linkedin', label: 'LinkedIn', custom: 'linkedin', appKey: 'link-linkedin' },
    { id: 'whatsapp', label: 'WhatsApp', custom: 'whatsapp', appKey: 'link-whatsapp' },
  ],
  [
    { id: 'clock', label: 'Clock', icon: 'clock', appKey: 'clock' },
    { id: 'maps', label: 'Maps', icon: 'maps', appKey: 'link-maps' },
    { id: 'settings', label: 'Settings', icon: 'settings', appKey: 'settings' },
    { id: 'tips', label: 'Tips', custom: 'tips', appKey: 'tips' },
  ],
];
export const HOME_PAGE_1 = HOME_PAGES[0];

export const DOCK = [
  { id: 'phone', label: 'Phone', icon: 'phone', action: 'tel' },
  { id: 'safari', label: 'Safari', icon: 'safari', appKey: 'safari' },
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

/* Apps that are really a link out (a profile, a chat, a place): a small
   in-phone screen with a clear way through. */
export const LINK_APPS = {
  'link-instagram': { name: 'Instagram', custom: 'instagram', handle: '@nathanaelkenneth', url: INSTAGRAM, cta: 'Open Instagram', line: 'Follow along: the work, and the odd basketball.' },
  'link-linkedin': { name: 'LinkedIn', custom: 'linkedin', handle: 'Kenneth Nathanael', url: LINKEDIN, cta: 'Open LinkedIn', line: 'Ten-plus years, role by role.' },
  'link-whatsapp': { name: 'WhatsApp', custom: 'whatsapp', handle: `+${WHATSAPP.replace(/^(\d{2})(\d{5})(\d+)$/, '$1 $2 $3')}`, url: `https://wa.me/${WHATSAPP}`, cta: 'Message on WhatsApp', line: 'The quickest way to reach Ken.' },
  'link-maps': { name: 'Maps', icon: 'maps', handle: 'Hyderabad, India', url: 'https://www.google.com/maps/search/?api=1&query=Hyderabad%2C+India', cta: 'Open in Maps', line: 'Where Ken is based.' },
};

export { EMAIL, INSTAGRAM, LINKEDIN };

/* Lock screen notifications. They are the site talking: tap one and it opens
   the app it came from. */
export const NOTIFICATIONS = [
  { id: 'n1', title: 'Messages', body: 'Ken: Thanks for stopping by.', time: 'now', icon: 'messages', appKey: 'imessage' },
  { id: 'n2', title: 'Calendar', body: 'Want to talk? Book a call.', time: '1m ago', live: 'calendar', action: 'book' },
  { id: 'n3', title: 'Photos', body: 'The work, one tap away.', time: '2m ago', icon: 'photos', folder: 'work', stack: true },
];
