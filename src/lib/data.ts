import { createClient } from "@/lib/supabase/server";
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
