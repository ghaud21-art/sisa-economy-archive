# 뉴스 아카이브

매일 아침 시사·경제·AI 뉴스를 자동 수집해 키워드/요약/인사이트/미래예측/학습개념을 정리하고, O/X 퀴즈로 이해도를 점검하는 웹앱입니다.

- 프론트/백엔드: Next.js (App Router) → Vercel
- DB/인증: Supabase (Postgres + Auth)
- 뉴스 수집: RSS + 네이버 뉴스검색 API
- AI 분석/퀴즈 생성: Gemini API
- 자동 실행: GitHub Actions 매일 크론 (`.github/workflows/daily-digest.yml`) + 유튜브 지식 인사이트 30분 주기 처리 (`.github/workflows/process-youtube-insights.yml`)

## 처음 설정하기

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 만듭니다 (무료 플랜, 카드 등록 불필요).
2. 프로젝트의 **SQL Editor**에서 `supabase/migrations/` 폴더의 SQL 파일을 번호 순서대로(0001 → 0006) 실행해 테이블/RLS를 만듭니다.
3. **Project Settings → API**에서 아래 3개 값을 확인합니다.
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (절대 클라이언트에 노출하면 안 됩니다)
4. **Authentication → Providers**에서 Email 로그인이 켜져 있는지 확인합니다. (기본 이메일 확인 발송 여부는 Authentication → Settings에서 조정 가능합니다.)

### 2. 네이버 뉴스검색 API 키 발급

1. [Naver Developers](https://developers.naver.com/apps)에서 애플리케이션을 등록합니다.
2. 사용 API로 "검색"을 선택합니다.
3. 발급된 `Client ID`, `Client Secret`을 확인합니다.

### 3. Gemini API 키

[Google AI Studio](https://aistudio.google.com/apikey)에서 발급받은 키를 사용합니다.

### 4. 로컬 환경변수 설정

`.env.local.example`을 복사해 `.env.local`을 만들고 위에서 발급받은 값을 채웁니다.

```bash
cp .env.local.example .env.local
```

### 5. 로컬 실행

```bash
npm install
npm run dev          # 웹앱 (http://localhost:3000)
npm run generate-digest  # 배치 스크립트 수동 1회 실행 (뉴스 수집 → AI 분석 → 퀴즈 생성 → Supabase 저장)
```

## GitHub Actions 자동 실행 설정

저장소를 GitHub에 올린 뒤 **Settings → Secrets and variables → Actions**에서 아래 시크릿을 등록하세요. `.github/workflows/daily-digest.yml`이 매일 07:00(KST)에 `npm run generate-digest`를 자동 실행합니다.

| 이름 | 값 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `GEMINI_API_KEY` | Gemini API 키 |
| `NAVER_CLIENT_ID` | 네이버 검색 API Client ID |
| `NAVER_CLIENT_SECRET` | 네이버 검색 API Client Secret |

등록 후 **Actions** 탭에서 "Daily News Digest" 워크플로를 `Run workflow`로 수동 실행해 정상 동작을 확인할 수 있습니다.

관리자 페이지에서 유튜브 지식 인사이트를 등록하면 "Process YouTube Insight Requests" 워크플로가 30분마다 대기열을 확인해 처리합니다 (같은 시크릿을 사용하며 네이버 키는 필요 없습니다). 바로 처리하고 싶으면 이 워크플로도 **Actions** 탭에서 수동 실행하면 됩니다.

## Vercel 배포

1. [vercel.com](https://vercel.com)에서 이 GitHub 저장소를 Import합니다 (무료 Hobby 플랜).
2. **Environment Variables**에 아래를 등록합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (마이페이지의 관심분야 맞춤 인사이트를 웹앱이 직접 생성할 때 사용됩니다. 배치 전용이 아니라 웹앱에서도 필요합니다.)
   - `SUPABASE_SERVICE_ROLE_KEY` (관리자 페이지가 전체 배치 이력·가입자 수를 조회할 때 사용됩니다. 서버 전용 코드에서만 쓰이며 클라이언트에 노출되지 않습니다.)
   - 네이버 키는 Vercel에 넣지 않습니다 (GitHub Actions 배치 전용).
3. Deploy를 누르면 끝입니다.

## 관리자 계정 지정

`/admin` 페이지는 `profiles.is_admin`이 `true`인 사용자만 볼 수 있습니다. 기본값은 `false`라서, 관리자로 지정할 사용자의 `profiles.is_admin`을 Supabase 대시보드의 **Table Editor**에서 직접 `true`로 바꿔주세요.

## 프로젝트 구조

```
src/app/            페이지 (오늘의 피드, 기사 상세, 아카이브, 로그인/회원가입, 퀴즈, 마이페이지)
src/components/      공용 UI 컴포넌트
src/lib/             Supabase 클라이언트, 데이터 조회 헬퍼, 날짜 유틸
scripts/             매일 배치 스크립트 (RSS/네이버 수집 → Gemini 분석 → Supabase 저장)
supabase/migrations/ DB 스키마 SQL
.github/workflows/   GitHub Actions 크론 워크플로
```
