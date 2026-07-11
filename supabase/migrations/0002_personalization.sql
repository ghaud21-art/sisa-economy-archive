-- 관심분야 기반 개인화 + AI 한줄 헤드라인
-- Supabase SQL Editor에서 실행하세요.

-- 기사 원제목을 대신 보여줄 AI 한 문장 헤드라인
alter table public.articles add column if not exists headline text;

-- 회원가입 시 입력한 관심분야/직업
alter table public.profiles add column if not exists interest text;

-- 회원가입 트리거에 관심분야도 함께 저장하도록 갱신
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, interest)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'interest'
  );
  return new;
end;
$$;

-- 관심분야 맞춤 인사이트 (사용자별, 하루 1회 생성 후 캐시)
create table if not exists public.user_insights (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  interest text not null,
  insight_text text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.user_insights enable row level security;

create policy "user_insights select own" on public.user_insights for select using (auth.uid() = user_id);
create policy "user_insights insert own" on public.user_insights for insert with check (auth.uid() = user_id);
