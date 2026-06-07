import { useCallback } from 'react';
import About from '../components/apps/About/About.jsx';
import Contact from '../components/apps/Contact/Contact.jsx';
import Finder from '../components/apps/Finder/Finder.jsx';
import Terminal from '../components/apps/Terminal/Terminal.jsx';
import Minesweeper from '../components/apps/Minesweeper/Minesweeper.jsx';
import PDFViewer from '../components/apps/PDFViewer/PDFViewer.jsx';
import ProjectViewer from '../components/apps/ProjectViewer/ProjectViewer.jsx';
import Trash from '../components/apps/Trash/Trash.jsx';
import SystemPreferences from '../components/apps/SystemPreferences/SystemPreferences.jsx';
import ClaudeFaq from '../components/apps/ClaudeFaq/ClaudeFaq.jsx';
import FlappyBird from '../components/apps/FlappyBird/FlappyBird.jsx';
import ChromeDino from '../components/apps/ChromeDino/ChromeDino.jsx';
import { getProjectById } from '../data/projects.js';

const APP_REGISTRY = {
  about: { title: 'About Ken', component: About, size: { width: 820, height: 520 } },
  contact: { title: 'Contact', component: Contact, size: { width: 480, height: 620 } },
  finder: { title: 'Work', component: Finder, size: { width: 920, height: 580 } },
  terminal: { title: 'Terminal', component: Terminal, size: { width: 640, height: 420 } },
  minesweeper: { title: 'Minesweeper', component: Minesweeper, size: { width: 520, height: 580 } },
  pdfviewer: { title: 'Resume', component: PDFViewer, size: { width: 680, height: 560 } },
  projectviewer: { title: 'Project', component: ProjectViewer, size: { width: 920, height: 720 } },
  trash: { title: 'Trash', component: Trash, size: { width: 520, height: 380 } },
  claude: { title: 'Claude — Ask me about Ken', component: ClaudeFaq, size: { width: 720, height: 560 } },
  flappybird: { title: 'Flappy Bird', component: FlappyBird, size: { width: 400, height: 580 } },
  chromedino: { title: 'New Tab', component: ChromeDino, size: { width: 680, height: 320 } },
  systempreferences: {
    title: 'System Preferences',
    component: SystemPreferences,
    size: { width: 560, height: 420 },
  },
};

export function useAppLauncher(windowManager, achievements) {
  const { windows, openWindow, restoreFromDock, focusWindow, windowCount } = windowManager;
  const { unlock, trackProjectView, trackWindowCount } = achievements;

  const launchApp = useCallback(
    (appId, options = {}) => {
      const config = APP_REGISTRY[appId];
      if (!config) return null;

      const existing = windows.find((w) => w.appId === appId && !options.forceNew);
      if (existing) {
        focusWindow(existing.id);
        return existing.id;
      }

      let title = config.title;
      let data = options.data ?? null;

      if (appId === 'projectviewer' && options.projectId) {
        const project = getProjectById(options.projectId);
        if (project) {
          title = project.name;
          data = { projectId: options.projectId };
          trackProjectView(options.projectId);
        }
      }

      const id = openWindow({
        appId,
        title,
        component: config.component,
        size: options.size ?? config.size,
        position: options.position,
        data,
        animationOrigin: options.animationOrigin ?? null,
      });

      if (appId === 'finder') unlock('explorer');
      if (appId === 'contact') unlock('contact_sent');
      if (appId === 'pdfviewer') unlock('cv_download');
      if (appId === 'trash') unlock('trash_diver');

      trackWindowCount(windowCount + 1);

      return id;
    },
    [windows, openWindow, focusWindow, unlock, trackProjectView, trackWindowCount, windowCount]
  );

  const openProject = useCallback(
    (projectId, options = {}) =>
      launchApp('projectviewer', {
        projectId,
        forceNew: true,
        animationOrigin: options.animationOrigin ?? null,
      }),
    [launchApp]
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
