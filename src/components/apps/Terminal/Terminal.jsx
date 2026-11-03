import { useCallback, useEffect, useRef, useState } from 'react';
import { projects } from '../../../data/projects.js';
import { useOS } from '../../../context/OSContext.jsx';
import styles from './Terminal.module.css';

// A Terminal that behaves like the Mac's: zsh, a home folder with the
// portfolio in it, real-ish commands, tab completion and history. Every
// command listed in `help` works; anything else is "command not found".

const USER = 'ken';
const HOST = 'Kens-MacBook-Pro';
const EMAIL = 'kennethnathanael@gmail.com';
const LINKEDIN = 'linkedin.com/in/kenneth-n-576134103';

// The file system: ~ and ~/Portfolio (one folder per project).
const slugOf = (p) => p.slug;
const FS = {
  '~': ['Portfolio/', 'Resume.pdf', 'about.txt', 'contact.txt', 'skills.txt'],
  '~/Portfolio': projects.map((p) => `${slugOf(p)}/`),
};
const FILES = {
  'about.txt': [
    'Kenneth Nathanael. Designer, Hyderabad, India.',
    'Ten years in brand, campaigns, video and motion, mostly for B2B tech.',
    'Design Lead at Milestone Technologies; co-founded Tandem Digital before that.',
    'Nothing in good design is there by accident.',
  ],
  'contact.txt': [`email     ${EMAIL}`, `linkedin  ${LINKEDIN}`, 'web       kennethnathanael.com'],
  'skills.txt': [
    'creative   creative direction, brand identity, campaigns, motion, video, events, UI/UX, print',
    'leading    studio operations, mentoring, C-suite stakeholders, vendors',
    'tools      Illustrator, Photoshop, After Effects, Premiere Pro, InDesign, Figma, PowerPoint',
    'ai         Claude, ChatGPT, Cursor, Higgsfield, Magnific, Runway, Kling, ElevenLabs',
  ],
};

const HELP = [
  ['ls', 'list the files here'],
  ['cd <folder>', 'go into a folder (cd .. to go back)'],
  ['cat <file>', 'print a file (about.txt, contact.txt, skills.txt)'],
  ['open <name>', 'open a project, Resume.pdf or Portfolio'],
  ['pwd · whoami · date', 'the usual'],
  ['echo <text>', 'say it back'],
  ['history', 'what you typed'],
  ['neofetch', 'this Mac, in a nutshell'],
  ['shoot', 'take a shot'],
  ['sudo hire ken', 'you know you want to'],
  ['clear · exit', 'clear the screen · close the window'],
];
const COMMANDS = ['ls', 'cd', 'cat', 'open', 'pwd', 'whoami', 'date', 'echo', 'history', 'neofetch', 'shoot', 'sudo', 'clear', 'exit', 'help'];

const NEOFETCH_ART = ['  ██╗  ██╗ ', '  ██║ ██╔╝ ', '  █████╔╝  ', '  ██╔═██╗  ', '  ██║  ██╗ ', '  ╚═╝  ╚═╝ '];

const findProject = (raw) => {
  const q = raw.trim().toLowerCase().replace(/\/$/, '');
  return projects.find((p) => p.slug === q || p.name.toLowerCase() === q || p.name.toLowerCase().includes(q) || p.slug.includes(q));
};

const lastLogin = () => {
  const d = new Date(Date.now() - 1000 * 60 * 47);
  const [wd, mo, dd] = d.toDateString().split(' ');
  return `Last login: ${wd} ${mo} ${String(Number(dd)).padStart(2, ' ')} ${d.toLocaleTimeString('en-GB')} on ttys001`;
};

export default function Terminal({ windowId }) {
  const { openProject, closeWindow, launchApp } = useOS();
  const [lines, setLines] = useState(() => [{ text: lastLogin(), cls: 'muted' }]);
  const [cwd, setCwd] = useState('~');
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const outRef = useRef(null);
  const history = useRef([]);
  const histAt = useRef(-1);
  const timers = useRef([]);

  const prompt = (dir) => `${USER}@${HOST} ${dir === '~' ? '~' : dir.split('/').pop()} % `;
  const print = useCallback((text, cls = '') => setLines((l) => [...l, { text, cls }]), []);

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight });
  }, [lines]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  // The surprise: a shot, drawn a frame at a time, from the left into a hoop.
  const shoot = () => {
    const W = 34;
    // Up from the floor to the top of the arc, then down into the rim.
    const arc = (u) => (u < 0.6 ? 5 * ((0.6 - u) / 0.6) ** 2 : 2 * ((u - 0.6) / 0.4) ** 2);
    const hoop = () => {
      const rows = Array.from({ length: 7 }, () => Array(W + 4).fill(' '));
      rows[0][W + 2] = '|';
      rows[1][W + 2] = '|';
      rows[2][W - 2] = '\\';
      rows[2][W - 1] = '_';
      rows[2][W] = '_';
      rows[2][W + 1] = '/';
      rows[3][W - 1] = '\\';
      rows[3][W] = '/';
      return rows;
    };
    const frames = [];
    for (let x = 0; x <= W; x += 2) {
      const rows = hoop();
      rows[Math.round(arc(x / W))][Math.min(x, W - 1)] = 'o';
      frames.push(rows);
    }
    // Through the net and out the bottom.
    [4, 5, 6].forEach((y) => {
      const rows = hoop();
      rows[y][W - 1] = 'o';
      frames.push(rows);
    });
    const id = `shot-${Date.now()}`;
    frames.forEach((f, i) =>
      later(() => setLines((l) => [...l.filter((x) => x.id !== id), { id, text: f.map((r) => r.join('')).join('\n'), cls: 'art' }]), i * 70)
    );
    later(() => print('swish. nothing but net.', 'ok'), frames.length * 70 + 120);
  };

  const run = useCallback(
    (raw) => {
      const text = raw.trim();
      setLines((l) => [...l, { text: prompt(cwd) + raw, cls: 'in' }]);
      if (!text) return;
      const [cmd, ...rest] = text.split(/\s+/);
      const arg = rest.join(' ');
      switch (cmd) {
        case 'help':
          HELP.forEach(([c, d]) => print(`${c.padEnd(22)}${d}`));
          break;
        case 'ls': {
          const dir = arg ? (arg.replace(/\/$/, '') === 'Portfolio' ? '~/Portfolio' : null) : cwd;
          if (!dir || !FS[dir]) {
            print(`ls: ${arg}: No such file or directory`, 'err');
            break;
          }
          print(FS[dir].join('    '));
          break;
        }
        case 'cd': {
          const to = arg.replace(/\/$/, '');
          if (!to || to === '~' || to === '..') setCwd('~');
          else if (cwd === '~' && to === 'Portfolio') setCwd('~/Portfolio');
          else if (cwd === '~/Portfolio' && findProject(to)) print(`cd: ${to}: it's a project. try: open ${to}`, 'muted');
          else print(`cd: no such file or directory: ${to}`, 'err');
          break;
        }
        case 'cat': {
          const f = FILES[arg];
          if (cwd === '~' && f) f.forEach((ln) => print(ln));
          else print(`cat: ${arg || ''}: No such file or directory`, 'err');
          break;
        }
        case 'open': {
          const a = arg.replace(/\/$/, '');
          if (!a) print('usage: open <name>', 'err');
          else if (/^resume(\.pdf)?$/i.test(a)) launchApp('pdfviewer');
          else if (/^portfolio$/i.test(a) || a === '.') launchApp('finder');
          else {
            const p = findProject(a);
            if (p) openProject(p.id);
            else print(`The file ${a} does not exist.`, 'err');
          }
          break;
        }
        case 'pwd':
          print(cwd === '~' ? `/Users/${USER}` : `/Users/${USER}/Portfolio`);
          break;
        case 'whoami':
          print(USER);
          break;
        case 'date':
          print(new Date().toString().replace(/ GMT.*$/, ''));
          break;
        case 'echo':
          print(arg);
          break;
        case 'history':
          history.current.forEach((h, i) => print(`${String(i + 1).padStart(4)}  ${h}`));
          break;
        case 'neofetch': {
          const info = [
            `${USER}@${HOST}`,
            '-------------------------',
            'OS: KenOS 26 (Brand Edition)',
            'Host: Kenneth Nathanael, Designer',
            'Uptime: 10 years',
            'Shell: zsh, and a lot of Illustrator',
            `Packages: ${projects.length} projects`,
            'Location: Hyderabad, India',
            'Resolution: pixel-perfect',
            'Status: open to remote and relocation',
          ];
          info.forEach((ln, i) => print(`${NEOFETCH_ART[i] ?? ' '.repeat(11)}  ${ln}`, i === 0 ? 'ok' : ''));
          break;
        }
        case 'shoot':
          shoot();
          break;
        case 'sudo':
          if (/^hire\s+ken/i.test(arg)) {
            print('Password:', 'muted');
            later(() => print('********', 'muted'), 500);
            later(() => print('access granted. opening the brief…', 'ok'), 1000);
            later(() => window.dispatchEvent(new CustomEvent('ken:brief')), 1500);
          } else if (arg) print(`${USER} is not in the sudoers file. This incident will be reported.`, 'err');
          else print('usage: sudo <command>', 'err');
          break;
        case 'clear':
          setLines([]);
          break;
        case 'exit':
          print('[Process completed]', 'muted');
          later(() => windowId && closeWindow(windowId), 400);
          break;
        default:
          print(`zsh: command not found: ${cmd}`, 'err');
          if (history.current.length < 2) print("type 'help' to see what's here", 'muted');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cwd, print, openProject, launchApp, closeWindow, windowId]
  );

  const onSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      history.current.push(input.trim());
      histAt.current = history.current.length;
    }
    run(input);
    setInput('');
  };

  const onKeyDown = (e) => {
    const h = history.current;
    if (e.key === 'ArrowUp' && h.length) {
      e.preventDefault();
      histAt.current = Math.max(0, histAt.current - 1);
      setInput(h[histAt.current]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      histAt.current = Math.min(h.length, histAt.current + 1);
      setInput(h[histAt.current] ?? '');
    } else if (e.key === 'Tab') {
      // Completion: a command first, then a file or project.
      e.preventDefault();
      const parts = input.split(' ');
      const word = parts[parts.length - 1];
      const pool = parts.length === 1 ? COMMANDS : FS[cwd] ?? [];
      const hits = pool.filter((x) => x.startsWith(word));
      if (hits.length === 1) setInput([...parts.slice(0, -1), hits[0]].join(' '));
      else if (hits.length > 1) {
        setLines((l) => [...l, { text: prompt(cwd) + input, cls: 'in' }, { text: hits.join('    ') }]);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div className={styles.terminal} data-app="terminal" onClick={() => inputRef.current?.focus()} role="presentation">
      <div ref={outRef} className={styles.output}>
        {lines.map((l, i) => (
          <div key={l.id ?? i} className={`${styles.line} ${l.cls ? styles[l.cls] : ''}`}>
            {l.text}
          </div>
        ))}
        <form className={styles.inputRow} onSubmit={onSubmit}>
          <span className={styles.in}>{prompt(cwd)}</span>
          <input
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label="Terminal input"
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}
