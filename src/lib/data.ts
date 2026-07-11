import { createClient } from "@/lib/supabase/server";
import { generatePersonalInsight } from "@/lib/gemini";
import { stripMarkdown } from "@/lib/text";
import type { Article, ArticleCategory } from "@/types/database";

export async function getLatestPublishedDate(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("published_date")
    .order("published_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.published_date ?? null;
}

export async function getArticlesByDate(
  date: string,
  category?: ArticleCategory
): Promise<Article[]> {
  const supabase = await createClient();
  let query = supabase
    .from("articles")
    .select("*")
    .eq("published_date", date)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getArticlesByDate error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getDailyDigest(date: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("daily_digest").select("*").eq("date", date).maybeSingle();
  return data;
}

export async function getArticleById(id: string): Promise<Article | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("getArticleById error:", error.message);
    return null;
  }
  return data;
}

export interface ArchiveDay {
  date: string;
  overview_text: string;
  article_count: number;
}

export async function listArchiveDates(limit = 60): Promise<ArchiveDay[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_digest")
    .select("date, overview_text, article_ids")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listArchiveDates error:", error.message);
    return [];
  }

  return (data ?? []).map((d) => ({
    date: d.date,
    overview_text: d.overview_text,
    article_count: d.article_ids?.length ?? 0,
  }));
}

// 관심분야 맞춤 인사이트: 오늘(최신 발행일) 기준 하루 1회 생성 후 캐시
export async function getOrCreatePersonalInsight(
  userId: string,
  interest: string
): Promise<string | null> {
  const date = await getLatestPublishedDate();
  if (!date) return null;

  const supabase = await createClient();
  const { data: cached } = await supabase
    .from("user_insights")
    .select("interest, insight_text")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  // 캐시된 인사이트가 지금 관심분야와 같을 때만 재사용 (관심분야를 바꾸면 새로 생성)
  if (cached && cached.interest === interest) return stripMarkdown(cached.insight_text);

  const digest = await getDailyDigest(date);
  if (!digest) return null;
  const articles = await getArticlesByDate(date);
  if (articles.length === 0) return null;

  const rawInsight = await generatePersonalInsight(
    interest,
    digest.overview_text,
    articles.map((a) => ({ title: a.headline ?? a.title, summary: a.summary }))
  );
  if (!rawInsight) return null;
  const insightText = stripMarkdown(rawInsight);

  await supabase
    .from("user_insights")
    .upsert({ user_id: userId, date, interest, insight_text: insightText }, { onConflict: "user_id,date" });

  return insightText;
}

export interface PersonalInsightHistoryItem {
  date: string;
  interest: string;
  insight_text: string;
}

export async function getPersonalInsightHistory(
  userId: string,
  limit = 30
): Promise<PersonalInsightHistoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_insights")
    .select("date, interest, insight_text")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPersonalInsightHistory error:", error.message);
    return [];
  }

  return (data ?? []).map((d) => ({
    date: d.date,
    interest: d.interest,
    insight_text: stripMarkdown(d.insight_text),
  }));
}
