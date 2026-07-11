import { createClient } from "@/lib/supabase/server";
import { generatePersonalInsight } from "@/lib/gemini";
import { stripMarkdown } from "@/lib/text";
import { addDaysUtc, todayKst } from "@/lib/dates";
import type { Article, ArticleCategory, YoutubeInsight } from "@/types/database";

export async function listYoutubeInsights(limit = 30): Promise<YoutubeInsight[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("youtube_insights")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listYoutubeInsights error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getYoutubeInsightById(id: string): Promise<YoutubeInsight | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("youtube_insights")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getYoutubeInsightById error:", error.message);
    return null;
  }
  return data;
}

export async function hasNewYoutubeInsight(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const [{ data: profile }, { data: latest }] = await Promise.all([
    supabase.from("profiles").select("last_seen_insights_at").eq("id", userId).maybeSingle(),
    supabase
      .from("youtube_insights")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!latest) return false;
  if (!profile?.last_seen_insights_at) return true;
  return new Date(latest.created_at) > new Date(profile.last_seen_insights_at);
}

export async function markInsightsSeen(userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ last_seen_insights_at: new Date().toISOString() })
    .eq("id", userId);
}

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

export interface KeywordRank {
  keyword: string;
  count: number;
  category: ArticleCategory | "mixed";
}

// 최근 N일간 기사에 등장한 키워드 빈도 랭킹
export async function getTopKeywords(days = 7, limit = 20): Promise<KeywordRank[]> {
  const supabase = await createClient();
  const since = addDaysUtc(todayKst(), -(days - 1));

  const { data, error } = await supabase
    .from("articles")
    .select("keywords, category")
    .gte("published_date", since);

  if (error || !data) {
    if (error) console.error("getTopKeywords error:", error.message);
    return [];
  }

  const countByKeyword = new Map<string, number>();
  const categoriesByKeyword = new Map<string, Set<ArticleCategory>>();

  for (const article of data) {
    for (const keyword of article.keywords) {
      countByKeyword.set(keyword, (countByKeyword.get(keyword) ?? 0) + 1);
      const cats = categoriesByKeyword.get(keyword) ?? new Set();
      cats.add(article.category);
      categoriesByKeyword.set(keyword, cats);
    }
  }

  return [...countByKeyword.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword, count]) => {
      const cats = categoriesByKeyword.get(keyword)!;
      const category: ArticleCategory | "mixed" = cats.size > 1 ? "mixed" : [...cats][0];
      return { keyword, count, category };
    });
}

export async function getWeeklyLeaderboard() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_weekly_leaderboard");
  if (error) {
    console.error("getWeeklyLeaderboard error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getBookmarkedArticleIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bookmarks").select("article_id").eq("user_id", userId);
  if (error) {
    console.error("getBookmarkedArticleIds error:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((b) => b.article_id));
}

export async function getBookmarkedArticles(userId: string): Promise<Article[]> {
  const supabase = await createClient();
  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("article_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !bookmarks || bookmarks.length === 0) {
    if (error) console.error("getBookmarkedArticles error:", error.message);
    return [];
  }

  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .in(
      "id",
      bookmarks.map((b) => b.article_id)
    );

  const articleById = new Map((articles ?? []).map((a) => [a.id, a]));
  return bookmarks
    .map((b) => articleById.get(b.article_id))
    .filter((a): a is Article => a !== undefined);
}

export interface UnresolvedWrongItem {
  answerId: string;
  date: string;
  question_text: string;
}

// 오답노트와 동일한 범위(최근 응시 14회) 안에서, 아직 복습으로 못 맞힌 오답만 모은다
export async function getUnresolvedWrongItems(userId: string): Promise<UnresolvedWrongItem[]> {
  const supabase = await createClient();

  const { data: recentAttempts } = await supabase
    .from("quiz_attempts")
    .select("id, date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(14);

  const attemptIds = (recentAttempts ?? []).map((a) => a.id);
  if (attemptIds.length === 0) return [];

  const attemptDateById = new Map((recentAttempts ?? []).map((a) => [a.id, a.date]));

  const { data: wrongAnswers } = await supabase
    .from("quiz_answers")
    .select("id, attempt_id, question_id")
    .in("attempt_id", attemptIds)
    .eq("is_correct", false)
    .is("resolved_at", null);

  if (!wrongAnswers || wrongAnswers.length === 0) return [];

  const questionIds = [...new Set(wrongAnswers.map((w) => w.question_id))];
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, question_text")
    .in("id", questionIds);

  const questionById = new Map((questions ?? []).map((q) => [q.id, q]));

  return wrongAnswers
    .map((w) => {
      const q = questionById.get(w.question_id);
      const date = attemptDateById.get(w.attempt_id);
      if (!q || !date) return null;
      return { answerId: w.id, date, question_text: stripMarkdown(q.question_text) };
    })
    .filter((x): x is UnresolvedWrongItem => x !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
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
