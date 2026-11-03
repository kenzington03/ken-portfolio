import { getCaseStudy } from '../../../data/caseStudies.js';
import styles from './CaseStudy.module.css';

/** A project as a short case study, beside its work: the brief, Ken's role,
 *  how he led, what he did, what came of it. */
export default function CaseStudy({ project }) {
  const cs = getCaseStudy(project.folder);
  if (!cs) return null;
  return (
    <aside className={styles.case} aria-label="Case study">
      <p className={styles.kicker}>
        Case study · {project.client} · {project.year}
      </p>
      <h2 className={styles.name}>{project.name}</h2>

      <Section title="The brief">
        <p>{cs.brief}</p>
      </Section>
      <Section title="My role">
        <p>{cs.role}</p>
      </Section>
      {cs.lead && (
        <Section title="How I led">
          <List items={cs.lead} />
        </Section>
      )}
      <Section title="What I did">
        <List items={cs.did} />
      </Section>
      {cs.clients && (
        <Section title="Clients">
          <p>{cs.clients.join(', ')}</p>
        </Section>
      )}
      {cs.results && (
        <Section title="What came of it">
          <dl className={styles.results}>
            {cs.results.map((r) => (
              <div key={r.label}>
                <dt>{r.value}</dt>
                <dd>{r.label}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
      <p className={styles.more}>The work is alongside. Ask me for the full story.</p>
    </aside>
  );
}

function Section({ title, children }) {
  return (
    <section className={styles.section}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function List({ items }) {
  return (
    <ul>
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}
