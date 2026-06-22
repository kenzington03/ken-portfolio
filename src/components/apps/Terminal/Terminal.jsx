import { useCallback, useRef, useState } from 'react';
import { projects } from '../../../data/projects.js';
import { getTagLabel } from '../../../data/tags.js';
import { triggerConfetti } from '../../../utils/confetti.js';
import { useOS } from '../../../context/OSContext.jsx';
import styles from './Terminal.module.css';

const PROMPT = 'kenneth@portfolio-os ~ % ';

const COMMANDS = [
  ['help', 'shows command list in a styled table'],
  ['ls', 'lists all projects with a short tag line each'],
  ['open [name]', 'opens that project (fuzzy match)'],
  ['whoami', "prints Ken's bio in a fun way"],
  ['skills', 'animated list of tools with ASCII bar ratings'],
  ['contact', 'shows email + LinkedIn + a one-liner'],
  ['vibe', 'prints current mood/status'],
  ['play', 'triggers the music player to play'],
  ['hire', 'key facts for potential clients'],
  ['???', 'surprise easter egg'],
  ['pet', 'your desktop buddy — click them on the fun zone'],
  ['clear', 'clears terminal'],
];

const SKILL_RATINGS = [
  ['Illustrator', 9],
  ['After Effects', 9],
  ['Premiere Pro', 8],
  ['Photoshop', 8],
  ['Figma', 8],
  ['Cinema 4D', 7],
  ['Brand Systems', 9],
  ['Motion Design', 9],
];

function findProjectByName(raw) {
  const q = raw.trim().toLowerCase();
  return projects.find(
    (p) =>
      p.name.toLowerCase() === q ||
      p.slug.toLowerCase() === q ||
      p.slug.replace(/-/g, ' ').includes(q) ||
      p.name.toLowerCase().includes(q)
  );
}

function skillBar(name, rating, max = 10) {
  const filled = Math.round(rating);
  return `${name.padEnd(18)} ${'█'.repeat(filled)}${'░'.repeat(max - filled)}  ${rating}/10`;
}

export default function Terminal({ windowId }) {
  const { openProject, closeWindow, play: playMusic, petVisible, showPet } = useOS();
  const [lines, setLines] = useState(() => [
    { type: 'out', text: "Kenneth's Portfolio OS v1.0" },
    { type: 'out', text: '' },
    { type: 'helpGrid', rows: COMMANDS },
    { type: 'out', text: '' },
  ]);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const print = useCallback((text, className = '') => {
    setLines((prev) => [...prev, { type: 'out', text, className }]);
  }, []);

  const printHelp = useCallback(() => {
    setLines((prev) => [...prev, { type: 'helpGrid', rows: COMMANDS }]);
  }, []);

  const runCommand = useCallback(
    (raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      const cmdLower = trimmed.toLowerCase();
      const cmd = cmdLower.split(/\s+/)[0];
      const spaceIdx = trimmed.indexOf(' ');
      const argRaw = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1).trim();

      setLines((prev) => [...prev, { type: 'in', text: PROMPT + raw }]);

      switch (cmd) {
        case 'help':
          printHelp();
          break;
        case 'clear':
          setLines([]);
          break;
        case 'whoami':
          print('kenneth nathanael — design lead @ milestone technologies');
          print('10 years turning briefs into brands, campaigns, and motion.');
          print('currently: shipping pixels from hyderabad, india ☕');
          break;
        case 'ls':
          projects.forEach((p) => {
            const tags = (p.tags ?? []).slice(0, 2).map(getTagLabel).join(', ');
            print(`  ${p.name.padEnd(28)} ${tags || p.category}`);
          });
          break;
        case 'open': {
          if (!argRaw) {
            print('usage: open [project name]', styles.error);
            break;
          }
          const project = findProjectByName(argRaw);
          if (project) {
            if (windowId) closeWindow(windowId);
            openProject(project.id);
          } else {
            print(`project not found: ${argRaw}`, styles.error);
          }
          break;
        }
        case 'skills':
          SKILL_RATINGS.forEach(([name, rating], i) => {
            setTimeout(() => print(skillBar(name, rating), styles.skill), i * 120);
          });
          break;
        case 'contact':
          print('email: hello@kennethnathanael.com');
          print('linkedin: linkedin.com/in/kenneth-n-576134103');
          print("one-liner: let's make something worth double-clicking.");
          break;
        case 'vibe':
          print('current status: caffeinated, creative, and mildly obsessed with kerning.');
          break;
        case 'play':
          if (typeof playMusic === 'function') {
            playMusic();
            print('▶ music player engaged — enjoy the vibes.', styles.success);
          } else {
            print('music player is currently offline.', styles.error);
          }
          break;
        case 'hire':
          print('bold of you. here\'s what you need to know:');
          print('  • design lead @ milestone technologies');
          print('  • 10 yrs: brand, campaign, UI, motion, print');
          print('  • led 13+ campaign streams for global IT brand');
          print('  • based in hyderabad — works across time zones');
          print('  • type "contact" when you\'re ready to talk.');
          break;
        case '???':
          triggerConfetti(3000);
          setTimeout(() => print('nice try', styles.success), 2800);
          break;
        case 'pet':
          if (!petVisible) showPet();
          print('your buddy is on the desktop. click them.');
          break;
        default:
          print(`command not found: ${trimmed}`, styles.error);
      }
    },
    [print, printHelp, openProject, closeWindow, windowId, playMusic, petVisible, showPet]
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
      data-app="terminal"
      onClick={() => inputRef.current?.focus()}
      role="presentation"
    >
      <div className={styles.output}>
        {lines.map((line, i) => {
          if (line.type === 'helpGrid') {
            return (
              <div key={`help-${i}`} className={styles.helpGrid}>
                {line.rows.map(([cmd, desc]) => (
                  <div key={cmd} className={styles.helpRow}>
                    <span className={styles.helpCmd}>{cmd}</span>
                    <span className={styles.helpDesc}>{desc}</span>
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div
              key={line.id ?? i}
              className={`${styles.line} ${line.className ?? ''} ${
                line.type === 'in' ? styles.prompt : ''
              }`}
            >
              {line.text}
            </div>
          );
        })}
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
