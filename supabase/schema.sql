-- Kenneth's OS — game leaderboards
--
-- Run this once in your Supabase project's SQL Editor (Supabase dashboard
-- → SQL Editor → New query → paste this whole file → Run).
--
-- This creates one shared "scores" table used by every game (Minesweeper,
-- Flappy Bird, Chrome Dino, and the new games). The `game` column tells
-- rows apart, so no per-game tables needed.

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  game text not null,
  name text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

create index if not exists scores_game_score_idx on public.scores (game, score);

-- Row Level Security: this table has no login system (it's a public
-- portfolio site), so we allow anyone to insert their own score and
-- read the leaderboard, but nothing else (no update, no delete from
-- the client — only doable from the Supabase dashboard).
alter table public.scores enable row level security;

drop policy if exists "Anyone can submit a score" on public.scores;
-- Bounds on what a client may insert. Anyone can call the API with the
-- public anon key, so the table must reject junk itself: cap the name,
-- keep the score in a sane range and cap the game id length. Scores are
-- still client-reported, so a determined visitor can post a fake score
-- inside these bounds; that can't be fixed without server-side validation.
alter table public.scores drop constraint if exists scores_name_len;
alter table public.scores
  add constraint scores_name_len check (char_length(name) between 1 and 20);

alter table public.scores drop constraint if exists scores_score_range;
alter table public.scores
  add constraint scores_score_range check (score between 0 and 1000000);

create policy "Anyone can submit a score"
  on public.scores for insert
  to anon
  with check (
    char_length(name) between 1 and 20
    and score between 0 and 1000000
    and char_length(game) between 1 and 40
  );

drop policy if exists "Anyone can read the leaderboard" on public.scores;
create policy "Anyone can read the leaderboard"
  on public.scores for select
  to anon
  using (true);
