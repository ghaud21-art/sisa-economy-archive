-- 뉴스 아카이브 초기 스키마
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists "pgcrypto";

-- 사용자 프로필 (auth.users 1:1)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamptz not null default now()
);

-- 회원가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 뉴스 기사 + AI 분석 결과
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  published_date date not null,
  category text not null check (category in ('economy_affairs', 'ai')),
  title text not null,
  source text not null,
  source_url text not null,
  keywords text[] not null default '{}',
  summary text not null,
  insight text not null,
  prediction text not null,
  concepts jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (source_url)
);
create index if not exists articles_published_date_idx on public.articles (published_date desc);
create index if not exists articles_category_idx on public.articles (category);

-- 일일 종합 다이제스트
create table if not exists public.daily_digest (
  date date primary key,
  overview_text text not null,
  article_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- O/X 퀴즈 문제
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  question_text text not null,
  correct_answer boolean not null,
  explanation text not null,
  related_article_id uuid references public.articles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists quiz_questions_date_idx on public.quiz_questions (date);

-- 사용자별 퀴즈 응시 결과 (하루 1회)
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  score int not null,
  total int not null,
  correct_rate numeric not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists quiz_attempts_user_date_idx on public.quiz_attempts (user_id, date desc);

-- 문항별 응답 (오답노트용)
create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  user_answer boolean not null,
  is_correct boolean not null
);
create index if not exists quiz_answers_attempt_idx on public.quiz_answers (attempt_id);

-- 사용자별 기사 열람 기록 (퀴즈 진행률 표시용)
create table if not exists public.article_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.articles enable row level security;
alter table public.daily_digest enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.article_reads enable row level security;

-- 공개 읽기: 기사/다이제스트/퀴즈 문제는 누구나 조회 가능
create policy "articles public read" on public.articles for select using (true);
create policy "daily_digest public read" on public.daily_digest for select using (true);
create policy "quiz_questions public read" on public.quiz_questions for select using (true);

-- 배치 스크립트는 service role key로 쓰기 때문에 별도 insert/update 정책 불필요(RLS 우회)

-- 프로필: 본인만 조회/수정
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- 퀴즈 응시 기록: 본인만 read/write
create policy "quiz_attempts select own" on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "quiz_attempts insert own" on public.quiz_attempts for insert with check (auth.uid() = user_id);

create policy "quiz_answers select own" on public.quiz_answers for select using (
  exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);
create policy "quiz_answers insert own" on public.quiz_answers for insert with check (
  exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);

-- 기사 열람 기록: 본인만 read/write
create policy "article_reads select own" on public.article_reads for select using (auth.uid() = user_id);
create policy "article_reads insert own" on public.article_reads for insert with check (auth.uid() = user_id);
