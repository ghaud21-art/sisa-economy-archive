-- 관리자가 유튜브 링크로 등록하는 "지식 인사이트" 콘텐츠
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.youtube_insights (
  id uuid primary key default gen_random_uuid(),
  youtube_url text not null,
  video_title text not null,
  headline text not null,
  keywords text[] not null default '{}',
  summary text not null,
  key_arguments text not null,
  economic_meaning text not null,
  insight text not null,
  concepts jsonb not null default '[]',
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists youtube_insights_published_at_idx on public.youtube_insights (published_at desc);

alter table public.youtube_insights enable row level security;

create policy "youtube_insights public read" on public.youtube_insights for select using (true);

create policy "youtube_insights insert admin" on public.youtube_insights for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);
create policy "youtube_insights delete admin" on public.youtube_insights for delete using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);
