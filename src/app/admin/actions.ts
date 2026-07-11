"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateYoutubeInsight } from "@/lib/gemini";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) throw new Error("관리자만 사용할 수 있습니다.");

  return supabase;
}

export async function createYoutubeInsightAction(youtubeUrl: string) {
  const supabase = await requireAdmin();

  const trimmed = youtubeUrl.trim();
  if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(trimmed)) {
    throw new Error("유튜브 링크 형식이 아니에요.");
  }

  const draft = await generateYoutubeInsight(trimmed);

  const { error } = await supabase.from("youtube_insights").insert({
    youtube_url: trimmed,
    video_title: draft.video_title,
    headline: draft.headline,
    keywords: draft.keywords,
    summary: draft.summary,
    key_arguments: draft.key_arguments,
    economic_meaning: draft.economic_meaning,
    insight: draft.insight,
    concepts: draft.concepts,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/insights");
}

export async function deleteYoutubeInsightAction(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("youtube_insights").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/insights");
}

export async function deleteArticleAction(articleId: string, publishedDate: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("articles").delete().eq("id", articleId);
  if (error) throw new Error(error.message);

  const { data: digest } = await admin
    .from("daily_digest")
    .select("article_ids")
    .eq("date", publishedDate)
    .maybeSingle();

  if (digest) {
    await admin
      .from("daily_digest")
      .update({ article_ids: digest.article_ids.filter((id) => id !== articleId) })
      .eq("date", publishedDate);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/archive/${publishedDate}`);
}
