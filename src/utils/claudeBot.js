const DEFAULT_RESPONSE =
  'Great question! For more details about Kenneth, try asking about his work, experience, tools, or how to contact him. Or just explore the portfolio — the Work folder has his best projects!';

const RULES = [
  {
    keywords: ['behance', 'instagram', 'portfolio', 'showcase'],
    response:
      'Check out his work on Behance (behance.net/nathanaelkenneth) and Instagram (@nathanaelkenneth). This portfolio site is also his most up-to-date showcase — explore the Work folder!',
  },
  {
    keywords: ['who', 'about', 'kenneth', 'introduce'],
    response:
      'Kenneth Nathanael is a Design Lead with 10 years of experience based in Hyderabad, India. He specialises in brand identity, motion graphics, UI/UX, video production, and integrated campaigns. Currently leading the creative team at Milestone Technologies.',
  },
  {
    keywords: ['milestone'],
    response:
      'At Milestone Technologies, Kenneth leads brand campaigns, presentations, social media design, event collateral, and overall design operations for a global IT services company. Previously he was Lead Graphic & UI Designer at Tandem Digital for 3 years.',
  },
  {
    keywords: ['experience', 'career', 'background', 'history'],
    response:
      'Kenneth has 10 years of design experience across Milestone Technologies (Design Lead), Tandem Digital (Lead Graphic & UI Designer), WebAnatomy, MiGrocer, and Cowboy Studios. Promoted to Design Lead in October 2024.',
  },
  {
    keywords: ['open', 'hire', 'opportunity', 'available', 'role', 'looking'],
    response:
      "Yes! Kenneth is actively exploring Design Lead and Creative Director roles at product companies, agencies, or remote-first firms. He's especially interested in roles where he can build and lead a creative team.",
  },
  {
    keywords: ['tool', 'software', 'stack', 'skill'],
    response:
      "Kenneth works with Adobe Creative Suite (Illustrator, Photoshop, After Effects, Premiere Pro), Figma, Canva, PowerPoint, and AI tools including Midjourney, Firefly, Runway, and ElevenLabs. He's also a builder-level Claude user.",
  },
  {
    keywords: ['contact', 'reach', 'email', 'phone', 'touch'],
    response:
      "You can reach Kenneth at kennethnathanael@gmail.com or connect on LinkedIn at linkedin.com/in/kenneth-n-576134103. He's also on Behance at behance.net/nathanaelkenneth.",
  },
  {
    keywords: ['location', 'where', 'hyderabad', 'based', 'city', 'bangalore'],
    response:
      'Kenneth is based in Hyderabad, India and has lived there for about 8 years. Originally from Bangalore.',
  },
  {
    keywords: ['freelance', 'client'],
    response:
      'Kenneth does take on select freelance projects. Current clients include Keka Technologies. Best to reach out via email to discuss scope and availability.',
  },
  {
    keywords: ['work', 'job', 'company'],
    response:
      'At Milestone Technologies, Kenneth leads brand campaigns, presentations, social media design, event collateral, and overall design operations for a global IT services company. Previously he was Lead Graphic & UI Designer at Tandem Digital for 3 years.',
  },
];

export function getClaudeResponse(input) {
  const text = input.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.response;
    }
  }
  return DEFAULT_RESPONSE;
}

export const CLAUDE_GREETING =
  "Hey! I'm Claude. Ask me anything about Kenneth — his work, background, or how to get in touch. 👋";

export const CLAUDE_RECENTS = [
  'Why is the client always right 😭',
  'Invoice follow up but make it mean',
  'Logo in 2 hours yes or no',
  'How to say no to free work',
];
