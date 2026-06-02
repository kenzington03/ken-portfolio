import { projects } from '../../../data/projects.js';

export const FINDER_TREE = {
  '/': { name: 'Desktop', children: ['About', 'Work', 'Experience'] },
  '/About': { name: 'About', children: ['bio.txt', 'skills.txt'] },
  '/Work': {
    name: 'Work',
    children: projects.map((p) => p.id),
    projectFolders: true,
  },
};

export function getPathSegments(path) {
  if (path === '/') return [];
  return path.split('/').filter(Boolean);
}

export function getItemsForPath(path) {
  const node = FINDER_TREE[path];
  if (!node) return [];
  return node.children.map((id) => {
    if (node.projectFolders) {
      const p = projects.find((pr) => pr.id === id);
      return { id, label: p?.name || id, type: 'project' };
    }
    if (path === '/About') return { id, label: id, type: 'file' };
    return { id, label: id, type: 'folder' };
  });
}
