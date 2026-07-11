import type { ArticleCategory } from "@/types/database";

export interface RssSource {
  name: string;
  url: string;
  category: ArticleCategory;
}

// 실제 접속 확인된 RSS 피드 목록 (구현 시점 기준). 언론사가 URL을 바꾸면 여기만 수정하면 됩니다.
export const RSS_SOURCES: RssSource[] = [
  { name: "연합뉴스 경제", url: "https://www.yna.co.kr/rss/economy.xml", category: "economy_affairs" },
  { name: "연합뉴스 정치", url: "https://www.yna.co.kr/rss/politics.xml", category: "economy_affairs" },
  { name: "한국경제 경제", url: "https://www.hankyung.com/feed/economy", category: "economy_affairs" },
  { name: "AI타임스", url: "https://www.aitimes.com/rss/allArticle.xml", category: "ai" },
  { name: "한국경제 IT", url: "https://www.hankyung.com/feed/it", category: "ai" },
  { name: "전자신문", url: "https://rss.etnews.com/Section901.xml", category: "ai" },
];

// 한 소스가 카테고리 선별을 독점하지 않도록 소스당 최대 후보 수를 제한
export const MAX_CANDIDATES_PER_SOURCE = 6;

// 일반 IT 피드(한국경제 IT, 전자신문)는 AI 기사만 걸러내기 위한 키워드 필터
export const AI_KEYWORD_FILTER = ["AI", "인공지능", "생성형", "LLM", "챗GPT", "머신러닝", "딥러닝", "AI반도체", "GPU"];

export const NAVER_QUERIES: { query: string; category: ArticleCategory }[] = [
  { query: "경제", category: "economy_affairs" },
  { query: "시사 이슈", category: "economy_affairs" },
  { query: "인공지능 AI", category: "ai" },
];

export const MAX_ARTICLES_PER_CATEGORY: Record<ArticleCategory, number> = {
  economy_affairs: 8,
  ai: 6,
};
