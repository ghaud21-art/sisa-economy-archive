-- 새 지식 인사이트 배지 표시용
-- Supabase SQL Editor에서 실행하세요.

alter table public.profiles add column if not exists last_seen_insights_at timestamptz;
