import { getCaseStudy } from '../../../data/caseStudies.js';
import styles from './CaseStudy.module.css';

/** A project as a short story beside its work, told in type rather than
 *  under headings: what it needed (big), what Ken was (a line), what he
 *  led and did (a list), who for, and what came of it (the numbers). */
export default function CaseStudy({ project }) {
  const cs = getCaseStudy(project.folder);
  if (!cs) return null;
  return (
    <aside className={styles.case} aria-label={`${project.name}, the story`}>
      <p className={styles.kicker}>
        {project.client} · {project.year}
      </p>
      <h2 className={styles.name}>{project.name}</h2>
      <p className={styles.brief}>{cs.brief}</p>
      <p className={styles.role}>{cs.role}</p>
      <ul className={styles.did}>
        {[...(cs.lead ?? []), ...cs.did].map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      {cs.clients && <p className={styles.clients}>For {cs.clients.join(', ')}.</p>}
      {cs.results && (
        <dl className={styles.results}>
          {cs.results.map((r) => (
            <div key={r.label}>
              <dt>{r.value}</dt>
              <dd>{r.label}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className={styles.more}>The work is alongside. Ask me for the full story.</p>
    </aside>
  );
}
