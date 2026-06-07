import { useEffect, useRef, useState } from 'react';
import {
  CLAUDE_GREETING,
  CLAUDE_RECENTS,
  getClaudeResponse,
} from '../../../utils/claudeBot.js';
import styles from './ClaudeFaq.module.css';

export default function ClaudeFaq() {
  const [messages, setMessages] = useState([{ role: 'claude', text: CLAUDE_GREETING }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const reply = getClaudeResponse(trimmed);
      setMessages((prev) => [...prev, { role: 'claude', text: reply }]);
      setTyping(false);
    }, 800);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <img
            src="/assets/icons/dock-claude-logo.png"
            alt=""
            className={styles.sidebarLogo}
            width={24}
            height={24}
          />
          <span>Claude</span>
        </div>
        <div className={styles.recentsLabel}>Recents</div>
        <ul className={styles.recents}>
          {CLAUDE_RECENTS.map((title) => (
            <li key={title} className={styles.recentItem}>
              {title}
            </li>
          ))}
        </ul>
      </aside>

      <div className={styles.main}>
        <div className={styles.topBar}>
          <img
            src="/assets/icons/dock-claude-logo.png"
            alt=""
            className={styles.topLogo}
            width={32}
            height={32}
          />
          <span>Claude</span>
        </div>

        <div className={styles.messages} ref={scrollRef}>
          {messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={msg.role === 'user' ? styles.userRow : styles.claudeRow}
            >
              <div className={msg.role === 'user' ? styles.userBubble : styles.claudeBubble}>
                {msg.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className={styles.claudeRow}>
              <div className={styles.claudeBubble}>
                <span className={styles.typing}>
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          )}
        </div>

        <form className={styles.inputBar} onSubmit={onSubmit}>
          <input
            type="text"
            className={styles.input}
            placeholder="Message Claude..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={typing}
          />
          <button type="submit" className={styles.sendBtn} disabled={typing || !input.trim()}>
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
