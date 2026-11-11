import { lazy, useCallback, useRef } from 'react';
import Contact from '../components/apps/Contact/Contact.jsx';
import Finder from '../components/apps/Finder/Finder.jsx';
import PDFViewer from '../components/apps/PDFViewer/PDFViewer.jsx';
import ProjectViewer from '../components/apps/ProjectViewer/ProjectViewer.jsx';
import { getProjectById } from '../data/projects.js';
import { track } from '../utils/track.js';
import { RIGHT_DOCK_RESERVE, getCenteredWindowPosition } from '../utils/animationOrigin.js';

// The first windows a visitor sees load with the page; the rest (games,
// Terminal, Settings...) when first opened.
const Terminal = lazy(() => import('../components/apps/Terminal/Terminal.jsx'));
const Minesweeper = lazy(() => import('../components/apps/Minesweeper/Minesweeper.jsx'));
const Trash = lazy(() => import('../components/apps/Trash/Trash.jsx'));
const SystemPreferences = lazy(() => import('../components/apps/SystemPreferences/SystemPreferences.jsx'));
const ClaudeFaq = lazy(() => import('../components/apps/ClaudeFaq/ClaudeFaq.jsx'));
const FlappyBird = lazy(() => import('../components/apps/FlappyBird/FlappyBird.jsx'));
const ChromeDino = lazy(() => import('../components/apps/ChromeDino/ChromeDino.jsx'));
const TumbleBlocks = lazy(() => import('../components/apps/TumbleBlocks/TumbleBlocks.jsx'));
const MazeMuncher = lazy(() => import('../components/apps/MazeMuncher/MazeMuncher.jsx'));
const BubbleShooter = lazy(() => import('../components/apps/BubbleShooter/BubbleShooter.jsx'));
const EmptyFolder = lazy(() => import('../components/apps/EmptyFolder/EmptyFolder.jsx'));
const AdobeApp = lazy(() => import('../components/apps/AdobeApp/AdobeApp.jsx'));
const GetInfo = lazy(() => import('../components/apps/GetInfo/GetInfo.jsx'));

const APP_REGISTRY = {
  // About and Contact are one card now: Ken in the Mac's Contacts.
  about: { title: 'Contacts', component: Contact, size: { width: 780, height: 580 } },
  contact: { title: 'Contacts', component: Contact, size: { width: 780, height: 580 } },
  finder: { title: 'Portfolio', component: Finder, size: { width: 920, height: 580 }, roomy: true },
  terminal: { title: 'Terminal', component: Terminal, size: { width: 640, height: 420 } },
  minesweeper: { title: 'Minesweeper', component: Minesweeper, size: { width: 520, height: 580 } },
  pdfviewer: { title: 'Resume', component: PDFViewer, size: { width: 680, height: 560 }, fill: { maxWidth: 900 } },
  projectviewer: { title: 'Project', component: ProjectViewer, size: { width: 920, height: 720 }, fill: true },
  trash: { title: 'Trash', component: Trash, size: { width: 760, height: 460 } },
  claude: { title: 'Ask about Ken', component: ClaudeFaq, size: { width: 720, height: 560 } },
  flappybird: { title: 'Flappy Bird', component: FlappyBird, size: { width: 400, height: 580 } },
  chromedino: { title: 'New Tab', component: ChromeDino, size: { width: 680, height: 320 } },
  tumbleblocks: { title: 'Tetris', component: TumbleBlocks, size: { width: 460, height: 500 } },
  mazemuncher: { title: 'Pac-Man', component: MazeMuncher, size: { width: 420, height: 420 } },
  photoshop: { title: 'Adobe Photoshop 2026', component: AdobeApp, size: { width: 1100, height: 700 }, fill: true, data: { app: 'photoshop' } },
  illustrator: { title: 'Adobe Illustrator 2026', component: AdobeApp, size: { width: 1100, height: 700 }, fill: true, data: { app: 'illustrator' } },
  getinfo: { title: 'Info', component: GetInfo, size: { width: 300, height: 330 } },
  folder: { title: 'untitled folder', component: EmptyFolder, size: { width: 560, height: 360 } },
  bubbleshooter: { title: 'Bubble Shooter', component: BubbleShooter, size: { width: 480, height: 640 } },
  systempreferences: {
    title: 'System Settings',
    component: SystemPreferences,
    size: { width: 820, height: 560 },
  },
};

/** Work windows open big: as much of the screen as fits between the menu bar,
    the Dock and the desktop icons, so nobody squints at the work. */
function roomySize(fallback) {
  if (typeof window === 'undefined') return fallback;
  const maxW = window.innerWidth - RIGHT_DOCK_RESERVE - 32;
  const maxH = window.innerHeight - 28 - 136;
  return {
    width: Math.max(Math.min(fallback.width, maxW), Math.min(1480, maxW)),
    height: Math.max(Math.min(fallback.height, maxH), Math.min(980, maxH)),
  };
}

/** The resume and the projects open filling the screen, from under the menu
    bar to just above the Dock, still a window (it can be sized down). */
const FILL_GAP = 12;
function fillFrame({ maxWidth = Infinity } = {}) {
  const top = 24 + FILL_GAP;
  // Full height; as wide as the screen, or (the resume) as wide as its page.
  const width = Math.min(window.innerWidth - FILL_GAP * 2, maxWidth);
  return {
    size: { width, height: window.innerHeight - top - 104 },
    position: { x: Math.round((window.innerWidth - width) / 2), y: top },
  };
}

export function useAppLauncher(windowManager, achievements) {
  const { windows, openWindow, restoreFromDock, focusWindow, windowCount } = windowManager;
  const { unlock, trackProjectView, trackWindowCount } = achievements;

  const launchApp = useCallback(
    (appId, options = {}) => {
      const config = APP_REGISTRY[appId];
      if (!config) return null;

      // (A window with its own title, like a new folder, is its own window.)
      const existing = windows.find((w) => w.appId === appId && !options.forceNew && (!options.title || w.title === options.title));
      if (existing) {
        focusWindow(existing.id);
        return existing.id;
      }

      let title = options.title ?? config.title;
      let data = options.data ?? config.data ?? null;

      if (appId === 'projectviewer' && options.projectId) {
        const project = getProjectById(options.projectId);
        if (project) {
          title = project.name;
          data = { projectId: options.projectId };
          trackProjectView(options.projectId);
          if (!options.auto) track('project_open', { slug: options.projectId });
        }
      }

      const fill = config.fill && !options.size && typeof window !== 'undefined' ? fillFrame(config.fill === true ? {} : config.fill) : null;
      const size = fill?.size ?? options.size ?? (config.roomy ? roomySize(config.size) : config.size);
      const id = openWindow({
        appId,
        title,
        component: config.component,
        size,
        position: fill?.position ?? (config.roomy ? getCenteredWindowPosition(size) : options.position),
        data,
        animationOrigin: options.animationOrigin ?? null,
      });

      // Windows the site opens itself (options.auto) earn nothing: these are
      // for what a visitor does.
      if (!options.auto) {
        if (appId === 'finder') unlock('explorer');
        if (appId === 'contact') unlock('contact_sent');
        if (appId === 'pdfviewer') unlock('cv_download');
        if (appId === 'trash') unlock('trash_diver');
      }

      if (!options.auto) trackWindowCount(windowCount + 1);

      return id;
    },
    [windows, openWindow, focusWindow, unlock, trackProjectView, trackWindowCount, windowCount]
  );

  // One window per project: opening it again (a double-click, a second
  // click from Best Work) brings the one already open to the front.
  const lastOpen = useRef({ id: null, at: 0 });
  const openProject = useCallback(
    (projectId, options = {}) => {
      const open = windows.find((w) => w.appId === 'projectviewer' && w.data?.projectId === projectId);
      if (open) {
        focusWindow(open.id);
        return open.id;
      }
      // (The second click of a double-click can come before the first window is in the list.)
      const now = performance.now();
      if (lastOpen.current.id === projectId && now - lastOpen.current.at < 600) return null;
      lastOpen.current = { id: projectId, at: now };
      return launchApp('projectviewer', {
        projectId,
        forceNew: true,
        auto: options.auto,
        animationOrigin: options.animationOrigin ?? null,
      });
    },
    [launchApp, windows, focusWindow]
  );

  const launchFromDock = useCallback(
    (appId, options = {}) => {
      const restored = restoreFromDock(appId);
      if (restored) return restored;
      return launchApp(appId, options);
    },
    [restoreFromDock, launchApp]
  );

  return { launchApp, launchFromDock, openProject, APP_REGISTRY };
}
