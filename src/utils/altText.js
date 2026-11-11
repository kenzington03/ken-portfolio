// Alt text for a piece of work, from where it lives: the project, the client
// or section folder, and the file's own name ("Liberty Ladders social post:
// platform ladder guide"). ALT (by path) takes over for any piece that has
// a written description; add them there as they're written and approved.

import { projects } from '../data/projects.js';

const ALT = {};

const FOLDER_NAMES = Object.fromEntries(projects.map((p) => [p.folder, p.name]));
FOLDER_NAMES['10-kudos'] = 'Kudos';

const words = (s) =>
  s
    // "04-big-mamas__bigmamas-instagram-grid-9posts" -> after the "__"
    .replace(/^.*__/, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/^\d+[-_ ]+/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** "Project: Section, piece" for a /assets/projects/... path. */
export function altFor(src) {
  if (!src) return '';
  const path = decodeURI(src.split('?')[0]);
  if (ALT[path]) return ALT[path];
  const m = path.match(/\/assets\/projects\/([^/]+)\/(.+)$/);
  if (!m) return '';
  const project = FOLDER_NAMES[m[1]] || words(m[1]);
  const parts = m[2].split('/');
  const file = words(parts.pop());
  const section = parts.map(words).filter((s) => s && s.toLowerCase() !== 'other').join(', ');
  // A numbered file ("03.jpg") says nothing: name the section instead.
  const piece = /^\d*$/.test(file) ? (file ? `piece ${Number(file)}` : '') : file;
  return [project, [section, piece].filter(Boolean).join(', ')].filter(Boolean).join(': ');
}
