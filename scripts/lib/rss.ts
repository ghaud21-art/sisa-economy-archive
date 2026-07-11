import Parser from "rss-parser";
import { AI_KEYWORD_FILTER, RSS_SOURCES, type RssSource } from "./sources";
import type { CandidateArticle } from "./types";

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; SisaEconomyArchiveBot/1.0)" },
});

// 한국경제 IT / 전자신문처럼 IT 전반을 다루는 피드는 AI 관련 기사만 통과시킨다.
const GENERAL_IT_SOURCES = new Set(["한국경제 IT", "전자신문"]);

function isAiRelated(title: string, snippet: string): boolean {
  const text = `${title} ${snippet}`;
  return AI_KEYWORD_FILTER.some((kw) => text.includes(kw));
}

async function fetchOneFeed(source: RssSource): Promise<CandidateArticle[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const items = (feed.items ?? []).map((item) => ({
      title: (item.title ?? "").trim(),
      link: (item.link ?? "").trim(),
      source: source.name,
      category: source.category,
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      snippet: (item.contentSnippet ?? item.content ?? "").trim().slice(0, 500),
    }));

    if (GENERAL_IT_SOURCES.has(source.name)) {
      return items.filter((it) => isAiRelated(it.title, it.snippet));
    }
    return items.filter((it) => it.title && it.link);
  } catch (err) {
    console.error(`[rss] ${source.name} 수집 실패:`, (err as Error).message);
    return [];
  }
}

export async function fetchAllRssArticles(): Promise<CandidateArticle[]> {
  const results = await Promise.all(RSS_SOURCES.map(fetchOneFeed));
  return results.flat();
}
