import styles from './Experience.module.css';

const ROLES = [
  {
    company: 'Milestone Technologies',
    role: 'Design Lead',
    dates: 'Dec 2023 – Present',
  },
  {
    company: 'Tandem Digital',
    role: 'Lead Graphic & UI Designer',
    dates: '[ dates ]',
  },
  {
    company: 'WebAnatomy',
    role: 'Graphic Designer',
    dates: '[ dates ]',
  },
  {
    company: 'MiGrocer',
    role: 'Designer',
    dates: '[ dates ]',
  },
  {
    company: 'Cowboy Studios',
    role: 'Designer',
    dates: '[ dates ]',
  },
];

export default function Experience() {
  return (
    <div className={styles.experience}>
      <h1>Experience</h1>
      <div className={styles.timeline}>
        {ROLES.map((job) => (
          <div key={job.company} className={styles.item}>
            <div className={styles.company}>{job.company}</div>
            <div className={styles.role}>{job.role}</div>
            <div className={styles.dates}>{job.dates}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
