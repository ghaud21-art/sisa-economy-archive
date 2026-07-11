import type { ArticleCategory } from "@/types/database";

export interface CandidateArticle {
  title: string;
  link: string;
  source: string;
  category: ArticleCategory;
  publishedAt: string;
  snippet: string;
}
