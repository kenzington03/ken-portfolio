import RecognitionCards from './RecognitionCards.jsx';
import styles from './About.module.css';

const SKILLS = [
  'Brand Identity',
  'Motion Graphics',
  'UI/UX',
  'Video Production',
  'Campaigns',
  'Print',
];

const ROLES = [
  { company: 'Milestone Technologies', role: 'Design Lead', dates: 'Dec 2023 – Present' },
  { company: 'Tandem Digital', role: 'Lead Graphic & UI Designer', dates: '2020 – 2023' },
  { company: 'WebAnatomy', role: 'Graphic Designer', dates: '2018 – 2020' },
  { company: 'MiGrocer', role: 'Designer', dates: '2017 – 2018' },
  { company: 'Cowboy Studios', role: 'Designer', dates: '2015 – 2017' },
];

export default function About() {
  return (
    <div className={styles.about}>
      <div className={styles.left}>
        <div className={styles.portrait} aria-hidden />
        <h1>Kenneth Nathanael</h1>
        <p className={styles.title}>Design Lead</p>
        <p className={styles.bio}>
          10 years designing brands, campaigns, interfaces, and motion. Based in Hyderabad, India.
        </p>
        <div className={styles.skills}>
          {SKILLS.map((skill) => (
            <span key={skill} className={styles.skill}>
              {skill}
            </span>
          ))}
        </div>
        <div className={styles.links}>
          <a
            href="https://behance.net/nathanaelkenneth"
            target="_blank"
            rel="noopener noreferrer"
          >
            Behance
          </a>
          <a
            href="https://linkedin.com/in/kenneth-n-576134103"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </div>
      <div className={styles.right}>
        <h2 className={styles.sectionTitle}>Experience</h2>
        <div className={styles.timeline}>
          {ROLES.map((job) => (
            <div key={job.company} className={styles.timelineItem}>
              <div className={styles.company}>{job.company}</div>
              <div className={styles.role}>{job.role}</div>
              <div className={styles.dates}>{job.dates}</div>
            </div>
          ))}
        </div>

        <section className={styles.recognition}>
          <h2 className={styles.sectionTitle}>Recognition</h2>
          <p className={styles.recognitionIntro}>
            Internal kudos and recognition from teams at Milestone Technologies.
          </p>
          <RecognitionCards />
        </section>
      </div>
    </div>
  );
}
