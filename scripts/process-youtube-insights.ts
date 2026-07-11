import { config } from "dotenv";

// Next.js 컨벤션인 .env.local을 로컬 실행 시 로드 (GitHub Actions 등 CI에서는 파일이 없어 조용히 무시됨)
config({ path: ".env.local" });
import { generateYoutubeInsight } from "./lib/gemini";
import { getSupabaseAdmin } from "./lib/supabase-admin";

async function main() {
  const supabase = getSupabaseAdmin();

  const { data: pending, error } = await supabase
    .from("youtube_insight_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[youtube-insights] 대기열 조회 실패:", error.message);
    process.exit(1);
  }

  if (!pending || pending.length === 0) {
    console.log("[youtube-insights] 대기 중인 요청이 없습니다.");
    return;
  }

  console.log(`[youtube-insights] 대기 중인 요청 ${pending.length}건 처리 시작`);

  for (const request of pending) {
    console.log(`[youtube-insights] 처리 중: ${request.youtube_url}`);
    try {
      const draft = await generateYoutubeInsight(request.youtube_url);

      const { error: insertError } = await supabase.from("youtube_insights").insert({
        youtube_url: request.youtube_url,
        video_title: draft.video_title,
        headline: draft.headline,
        keywords: draft.keywords,
        summary: draft.summary,
        key_arguments: draft.key_arguments,
        economic_meaning: draft.economic_meaning,
        insight: draft.insight,
        concepts: draft.concepts,
      });
      if (insertError) throw new Error(insertError.message);

      await supabase
        .from("youtube_insight_requests")
        .update({ status: "success", processed_at: new Date().toISOString() })
        .eq("id", request.id);

      console.log(`[youtube-insights] 완료: ${draft.headline}`);
    } catch (err) {
      const message = (err as Error).message;
      console.error(`[youtube-insights] 실패 (${request.youtube_url}):`, message);
      await supabase
        .from("youtube_insight_requests")
        .update({
          status: "failed",
          error_message: message.slice(0, 500),
          processed_at: new Date().toISOString(),
        })
        .eq("id", request.id);
    }
  }

  console.log("[youtube-insights] 배치 종료");
}

main().catch((err) => {
  console.error("[youtube-insights] 배치 실행 중 치명적 오류:", err);
  process.exit(1);
});
