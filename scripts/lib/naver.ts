import { AI_KEYWORD_FILTER, NAVER_QUERIES } from "./sources";
import type { CandidateArticle } from "./types";

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

// 네이버 검색은 검색어 포함 여부만으로 결과를 주기 때문에, "AI" 검색어는 실제로
// AI 키워드가 제목/본문에 들어있는 기사만 통과시켜 오탐(연예/정치 등)을 걸러낸다.
function isRelevant(category: CandidateArticle["category"], title: string, snippet: string): boolean {
  if (category !== "ai") return true;
  const text = `${title} ${snippet}`;
  return AI_KEYWORD_FILTER.some((kw) => text.includes(kw));
}

async function fetchOneQuery(query: string, category: CandidateArticle["category"]): Promise<CandidateArticle[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "15");
  url.searchParams.set("sort", "date");

  try {
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });
    if (!res.ok) {
      console.error(`[naver] "${query}" 검색 실패: HTTP ${res.status}`);
      return [];
    }
    const data = (await res.json()) as {
      items: { title: string; link: string; description: string; pubDate: string }[];
    };
    return data.items
      .map((item) => ({
        title: stripHtml(item.title),
        link: item.link,
        source: "네이버뉴스검색",
        category,
        publishedAt: new Date(item.pubDate).toISOString(),
        snippet: stripHtml(item.description).slice(0, 500),
      }))
      .filter((a) => isRelevant(a.category, a.title, a.snippet));
  } catch (err) {
    console.error(`[naver] "${query}" 검색 에러:`, (err as Error).message);
    return [];
  }
}

export async function fetchAllNaverArticles(): Promise<CandidateArticle[]> {
  const results = await Promise.all(NAVER_QUERIES.map((q) => fetchOneQuery(q.query, q.category)));
  return results.flat();
}
