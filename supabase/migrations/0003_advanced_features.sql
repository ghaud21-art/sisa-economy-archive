-- 북마크 / 오답 복습 / 정답률 랭킹 / 관리자 페이지
-- Supabase SQL Editor에서 실행하세요.

-- 북마크
create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

alter table public.bookmarks enable row level security;
create policy "bookmarks select own" on public.bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks insert own" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks delete own" on public.bookmarks for delete using (auth.uid() = user_id);

-- 오답 복습: 다시 풀어서 맞히면 오답노트에서 사라지도록 resolved_at 기록
alter table public.quiz_answers add column if not exists resolved_at timestamptz;

create policy "quiz_answers update own" on public.quiz_answers for update using (
  exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);

-- 정답률 랭킹 공개 여부 (기본 비공개)
alter table public.profiles add column if not exists share_rank boolean not null default false;

-- 관리자 여부
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- 이번 주(최근 7일) 정답률 랭킹: 공개 동의한 사용자만, 닉네임+집계값만 노출
create or replace function public.get_weekly_leaderboard()
returns table (nickname text, avg_correct_rate numeric, attempt_count bigint)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(p.nickname, '익명') as nickname,
    round(avg(qa.correct_rate), 1) as avg_correct_rate,
    count(*) as attempt_count
  from public.quiz_attempts qa
  join public.profiles p on p.id = qa.user_id
  where p.share_rank = true
    and qa.date >= (current_date - interval '7 days')
  group by p.nickname
  order by avg_correct_rate desc, attempt_count desc
  limit 20;
$$;

grant execute on function public.get_weekly_leaderboard() to authenticated, anon;

-- 배치 실행 이력 (관리자 페이지용)
create table if not exists public.batch_runs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  status text not null check (status in ('running', 'success', 'failed')),
  articles_count int,
  quiz_count int,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.batch_runs enable row level security;
create policy "batch_runs select admin" on public.batch_runs for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);
-- 배치 스크립트는 service role key로 쓰기 때문에 별도 insert/update 정책 불필요(RLS 우회)
