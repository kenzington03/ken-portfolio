import { useMemo, useRef } from 'react';
import { getNextProject } from '../../../data/projects.js';
import { getTagLabel } from '../../../data/tags.js';
import {
  getMilestoneNavSections,
  MILESTONE_OVERVIEW,
  MILESTONE_VIDEO_REEL,
} from '../../../data/milestoneCampaigns.js';
import { getOriginFromEvent } from '../../../utils/animationOrigin.js';
import { useOS } from '../../../context/OSContext.jsx';
import { useMilestoneProject } from '../../../hooks/useMilestoneProject.js';
import HeroVideo from '../../Media/HeroVideo.jsx';
import MasonryGallery from '../../Media/MasonryGallery.jsx';
import ProjectSectionTabs from './ProjectSectionTabs.jsx';
import styles from './MilestoneProjectViewer.module.css';

function CampaignSection({ campaign }) {
  const hasGridMedia = campaign.images.length > 0 || campaign.videos.length > 0;
  const hasMedia = hasGridMedia || campaign.heroVideo;

  return (
    <section id={campaign.id} className={styles.campaignSection}>
      <h2 className={styles.sectionTitle}>{campaign.label}</h2>
      {!hasMedia && <p className={styles.emptyMedia}>[ assets loading or not yet uploaded ]</p>}
      {campaign.heroVideo && (
        <HeroVideo src={campaign.heroVideo} className={styles.sectionHero} />
      )}
      {hasGridMedia && (
        <MasonryGallery images={campaign.images} videos={campaign.videos} />
      )}
    </section>
  );
}

function VideoReelSection({ groups }) {
  const allVideos = groups.flatMap((g) => g.videos);
  if (allVideos.length === 0) return null;

  return (
    <section id={MILESTONE_VIDEO_REEL.id} className={styles.campaignSection}>
      <h2 className={styles.sectionTitle}>{MILESTONE_VIDEO_REEL.label}</h2>
      {groups.map((group) => (
        <div key={group.id} className={styles.reelGroup}>
          {groups.length > 1 && <h3 className={styles.reelGroupTitle}>{group.label}</h3>}
          <MasonryGallery videos={group.videos} />
        </div>
      ))}
    </section>
  );
}

export default function MilestoneProjectViewer({ project }) {
  const { openProject } = useOS();
  const { logo, campaigns, videoReelGroups, loading } = useMilestoneProject();
  const scrollRef = useRef(null);

  const nextProject = getNextProject(project.id);

  const navSections = useMemo(
    () => getMilestoneNavSections(campaigns, videoReelGroups),
    [campaigns, videoReelGroups]
  );

  const momentum = campaigns.find((c) => c.id === '01-momentum-2026');
  const otherCampaigns = campaigns.filter((c) => c.id !== '01-momentum-2026');

  const openNext = (e) => {
    openProject(nextProject.id, { animationOrigin: getOriginFromEvent(e) });
  };

  return (
    <div className={styles.viewer}>
      <div className={styles.scroll} ref={scrollRef}>
        <header className={styles.stickyHeader}>
          <div className={styles.headerTop}>
            {logo && (
              <img src={logo} alt="Milestone Technologies" className={styles.logoBadge} />
            )}
            <div className={styles.headerText}>
              <h1 className={styles.title}>{project.name}</h1>
              <div className={styles.headerTags}>
                {(project.tags ?? []).map((tag) => (
                  <span key={tag} className={styles.headerTag}>
                    {getTagLabel(tag)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {!loading && navSections.length > 0 && (
            <ProjectSectionTabs sections={navSections} scrollRootRef={scrollRef} />
          )}
        </header>

        <div className={styles.content}>
          <section id="overview" className={styles.overview}>
            <p className={styles.overviewText}>{MILESTONE_OVERVIEW}</p>
          </section>

          {loading && <p className={styles.loading}>Loading campaigns…</p>}

          {!loading && momentum && <CampaignSection campaign={momentum} />}

          {!loading && <VideoReelSection groups={videoReelGroups} />}

          {!loading &&
            otherCampaigns.map((campaign) => (
              <CampaignSection key={campaign.id} campaign={campaign} />
            ))}

          <footer className={styles.footer}>
            <button type="button" className={styles.nextLink} onClick={openNext}>
              Next Project →
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
