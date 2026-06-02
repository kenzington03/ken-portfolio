import { useCallback, useRef, useState } from 'react';
import { projects } from '../../../data/projects.js';
import { useOS } from '../../../context/OSContext.jsx';
import styles from './Terminal.module.css';

const PROMPT = 'kenneth@portfolio-os ~ % ';

export default function Terminal() {
  const { launchApp, openProject, trackTerminalCommand, unlock } = useOS();
  const [lines, setLines] = useState([
    { type: 'out', text: 'Kenneth OS Terminal — type "help" for commands.' },
  ]);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const print = useCallback((text, className = '') => {
    setLines((prev) => [...prev, { type: 'out', text, className }]);
  }, []);

  const runCommand = useCallback(
    (raw) => {
      const cmd = raw.trim().toLowerCase();
      if (!cmd) return;

      setLines((prev) => [...prev, { type: 'in', text: PROMPT + raw }]);
      trackTerminalCommand(cmd.split(/\s+/)[0]);

      switch (cmd) {
        case 'help':
          print(
            `Available commands:
  help          — show this message
  about         — open About app
  projects      — list all projects
  open <id>     — open project by id
  ls            — list project ids
  whoami        — who is Kenneth
  clear         — clear terminal
  cv            — open CV.pdf
  contact       — open Contact app
  minesweeper   — launch Minesweeper
  easter_egg    — ???`
          );
          break;
        case 'about':
          launchApp('about');
          print('Opening About…', styles.success);
          break;
        case 'projects':
          projects.forEach((p) => print(`  ${p.id} — ${p.name} (${p.year})`));
          break;
        case 'ls':
          print(projects.map((p) => p.id).join('  '));
          break;
        case 'whoami':
          print('kenneth — Design Lead · portfolio-os');
          break;
        case 'clear':
          setLines([]);
          break;
        case 'cv':
          launchApp('pdfviewer');
          print('Opening CV.pdf…', styles.success);
          break;
        case 'contact':
          launchApp('contact');
          print('Opening Contact…', styles.success);
          break;
        case 'minesweeper':
          launchApp('minesweeper');
          print('Launching Minesweeper…', styles.success);
          break;
        case 'easter_egg':
          unlock('easter_egg');
          print('✨ You found the hidden layer. Design is in the details.', styles.success);
          break;
        default:
          if (cmd.startsWith('open ')) {
            const id = cmd.slice(5).trim();
            const project = projects.find((p) => p.id === id);
            if (project) {
              openProject(id);
              print(`Opening ${project.name}…`, styles.success);
            } else {
              print(`Project not found: ${id}`, styles.error);
            }
          } else {
            print(`Command not found: ${raw}. Type "help".`, styles.error);
          }
      }
    },
    [print, launchApp, openProject, trackTerminalCommand, unlock]
  );

  const onSubmit = (e) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    historyRef.current.push(value);
    historyIndexRef.current = historyRef.current.length;
    runCommand(value);
    setInput('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const hist = historyRef.current;
      if (!hist.length) return;
      const idx = Math.max(0, historyIndexRef.current - 1);
      historyIndexRef.current = idx;
      setInput(hist[idx]);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const hist = historyRef.current;
      const idx = Math.min(hist.length, historyIndexRef.current + 1);
      historyIndexRef.current = idx;
      setInput(hist[idx] ?? '');
    }
  };

  return (
    <div
      className={styles.terminal}
      onClick={() => inputRef.current?.focus()}
      role="presentation"
    >
      <div className={styles.output}>
        {lines.map((line, i) => (
          <div
            key={i}
            className={`${styles.line} ${line.className ?? ''} ${
              line.type === 'in' ? styles.prompt : ''
            }`}
          >
            {line.text}
          </div>
        ))}
      </div>
      <form className={styles.inputRow} onSubmit={onSubmit}>
        <span className={styles.prompt}>{PROMPT}</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          aria-label="Terminal input"
        />
      </form>
    </div>
  );
}
