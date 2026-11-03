// Each project, told as a short case study: the brief, Ken's role, what he
// did, and what came of it. Only what is on his resume (public/cv.pdf) or in
// the project files; a field that is not known yet is left out, never made
// up. Keyed by the project's folder (src/data/projects.js).

export const CASE_STUDIES = {
  '02-milestone': {
    brief:
      'Milestone had just rebranded. The new guidelines had to be used by every global team, and marketing needed design work done in-house, fast.',
    role: 'Design Lead, Creative Studio. Brand custodian for the company.',
    lead: [
      'Helped build the in-house creative studio inside marketing',
      'Lead its creative direction, design reviews, vendors and operations',
      'Mentor the studio’s designers',
    ],
    did: [
      'Rolled the new brand guidelines out across all global teams',
      'Rebuilt the LinkedIn creative after the rebrand',
      'Art directed 15+ client and partner events, with Salesforce, ServiceNow, Netflix and Amgen',
      'Designed collateral for US events such as Dreamforce',
      'Branded four offices in India and the US, client experience centres included',
      'Built AI into the studio’s workflow, from brief to voiceover',
    ],
    results: [
      { value: '~8x', label: 'average LinkedIn post engagement after the overhaul' },
      { value: '72 hrs', label: 'to deliver the SKO25 keynote decks, videos and event visuals' },
      { value: 'CRO', label: 'Certificate of Appreciation for SKO25' },
    ],
  },
  '01-fluidai': {
    brief:
      'Fluid AI, a Web3 liquidity platform, needed one brand that holds together across its product, its social channels and its merchandise.',
    role: 'Dedicated designer on the account for two years, at Tandem Digital, the agency I co-founded.',
    lead: [
      'Ran the account while running the rest of the agency’s client roster',
      'Built and mentored the agency’s design team',
    ],
    did: [
      'Brand identity: logo, type, colour and the rules for using them',
      'UI screens and infographics for the product',
      'Motion studies and social posts',
      'Merchandise',
    ],
    results: [{ value: '2 yrs', label: 'as the account’s designer, from identity to product' }],
  },
  '03-marriott-aloft': {
    brief: 'Marriott, Sheraton and Aloft properties needed artwork and environmental graphics for their spaces.',
    role: 'Designer: artwork and environmental branding.',
    did: ['Artwork for the properties', 'Environmental graphics and supporting print'],
  },
  '04-lebron-nike': {
    brief:
      'A personal project, not client work and not affiliated with Nike: what if the Nike app and site were built around one athlete’s story?',
    role: 'Everything: concept, UX and visual design.',
    did: [
      'Put LeBron James’ story across the top of the page',
      'Put the product where the eye lands, in the middle of the screen',
      'Designed it for both the app and the website',
    ],
    results: [{ value: 'Practice', label: 'made to push how far a product page can go' }],
  },
  '05-social-media': {
    brief: 'Food, retail and lifestyle brands that need to show up on social every week, in a way people stop for.',
    role: 'Designer: posts, reels, ads and launch campaigns.',
    clients: ['Big Mamas', 'Devils Row Gin', 'Liberty Ladders', 'Mistins', 'QMart'],
    did: ['Post and carousel systems each brand can keep using', 'Launch and campaign creatives', 'Ads and reels'],
  },
  '06-branding': {
    brief: 'Consumer brands that needed an identity, packaging and campaign visuals, from scratch or refreshed.',
    role: 'Designer: identity, packaging and campaigns.',
    clients: ['Sampoorna Supermarket', 'Step-Set-Go', 'Truearte'],
    did: ['Identity systems: logo, colour, type', 'Packaging', 'Campaign visuals, in store and online'],
  },
  '07-web-ui': {
    brief: 'E-commerce and service brands that needed websites and product screens people find easy to use.',
    role: 'Designer: web and product UI.',
    clients: ['Big Mamas', 'Cancelled Plans', 'Liberty Ladders', 'Tahini', 'TrueHerb'],
    did: ['Websites, from structure to visual design', 'Product and app screens'],
  },
  '08-print-info': {
    brief: 'Information that has to be read and understood at a glance, on paper and on walls.',
    role: 'Designer: print and information graphics.',
    clients: ['Marriott'],
    did: ['Covid safety graphics', 'Infographics', 'Print collateral'],
  },
  '09-motion': {
    brief: 'Campaigns and social channels that needed things to move: from explainers to launch films.',
    role: 'Designer and editor: motion graphics and video.',
    did: ['Motion graphics for campaigns and social', 'Editing, from the idea to the final cut', 'AI in concepting, motion and voiceover'],
  },
};

export function getCaseStudy(folder) {
  return CASE_STUDIES[folder] ?? null;
}
