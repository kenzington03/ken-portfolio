import { CLOUDINARY_VIDEOS } from '../../data/cloudinaryVideos.js';
import { MOTION_VIDEO_CONFIG, getProjectSectionConfig, isMotionProject } from '../../data/projectSections.js';
import { useMilestoneProject } from '../../hooks/useMilestoneProject.js';
import { useMotionVideos } from '../../hooks/useMotionVideos.js';
import { useProjectImages } from '../../hooks/useProjectImages.js';
import { useSectionedProject } from '../../hooks/useSectionedProject.js';
import MasonryGallery from '../Media/MasonryGallery.jsx';
import styles from './AppSheet.module.css';

/** Same media sources as the desktop ProjectViewer, laid out for the phone sheet. */
export default function MobileProjectGallery({ project }) {
  if (project.folder === '02-milestone') return <MilestoneGallery />;
  if (project.folder === '04-lebron-nike') {
    return <Section label="Concept film" videos={[CLOUDINARY_VIDEOS['lebron-nike-concept']].filter(Boolean)} />;
  }
  if (isMotionProject(project.folder)) return <MotionGallery project={project} />;
  const config = getProjectSectionConfig(project.folder);
  if (config) return <SectionedGallery folder={project.folder} sections={config.sections} />;
  return <FlatGallery folder={project.folder} />;
}

function Section({ label, images = [], videos = [] }) {
  if (images.length === 0 && videos.length === 0) return null;
  return (
    <section className={styles.gallerySection}>
      {label && <h3 className={styles.gallerySectionTitle}>{label}</h3>}
      <MasonryGallery images={images} videos={videos} />
    </section>
  );
}

const Loading = () => <p className={styles.galleryLoading}>Loading work…</p>;

function SectionedGallery({ folder, sections: config }) {
  const { sections, loading } = useSectionedProject(folder, config);
  if (loading) return <Loading />;
  return sections.map((s) => <Section key={s.id} label={s.label} images={s.images} videos={s.videos ?? []} />);
}

function FlatGallery({ folder }) {
  const { images, loading } = useProjectImages(folder);
  if (loading) return <Loading />;
  return <Section images={images} />;
}

function MilestoneGallery() {
  const { campaigns, videoReelGroups, loading } = useMilestoneProject();
  if (loading) return <Loading />;
  return (
    <>
      {campaigns.map((c) => (
        <Section
          key={c.id}
          label={c.label}
          images={c.images}
          videos={[...(c.heroVideo ? [c.heroVideo] : []), ...c.videos]}
        />
      ))}
      {videoReelGroups.map((g) => (
        <Section key={g.id} label={g.label} videos={g.videos} />
      ))}
    </>
  );
}

function MotionGallery({ project }) {
  const { videos, loading } = useMotionVideos(
    project.folder,
    MOTION_VIDEO_CONFIG.videoSubfolders,
    MOTION_VIDEO_CONFIG.maxVideosPerPath,
    project.videoKeys ?? MOTION_VIDEO_CONFIG.videoKeys ?? []
  );
  if (loading) return <Loading />;
  return <Section videos={videos} />;
}
