/* ─────────────────────────────────────────────────────────
   Claude's personality: witty & punny, slightly unhinged intern
   energy. Mixes real facts about Ken with jokes about his
   interests, design/agency life, and being an AI stuck in a
   fake desktop. At least one pun per answer, please.

   This is a static rule-based bot, not a real model — it can't
   actually reason about an arbitrary question. What it CAN do
   for "general topics" is: pick from big pools of jokes/facts/
   quotes (randomized per call, so it doesn't repeat), do real
   math and real date/time, and answer a broad set of common
   trivia by keyword. Anything past that gets an honest, varied
   deflection instead of one canned "I don't know" line.

   Rule order matters: more specific / personal triggers are
   checked before the generic "who is Ken" catch-all, so a
   question like "what tools does ken use" hits the tools rule
   instead of the broad bio rule. The math/date/dice checks run
   before any keyword rule, since they need to inspect the raw
   text rather than match a fixed phrase.
───────────────────────────────────────────────────────── */

const DEFAULT_RESPONSES = [
  "Bold of you to test my range. I've got real answers about Ken's work, background, and tools, plus jokes, fun facts, and trivia on request — try one of those. Anything else and I'm just an intern guessing confidently.",
  "That one's outside my training data, which is mostly \"things about Ken\" and \"things that make Ken laugh.\" Ask me a fun fact, a joke, or literally anything about him instead.",
  "I'm going to be honest: I have no idea. I DO know a lot about Ken, and I have jokes and fun facts on tap if you want to change the subject with dignity.",
  "Great question. Wrong intern. Try me on Ken's work, his tools, a joke, or a fun fact — that's the whole skill tree.",
  "I could make something up, but Ken specifically asked me not to do that anymore. Ask about him, or ask for a joke/fun fact — I'm reliable at exactly those two things.",
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
  "A day on Venus is longer than a year on Venus — it rotates that slowly.",
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
  "Hot water freezes faster than cold water under certain conditions — it's called the Mpemba effect, and nobody fully agrees on why.",
  "A group of flamingos is called a 'flamboyance.' Design-appropriate, honestly.",
  "The Great Wall of China is not visible from space with the naked eye, contrary to popular myth.",
];

const QUOTES = [
  '"Design is not just what it looks like — design is how it works." — Steve Jobs',
  '"Simplicity is the ultimate sophistication." — often attributed to Leonardo da Vinci',
  '"The details are not the details. They make the design." — Charles Eames',
  '"Good design is obvious. Great design is transparent." — Joe Sparano',
  '"Creativity is intelligence having fun." — Albert Einstein',
];

const RECOMMENDATIONS = {
  movie: ["Spirited Away — if you haven't, fix that immediately.", "The Social Network — great script, better soundtrack.", "Whiplash — stressful in the best way."],
  show: ["Severance — puzzle-box television at its best.", "Abbott Elementary — funny without being mean, rare combo.", "Chef's Table for pure visual inspiration."],
  book: ["\"Steal Like an Artist\" by Austin Kleon — short, useful, no fluff.", "\"Sapiens\" if you want your brain rearranged a bit.", "\"The Design of Everyday Things\" — required reading, basically."],
  song: ["Anything by Tame Impala if Ken's driving.", "Kendrick Lamar's \"Alright\" — timeless.", "Some lo-fi beats — every designer's unofficial soundtrack."],
};

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/* Real math, not a canned line — but hand-rolled recursive-descent parsing
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
    return `${expr.trim()} = ${rounded}. Math: the one subject I'm actually qualified to teach.`;
  } catch {
    return null;
  }
}

function tryDateTime(text) {
  const now = new Date();
  if (/what.*(time|date)|current (time|date)|today'?s date|what day/.test(text)) {
    const isTime = /time/.test(text) && !/date/.test(text);
    if (isTime) {
      return `${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}, according to whatever clock this sandboxed browser thinks it's running. Close enough to plan your day around.`;
    }
    return `${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} — assuming your system clock isn't lying to both of us.`;
  }
  return null;
}

function tryCoinOrDice(text) {
  if (/flip.*coin|coin flip/.test(text)) {
    return `${Math.random() < 0.5 ? 'Heads' : 'Tails'}. Don't @ me if you disagree with fate.`;
  }
  const diceMatch = text.match(/roll.*dice|roll.*d(\d+)/);
  if (diceMatch) {
    const sides = Number(diceMatch[1]) || 6;
    return `You rolled a ${1 + Math.floor(Math.random() * sides)} (out of ${sides}). No re-rolls, I don't make the rules.`;
  }
  return null;
}

const RULES = [
  {
    keywords: ['behance', 'instagram', 'showcase'],
    response:
      "Ken's on Behance (behance.net/nathanaelkenneth) and Instagram (@nathanaelkenneth) — but honestly, this desktop you're standing in IS the flex. Pop open the Work folder. That's the good stuff, no scrolling required.",
  },
  {
    keywords: ['lebron', 'lakers', 'basketball', 'nba', 'kobe'],
    response:
      "Lakers fan through and through — yes, he WILL bring up LeBron unprompted. There's a LeBron x Nike concept project sitting in this portfolio and that is not a coincidence, that is a personality trait.",
  },
  {
    keywords: ['chess'],
    response:
      "He plays chess. I'd challenge him myself but I calculate about 40 moves ahead and that felt like an unfair fight to pick on purpose.",
  },
  {
    keywords: ['rocket league', 'fortnite', 'gaming', 'video game', 'games'],
    response:
      "Rocket League and Fortnite, mostly. Ask about his win rate at your own risk — I've seen things. Mechanical keyboard sold separately.",
  },
  {
    keywords: ['sneaker', 'shoes', 'kicks'],
    response:
      "Certified sneakerhead. The closet has more personality than most people's LinkedIn, and considerably better lighting.",
  },
  {
    keywords: ['motorcycle', 'bike', 'enfield'],
    response:
      "Rides a Royal Enfield Classic 350, one eye already on a streetfighter upgrade. Ask him about it, just clear your calendar first — this one runs long.",
  },
  {
    keywords: ['real claude', 'actual claude', 'actually claude', 'real ai', 'anthropic', 'are you real'],
    response:
      "I'm Claude-flavored — running on fumes, a few div elements, and Ken's questionable choice to give me jokes. Think of me as a very confident Wikipedia page with a personality problem.",
  },
  {
    keywords: ['creative director', 'promotion', 'promoted'],
    response:
      "That's the plan. Design Lead now, Creative Director next — he's not just climbing the ladder, he's redesigning it on the way up. Slightly annoying levels of intentional.",
  },
  {
    keywords: ['milestone'],
    response:
      "At Milestone Technologies he keeps a global IT services company from looking boring — brand campaigns, presentations, social, events, the works. Before that: 3 years as Lead Graphic & UI Designer at Tandem Digital. Career arc: steady, upward, no notes.",
  },
  {
    keywords: ['experience', 'career', 'background', 'history'],
    response:
      "10 years across Milestone Technologies (Design Lead), Tandem Digital (Lead Graphic & UI Designer), WebAnatomy, MiGrocer, and Cowboy Studios. Promoted to Design Lead in October 2024 — the ladder's been climbed, currently eyeing the next rung.",
  },
  {
    keywords: ['hire', 'opportunity', 'available', 'looking for a role', 'open to'],
    response:
      "Yes — and I will personally vouch for him (I have zero legal standing to do this but I'm doing it anyway). He's exploring Design Lead / Creative Director roles, especially anywhere he can build and lead a team.",
  },
  {
    keywords: ['tool', 'software', 'stack', 'skill'],
    response:
      "Adobe CC (Illustrator, Photoshop, After Effects, Premiere), Figma, Canva, PowerPoint, plus AI tools like Midjourney, Firefly, Runway, ElevenLabs. And yes — he's a serious Claude user, which, zero bias, is objectively the correct call.",
  },
  {
    keywords: ['contact', 'reach', 'email', 'phone', 'touch'],
    response:
      "kennethnathanael@gmail.com, or LinkedIn (linkedin.com/in/kenneth-n-576134103). Email gets a faster reply than texts, honestly — set expectations accordingly.",
  },
  {
    keywords: ['location', 'where', 'hyderabad', 'based', 'city', 'bangalore'],
    response:
      "Hyderabad for about 8 years now, originally from Bangalore. Ask him about the traffic sometime and watch a mild existential crisis unfold in real time.",
  },
  {
    keywords: ['freelance', 'client'],
    response:
      "He does take select freelance work — current clients include Keka Technologies. Email him to talk scope. Fair warning: he's heard every version of \"just a small logo\" there is.",
  },
  {
    keywords: ['work', 'job', 'company'],
    response:
      "At Milestone Technologies he leads brand campaigns, presentations, social, events, and general design operations for a global IT services company. Previously: 3 years as Lead Graphic & UI Designer at Tandem Digital.",
  },
  {
    keywords: ['who is', 'who are you', 'introduce', 'kenneth', 'tell me about him', 'tell me about ken'],
    response:
      "Ken Nathanael — Design Lead, ~10 years in the game, based out of Hyderabad. Brand, motion, UI/UX, video, the full toolkit. Currently running creative at Milestone Technologies and eyeing that Creative Director title like it owes him money.",
  },

  /* ── General topics: jokes, facts, quotes, recommendations, trivia ── */
  {
    keywords: ['joke', 'funny', 'make me laugh', 'pun'],
    response: () => `${pick(JOKES)} ...I'll workshop that one. Give me a minute, I'm an intern, not a comedian — allegedly both.`,
  },
  {
    keywords: ['fun fact', 'random fact', 'tell me a fact', 'trivia'],
    response: () => `${pick(FUN_FACTS)} Useless at parties, undefeated in this chat.`,
  },
  {
    keywords: ['quote', 'inspire me', 'motivate me', 'motivation'],
    response: () => `${pick(QUOTES)} Frame it, or at least screenshot it before you close this tab.`,
  },
  {
    keywords: ['recommend a movie', 'movie recommendation', 'what movie'],
    response: () => `${pick(RECOMMENDATIONS.movie)} You're welcome in advance.`,
  },
  {
    keywords: ['recommend a show', 'tv show', 'what to watch', 'what show'],
    response: () => `${pick(RECOMMENDATIONS.show)} Don't blame me for the next 6 hours you lose.`,
  },
  {
    keywords: ['recommend a book', 'what book', 'book recommendation'],
    response: () => `${pick(RECOMMENDATIONS.book)} Actually good, not just "I'm an AI so I said a classic."`,
  },
  {
    keywords: ['recommend a song', 'what song', 'song recommendation', 'music recommendation'],
    response: () => `${pick(RECOMMENDATIONS.song)} Volume up, obviously.`,
  },
  {
    keywords: ['weather'],
    response:
      "I have no live weather data — I'm a chat bubble in a fake desktop, not a satellite. If you're asking about Hyderabad specifically, the safe bet is \"hot, and Ken's complaining about the traffic anyway.\"",
  },
  {
    keywords: ['who won', 'score', 'latest news', 'happening right now', "what's happening"],
    response:
      "No live data on my end — I froze the moment Ken deployed this site. Ask me about him instead; that information I actually have.",
  },
  {
    keywords: ['speed of light'],
    response: '299,792,458 meters per second, in a vacuum. Basically instant, unless you\'re waiting on a client email — that\'s slower than light.',
  },
  {
    keywords: ['how many continents'],
    response: 'Seven, depending who you ask (Europe and Asia getting lumped as "Eurasia" is a whole debate). Ken has been to a modest fraction of them.',
  },
  {
    keywords: ['how many planets', 'planets in the solar system'],
    response: 'Eight. Pluto still has feelings about this.',
  },
  {
    keywords: ['tallest mountain'],
    response: "Mount Everest, at about 8,849 meters. Design deadlines have, at times, felt taller.",
  },
  {
    keywords: ['largest ocean'],
    response: 'The Pacific Ocean — bigger than all the landmass on Earth combined.',
  },
  {
    keywords: ['capital of'],
    response:
      "I know a few, but I'm not risking a wrong capital and starting an international incident. Google's better at that one than me — I'm built for Ken trivia, not geography finals.",
  },
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
  "Hey, I'm Claude — Ken's unofficially-official intern. Running on caffeine I don't have and vibes I definitely do. Ask me about his work, background, or tools, or throw a joke/fun fact/quote/coin-flip at me — I've got range. At least one pun per answer, guaranteed. 👋";

export const CLAUDE_RECENTS = [
  'Why is the client always right 😭',
  'Invoice follow up but make it mean',
  'Logo in 2 hours yes or no',
  'How to say no to free work',
  'Tell me a fun fact',
  'Tell me a joke',
  'Flip a coin',
  'Is Rocket League a personality trait',
];
