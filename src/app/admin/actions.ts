"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// 실제 영상 분석은 GitHub Actions 배치(scripts/process-youtube-insights.ts)가 처리한다.
// 여기서는 대기열에 등록만 하고 바로 반환해서 Vercel의 요청 타임아웃(최대 60초)을 피한다.
export async function requestYoutubeInsightAction(youtubeUrl: string) {
  const supabase = await requireAdmin();

  const trimmed = youtubeUrl.trim();
  if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(trimmed)) {
    throw new Error("유튜브 링크 형식이 아니에요.");
  }

  const { error } = await supabase.from("youtube_insight_requests").insert({
    youtube_url: trimmed,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function retryYoutubeInsightRequestAction(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("youtube_insight_requests")
    .update({ status: "pending", error_message: null, processed_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function deleteYoutubeInsightRequestAction(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("youtube_insight_requests").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
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
