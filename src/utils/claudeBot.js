/* A small scripted assistant for the Claude app. It is not a live model:
   it answers common questions about Ken from fixed facts (ABOUT), offers
   ready-made questions by topic (CLAUDE_TOPICS), and handles a few general
   extras (math, date, jokes, trivia). Tone: plain and direct, no persona.
   Rule order matters: specific topics are checked before the broad
   "who is Ken" rule. */

const DEFAULT_RESPONSES = [
  "I can't answer that one. I can tell you about Ken's work, background, skills, availability and how to reach him. Try one of the questions above.",
  "That's outside what I know. Pick a topic above, or ask about Ken's work, experience, tools or contact details.",
];

const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "I told my computer I needed a break, and now it won't stop sending me KitKats.",
  "Why did the designer break up with the kerning? Too much space between them.",
  "Parallel lines have so much in common. It's a shame they'll never meet.",
  "Why don't scientists trust atoms? Because they make up everything.",
  "I'm reading a book on anti-gravity. It's impossible to put down.",
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "I used to be a banker, but I lost interest.",
  "Why do Java developers wear glasses? Because they don't C#.",
  "I only know 25 letters of the alphabet. I don't know y.",
  "Why was the JPEG sad? It got compressed and lost its quality.",
  "What do you call a fish with no eyes? A fsh.",
  "I would tell you a UDP joke, but you might not get it.",
  "Why do designers never get lost? They always follow the grid.",
  "I told a chemistry joke once. No reaction.",
];

const FUN_FACTS = [
  "Octopuses have three hearts, and two of them stop beating when it swims.",
  "A day on Venus is longer than a year on Venus, it rotates that slowly.",
  "Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that's still edible.",
  "The Eiffel Tower grows about 15cm taller in summer because the iron expands in the heat.",
  "Bananas are berries. Strawberries, botanically, are not.",
  "A single bolt of lightning contains enough energy to toast about 100,000 slices of bread.",
  "Sharks existed before trees. They've been around for roughly 400 million years.",
  "Your brain uses about 20% of your body's total energy, despite being about 2% of your body weight.",
  "The shortest war in recorded history lasted about 38 minutes (Britain vs. Zanzibar, 1896).",
  "There are more possible iterations of a chess game than atoms in the observable universe.",
  "Wombat poop is cube-shaped, which stops it from rolling away and marks their territory better.",
  "The first computer bug was literally a moth stuck in a relay in 1947.",
  "Hot water freezes faster than cold water under certain conditions, it's called the Mpemba effect, and nobody fully agrees on why.",
  "A group of flamingos is called a 'flamboyance.' Design-appropriate, honestly.",
  "The Great Wall of China is not visible from space with the naked eye, contrary to popular myth.",
];

const QUOTES = [
  '"Design is not just what it looks like, design is how it works.", Steve Jobs',
  '"Simplicity is the ultimate sophistication.", often attributed to Leonardo da Vinci',
  '"The details are not the details. They make the design.", Charles Eames',
  '"Good design is obvious. Great design is transparent.", Joe Sparano',
  '"Creativity is intelligence having fun.", Albert Einstein',
];

const RECOMMENDATIONS = {
  movie: ["Spirited Away, if you haven't, fix that immediately.", "The Social Network, great script, better soundtrack.", "Whiplash, stressful in the best way."],
  show: ["Severance, puzzle-box television at its best.", "Abbott Elementary, funny without being mean, rare combo.", "Chef's Table for pure visual inspiration."],
  book: ["\"Steal Like an Artist\" by Austin Kleon, short, useful, no fluff.", "\"Sapiens\" if you want your brain rearranged a bit.", "\"The Design of Everyday Things\", required reading, basically."],
  song: ["Anything by Tame Impala if Ken's driving.", "Kendrick Lamar's \"Alright\", timeless.", "Some lo-fi beats, every designer's unofficial soundtrack."],
};

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/* Real math, not a canned line, but hand-rolled recursive-descent parsing
   instead of eval()/new Function() on user input, even restricted-charset
   input. No string ever reaches a JS interpreter; it's just numbers. */
function evalArithmetic(expr) {
  let i = 0;

  function peek() {
    while (expr[i] === ' ') i += 1;
    return expr[i];
  }
  function number() {
    while (expr[i] === ' ') i += 1;
    const start = i;
    if (expr[i] === '-') i += 1;
    while (/[\d.]/.test(expr[i])) i += 1;
    if (i === start || i === start + 1 && expr[start] === '-') {
      throw new Error('bad number');
    }
    return Number(expr.slice(start, i));
  }
  function factor() {
    if (peek() === '(') {
      i += 1;
      const v = addSub();
      if (peek() !== ')') throw new Error('unmatched paren');
      i += 1;
      return v;
    }
    if (peek() === '-') {
      i += 1;
      return -factor();
    }
    return number();
  }
  function power() {
    let v = factor();
    while (peek() === '^') {
      i += 1;
      v = v ** factor();
    }
    return v;
  }
  function mulDiv() {
    let v = power();
    while (peek() === '*' || peek() === '/') {
      const op = expr[i];
      i += 1;
      const rhs = power();
      v = op === '*' ? v * rhs : v / rhs;
    }
    return v;
  }
  function addSub() {
    let v = mulDiv();
    while (peek() === '+' || peek() === '-') {
      const op = expr[i];
      i += 1;
      const rhs = mulDiv();
      v = op === '+' ? v + rhs : v - rhs;
    }
    return v;
  }

  const result = addSub();
  while (expr[i] === ' ') i += 1;
  if (i !== expr.length) throw new Error('trailing input');
  return result;
}

function tryMath(text) {
  const match = text.match(/-?\d+(\.\d+)?\s*[\d+\-*/^().\s]*[\d)]/);
  if (!match) return null;
  const expr = match[0];
  if (!/[+\-*/^]/.test(expr)) return null; // needs at least one operator
  if (!/^[\d+\-*/^().\s]+$/.test(expr)) return null;

  try {
    const result = evalArithmetic(expr);
    if (typeof result !== 'number' || !Number.isFinite(result)) return null;
    const rounded = Math.round(result * 1e6) / 1e6;
    return `${expr.trim()} = ${rounded}`;
  } catch {
    return null;
  }
}

function tryDateTime(text) {
  const now = new Date();
  if (/what.*(time|date)|current (time|date)|today'?s date|what day/.test(text)) {
    const isTime = /time/.test(text) && !/date/.test(text);
    if (isTime) {
      return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  return null;
}

function tryCoinOrDice(text) {
  if (/flip.*coin|coin flip/.test(text)) {
    return Math.random() < 0.5 ? 'Heads.' : 'Tails.';
  }
  const diceMatch = text.match(/roll.*dice|roll.*d(\d+)/);
  if (diceMatch) {
    const sides = Number(diceMatch[1]) || 6;
    return `You rolled a ${1 + Math.floor(Math.random() * sides)} (out of ${sides}).`;
  }
  return null;
}

// Plain answers about Ken. No character voice: the visitor is here to learn
// about him quickly. Facts only; anything not known is not invented.
const ABOUT = {
  who: "Kenneth Nathanael (Ken) is a designer based in India with about 10 years of experience across brand identity, motion, UI/UX and video. Right now he leads brand and campaign design at a global IT services company.",
  role: "In his current role Ken leads brand campaigns, presentations, social, events and day-to-day design operations for a global IT services company.",
  career: "About 10 years: DreamWorks Dedicated Unit (2015), Cowboy Studios (2016 to 2018), MiGrocer (2018 to 2020), WebAnatomy (2020), Tandem Digital (2020 to 2023) and his current role at a global IT services company (Dec 2023 to now).",
  bestWork: "Start with the Work folder on this desktop: Fluid AI (rebrand), enterprise campaigns including Momentum 2026, Marriott and Aloft, and the LeBron James concept (a personal project).",
  brands: "Brand work includes Fluid AI, Truearte, Step-Set-Go and Sampoorna, plus enterprise campaigns and hospitality work for Marriott and Aloft.",
  motion: "Yes. Motion graphics and video are a core part of his work: event films, campaign visuals and social motion. Open the Motion folder to see it.",
  tools: "Adobe CC (Illustrator, Photoshop, After Effects, Premiere), Figma, Canva and PowerPoint, plus AI tools such as Midjourney, Firefly, Runway and ElevenLabs.",
  strengths: "Brand identity, motion graphics, UI/UX, video production, campaigns and print. He leads the idea and stays hands-on through delivery.",
  process: "He starts with the idea and the audience, sketches directions fast, then refines details: type, motion timing and layout. Colleagues often mention speed and follow-through.",
  hire: "Yes. Ken is open to senior design roles and freelance projects, especially where he can build and lead a team.",
  freelance: "He takes select freelance projects. Email him with the scope and timeline.",
  location: "India.",
  contact: "Email kennethnathanael@gmail.com or LinkedIn: linkedin.com/in/kenneth-n-576134103. Email is fastest.",
  resume: "Open Resume on the desktop, or the About app, for the full history.",
  social: "Behance: behance.net/nathanaelkenneth. Instagram: @nathanaelkenneth.",
  interests: "Outside work: basketball (Lakers), chess, Rocket League, sneakers, and a Royal Enfield Classic 350.",
};

// Tabs of ready-made questions shown in the Claude app.
export const CLAUDE_TOPICS = [
  {
    tab: 'Work',
    questions: [
      { q: 'What should I look at first?', a: ABOUT.bestWork },
      { q: 'Which brands has Ken worked on?', a: ABOUT.brands },
      { q: 'Does he do motion and video?', a: ABOUT.motion },
    ],
  },
  {
    tab: 'Background',
    questions: [
      { q: 'Who is Ken?', a: ABOUT.who },
      { q: 'Where has he worked?', a: ABOUT.career },
      { q: 'What does he do now?', a: ABOUT.role },
    ],
  },
  {
    tab: 'Skills',
    questions: [
      { q: 'What are his strengths?', a: ABOUT.strengths },
      { q: 'What tools does he use?', a: ABOUT.tools },
      { q: 'How does he work?', a: ABOUT.process },
    ],
  },
  {
    tab: 'Hiring',
    questions: [
      { q: 'Is Ken open to new roles?', a: ABOUT.hire },
      { q: 'Does he take freelance work?', a: ABOUT.freelance },
      { q: 'Where is he based?', a: ABOUT.location },
    ],
  },
  {
    tab: 'Contact',
    questions: [
      { q: 'How do I reach Ken?', a: ABOUT.contact },
      { q: 'Where is his resume?', a: ABOUT.resume },
      { q: 'Where else can I see his work?', a: ABOUT.social },
    ],
  },
];

const RULES = [
  { keywords: ['behance', 'instagram', 'showcase', 'social'], response: ABOUT.social },
  { keywords: ['resume', 'cv'], response: ABOUT.resume },
  { keywords: ['lebron', 'lakers', 'basketball', 'nba', 'chess', 'rocket league', 'fortnite', 'gaming', 'sneaker', 'motorcycle', 'enfield', 'hobby', 'hobbies', 'interests'], response: ABOUT.interests },
  {
    keywords: ['real claude', 'actual claude', 'actually claude', 'real ai', 'anthropic', 'are you real'],
    response: "No. This is a small scripted assistant inside Ken's portfolio, not a live AI model. It answers common questions about Ken.",
  },
  { keywords: ['hire', 'opportunity', 'available', 'looking for a role', 'open to', 'creative director'], response: ABOUT.hire },
  { keywords: ['freelance', 'client'], response: ABOUT.freelance },
  { keywords: ['milestone', 'current role', 'day to day'], response: ABOUT.role },
  { keywords: ['experience', 'career', 'background', 'history', 'worked'], response: ABOUT.career },
  { keywords: ['tool', 'software', 'stack'], response: ABOUT.tools },
  { keywords: ['skill', 'strength', 'good at'], response: ABOUT.strengths },
  { keywords: ['process', 'how does he work', 'approach'], response: ABOUT.process },
  { keywords: ['motion', 'video', 'animation'], response: ABOUT.motion },
  { keywords: ['brand', 'logo', 'identity'], response: ABOUT.brands },
  { keywords: ['best work', 'look at first', 'portfolio', 'projects', 'case stud'], response: ABOUT.bestWork },
  { keywords: ['contact', 'reach', 'email', 'phone', 'touch', 'linkedin'], response: ABOUT.contact },
  { keywords: ['location', 'where', 'hyderabad', 'based', 'city', 'bangalore'], response: ABOUT.location },
  { keywords: ['work', 'job', 'company'], response: ABOUT.role },
  { keywords: ['who is', 'who are you', 'introduce', 'kenneth', 'tell me about him', 'tell me about ken', 'about ken'], response: ABOUT.who },

  /* General extras, answered plainly. */
  { keywords: ['joke', 'funny', 'make me laugh', 'pun'], response: () => pick(JOKES) },
  { keywords: ['fun fact', 'random fact', 'tell me a fact', 'trivia'], response: () => pick(FUN_FACTS) },
  { keywords: ['quote', 'inspire me', 'motivate me', 'motivation'], response: () => pick(QUOTES) },
  { keywords: ['recommend a movie', 'movie recommendation', 'what movie'], response: () => pick(RECOMMENDATIONS.movie) },
  { keywords: ['recommend a show', 'tv show', 'what to watch', 'what show'], response: () => pick(RECOMMENDATIONS.show) },
  { keywords: ['recommend a book', 'what book', 'book recommendation'], response: () => pick(RECOMMENDATIONS.book) },
  { keywords: ['recommend a song', 'what song', 'song recommendation', 'music recommendation'], response: () => pick(RECOMMENDATIONS.song) },
  {
    keywords: ['weather', 'who won', 'score', 'latest news', 'happening right now', "what's happening", 'capital of'],
    response: "I don't have live or general reference data. I can answer questions about Ken and his work.",
  },
  { keywords: ['speed of light'], response: '299,792,458 meters per second, in a vacuum.' },
  { keywords: ['how many continents'], response: 'Seven.' },
  { keywords: ['how many planets', 'planets in the solar system'], response: 'Eight.' },
  { keywords: ['tallest mountain'], response: 'Mount Everest, at about 8,849 meters.' },
  { keywords: ['largest ocean'], response: 'The Pacific Ocean.' },
];

export function getClaudeResponse(input) {
  const text = input.toLowerCase();

  const math = tryMath(text);
  if (math) return math;

  const dateTime = tryDateTime(text);
  if (dateTime) return dateTime;

  const coinOrDice = tryCoinOrDice(text);
  if (coinOrDice) return coinOrDice;

  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return typeof rule.response === 'function' ? rule.response() : rule.response;
    }
  }
  return pick(DEFAULT_RESPONSES);
}

export const CLAUDE_GREETING =
  "Hi. Ask me anything about Ken: his work, background, skills, availability or how to reach him. Pick a topic below to start.";
