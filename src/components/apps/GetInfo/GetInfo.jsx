import styles from './GetInfo.module.css';

// "Get Info" for anything in the Dock: what the Finder would say about it.
const INFO = {
  finder: { kind: 'Folder', size: '9 projects', where: '~/Portfolio' },
  about: { kind: 'Application', size: '1.2 MB', version: '10.0 (10+ years)' },
  contact: { kind: 'Application', size: '640 KB', version: '2.1' },
  illustrator: { kind: 'Application', size: '3.4 GB', version: 'Adobe Illustrator 2026' },
  photoshop: { kind: 'Application', size: '4.1 GB', version: 'Adobe Photoshop 2026' },
  instagram: { kind: 'Web link', size: '—', where: 'instagram.com/nathanaelkenneth' },
  claude: { kind: 'Application', size: '210 KB', version: 'Ask about Ken' },
  pdfviewer: { kind: 'PDF document', size: '73 KB', where: '~/Kenneth-Nathanael-Resume.pdf' },
  systempreferences: { kind: 'Application', size: '18 MB', version: 'macOS 26' },
  trash: { kind: 'Folder', size: 'Full of good intentions', where: '~/.Trash' },
};

export default function GetInfo({ data }) {
  const info = INFO[data?.id] ?? { kind: 'Application', size: '—' };
  return (
    <div className={styles.info}>
      <header>
        <span className={styles.icon}>{data?.src ? <img src={data.src} alt="" /> : data?.label?.slice(0, 2)}</span>
        <div>
          <b>{data?.label}</b>
          <span>{info.size}</span>
        </div>
      </header>
      <dl>
        <dt>Kind</dt>
        <dd>{info.kind}</dd>
        {info.version && (
          <>
            <dt>Version</dt>
            <dd>{info.version}</dd>
          </>
        )}
        <dt>Where</dt>
        <dd>{info.where ?? 'Macintosh HD ▸ Applications'}</dd>
        <dt>Created</dt>
        <dd>by Kenneth Nathanael</dd>
        <dt>Modified</dt>
        <dd>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</dd>
      </dl>
    </div>
  );
}
