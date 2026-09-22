/**
 * Shared game leaderboard client.
 *
 * When VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set (see
 * supabase/schema.sql for the one-time setup), scores are written to a
 * real shared Supabase table — every visitor sees the same global
 * leaderboard. Until those env vars are configured, everything falls
 * back to localStorage so the games still work end-to-end (scores just
 * stay local to that browser). No game code needs to know which mode
 * it's in.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const BACKEND_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// The SDK is only fetched when a backend is configured, so visitors on the
// default localStorage-only setup never download it.
let clientPromise = null;
function getSupabase() {
  if (!BACKEND_CONFIGURED) return Promise.resolve(null);
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  );
  return clientPromise;
}

export function isBackendConnected() {
  return BACKEND_CONFIGURED;
}

const PLAYER_NAME_KEY = 'kenos:player-name';
const LOCAL_PREFIX = 'kenos:leaderboard:';
const LOCAL_BEST_PREFIX = 'kenos:best:';

export function getSavedPlayerName() {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function savePlayerName(name) {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name.slice(0, 20));
  } catch {
    /* ignore */
  }
}

/** Personal best, read synchronously from localStorage for instant UI
 * (works regardless of backend — this is a "this device" stat, always
 * cheap to show immediately without waiting on a network round trip). */
export function getLocalBest(game, { lowerIsBetter = false } = {}) {
  try {
    const raw = localStorage.getItem(`${LOCAL_BEST_PREFIX}${game}`);
    if (raw === null) return null;
    return Number(raw);
  } catch {
    return null;
  }
}

/** Record a run's score against the local best immediately (used for the
 * in-game "HI" style HUD, independent of whether the player later chooses
 * to submit their name to the leaderboard). Returns true if it's a new best. */
export function recordLocalScore(game, score, { lowerIsBetter = false } = {}) {
  return setLocalBest(game, score, lowerIsBetter);
}

function setLocalBest(game, score, lowerIsBetter) {
  try {
    const current = getLocalBest(game);
    const isBetter =
      current === null || (lowerIsBetter ? score < current : score > current);
    if (isBetter) {
      localStorage.setItem(`${LOCAL_BEST_PREFIX}${game}`, String(score));
    }
    return isBetter;
  } catch {
    return false;
  }
}

function localScoresKey(game) {
  return `${LOCAL_PREFIX}${game}`;
}

function readLocalScores(game) {
  try {
    const raw = localStorage.getItem(localScoresKey(game));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalScores(game, scores) {
  try {
    localStorage.setItem(localScoresKey(game), JSON.stringify(scores.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

/**
 * Submit a score. Returns { isNewBest } — the game screen uses this to
 * show a "New Best!" badge regardless of which backend is active.
 */
export async function submitScore(game, { name, score, lowerIsBetter = false }) {
  const cleanName = (name || 'Anonymous').trim().slice(0, 20) || 'Anonymous';
  savePlayerName(cleanName);
  const isNewBest = setLocalBest(game, score, lowerIsBetter);

  const supabase = await getSupabase().catch(() => null);
  if (supabase) {
    try {
      const { error } = await supabase
        .from('scores')
        .insert({ game, name: cleanName, score });
      if (error) throw error;
    } catch (err) {
      // Backend hiccup — don't lose the score, fall back to local storage
      // for this submission so the player still sees it on "View Leaderboard".
      const scores = readLocalScores(game);
      scores.push({ name: cleanName, score, created_at: new Date().toISOString() });
      writeLocalScores(game, scores);
    }
  } else {
    const scores = readLocalScores(game);
    scores.push({ name: cleanName, score, created_at: new Date().toISOString() });
    writeLocalScores(game, scores);
  }

  return { isNewBest };
}

/** Top N scores for a game, best-first. */
export async function getTopScores(game, { limit = 10, lowerIsBetter = false } = {}) {
  const supabase = await getSupabase().catch(() => null);
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('name, score, created_at')
        .eq('game', game)
        .order('score', { ascending: lowerIsBetter })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    } catch {
      // fall through to local scores below
    }
  }

  const scores = readLocalScores(game);
  const sorted = [...scores].sort((a, b) =>
    lowerIsBetter ? a.score - b.score : b.score - a.score
  );
  return sorted.slice(0, limit);
}
