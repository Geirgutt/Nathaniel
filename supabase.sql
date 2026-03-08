create table if not exists public.scores (
  id bigint generated always as identity primary key,
  name text not null,
  score integer not null,
  level integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists scores_score_idx on public.scores (score desc, created_at asc);

grant usage on schema public to anon, authenticated;
grant select, insert on table public.scores to anon, authenticated;

alter table public.scores enable row level security;

drop policy if exists "public can read scores" on public.scores;
drop policy if exists "public can insert scores" on public.scores;

create policy "public can read scores"
on public.scores
for select
to anon, authenticated
using (true);

create policy "public can insert scores"
on public.scores
for insert
to anon, authenticated
with check (
  char_length(trim(name)) between 1 and 16
  and score >= 0
  and level >= 1
);
