import styles from './PDFViewer.module.css';

// The resume, like Preview: the page itself (public/resume.html, the same
// source the PDF is printed from), sized to the window, with a download of
// the PDF under Ken's name.
export const RESUME_PDF = '/Kenneth-Nathanael-Resume.pdf';

export default function PDFViewer() {
  return (
    <div className={styles.viewer}>
      <div className={styles.bar}>
        <span className={styles.name}>Kenneth-Nathanael-Resume.pdf</span>
        <a className={styles.btn} href={RESUME_PDF} target="_blank" rel="noreferrer">
          Open
        </a>
        <a className={`${styles.btn} ${styles.primary}`} href={RESUME_PDF} download="Kenneth-Nathanael-Resume.pdf">
          <svg viewBox="0 0 16 16" aria-hidden>
            <path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M3 13h10" />
          </svg>
          Download
        </a>
      </div>
      <iframe className={styles.page} title="Kenneth Nathanael, resume" src="/resume.html" />
    </div>
  );
}
