import { MAX_ARTICLES_PER_CATEGORY, MAX_CANDIDATES_PER_SOURCE } from "./sources";
import type { CandidateArticle } from "./types";
import type { ArticleCategory } from "@/types/database";

// 포토/화보성 콘텐츠 등 뉴스 분석에 부적합한 제목 패턴
const JUNK_TITLE_PATTERNS = [
  /^\[사진\]/,
  /^\[포토\]/,
  /^\[영상\]/,
  /^\[카드뉴스\]/,
  /^\[게시판\]/,
  /^\[부고\]/,
  /^\[인사\]/,
  /^\[동정\]/,
];

// 스포츠/연예/단신 사건사고 등 시사·경제 학습 목적과 무관한 카테고리 키워드
const OFF_TOPIC_KEYWORDS = [
  "프로야구",
  "MSI",
  "결승",
  "축구",
  "야구",
  "골프",
  "아이돌",
  "컴백",
  "예능",
  "드라마 출연",
  "화재",
  "교통사고",
  "실종",
  "게임",
  "컬래버",
  "코스프레",
  "설전",
  "논란",
];

function isJunkTitle(title: string): boolean {
  if (JUNK_TITLE_PATTERNS.some((pattern) => pattern.test(title))) return true;
  return OFF_TOPIC_KEYWORDS.some((kw) => title.includes(kw));
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[\s\p{P}]/gu, "")
    .trim();
}

export function dedupeArticles(articles: CandidateArticle[]): CandidateArticle[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const result: CandidateArticle[] = [];

  for (const article of articles) {
    if (isJunkTitle(article.title)) continue;
    const normTitle = normalizeTitle(article.title);
    if (seenUrls.has(article.link) || seenTitles.has(normTitle)) continue;
    seenUrls.add(article.link);
    seenTitles.add(normTitle);
    result.push(article);
  }
  return result;
}

function byRecency(a: CandidateArticle, b: CandidateArticle): number {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
}

export function selectTopArticles(articles: CandidateArticle[]): CandidateArticle[] {
  const bySource = new Map<string, CandidateArticle[]>();
  for (const article of articles) {
    const list = bySource.get(article.source) ?? [];
    list.push(article);
    bySource.set(article.source, list);
  }

  // 소스별로 최신 N건만 남겨서 한 소스가 카테고리 선별을 독점하지 않게 한다
  const capped: CandidateArticle[] = [];
  for (const list of bySource.values()) {
    capped.push(...[...list].sort(byRecency).slice(0, MAX_CANDIDATES_PER_SOURCE));
  }

  const byCategory = new Map<ArticleCategory, CandidateArticle[]>();
  for (const article of capped) {
    const list = byCategory.get(article.category) ?? [];
    list.push(article);
    byCategory.set(article.category, list);
  }

  const selected: CandidateArticle[] = [];
  for (const [category, list] of byCategory.entries()) {
    const sorted = [...list].sort(byRecency);
    selected.push(...sorted.slice(0, MAX_ARTICLES_PER_CATEGORY[category]));
  }
  return selected;
}
