import { useCallback, useEffect, useState } from 'react';
import styles from './ProjectSectionTabs.module.css';

export default function ProjectSectionTabs({
  sections,
  scrollRootRef,
  rootMargin = '-120px 0px -55% 0px',
  className = '',
}) {
  const [activeTab, setActiveTab] = useState(sections[0]?.id ?? null);

  useEffect(() => {
    if (sections.length && !activeTab) {
      setActiveTab(sections[0].id);
    }
  }, [sections, activeTab]);

  useEffect(() => {
    const root = scrollRootRef?.current;
    if (!root || sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveTab(visible[0].target.id);
        }
      },
      { root, rootMargin, threshold: [0, 0.25, 0.5] }
    );

    sections.forEach(({ id }) => {
      const el = root.querySelector(`#${CSS.escape(id)}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections, scrollRootRef]);

  const scrollToSection = useCallback(
    (e, id) => {
      e.preventDefault();
      setActiveTab(id);
      scrollRootRef?.current?.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    },
    [scrollRootRef]
  );

  if (sections.length === 0) return null;

  return (
    <nav className={`${styles.tabBar} ${className}`} aria-label="Project sections">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`${styles.tab} ${activeTab === section.id ? styles.tabActive : ''}`}
          onClick={(e) => scrollToSection(e, section.id)}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
