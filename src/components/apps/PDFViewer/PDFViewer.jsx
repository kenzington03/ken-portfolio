import styles from '../AppShared.module.css';

export default function PDFViewer() {
  return (
    <div className={styles.app} style={{ padding: 0, height: '100%' }}>
      <iframe
        title="CV"
        src="/cv.pdf#view=FitH&pagemode=none"
        style={{ width: '100%', height: '100%', border: 'none', minHeight: 360 }}
      />
    </div>
  );
}
