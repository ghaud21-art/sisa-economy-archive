-- 유튜브 인사이트 등록 요청 대기열 (Vercel 요청 타임아웃을 피하기 위해
-- 실제 Gemini 영상 분석은 GitHub Actions 배치에서 비동기로 처리)
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.youtube_insight_requests (
  id uuid primary key default gen_random_uuid(),
  youtube_url text not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists youtube_insight_requests_status_idx on public.youtube_insight_requests (status);

alter table public.youtube_insight_requests enable row level security;

create policy "youtube_insight_requests select admin" on public.youtube_insight_requests for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);
create policy "youtube_insight_requests insert admin" on public.youtube_insight_requests for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);
-- 처리 결과 업데이트는 배치 스크립트가 service role key로 수행 (RLS 우회)
