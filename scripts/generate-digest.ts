import { config } from "dotenv";

// Next.js 컨벤션인 .env.local을 로컬 실행 시 로드 (GitHub Actions 등 CI에서는 파일이 없어 조용히 무시됨)
config({ path: ".env.local" });
import { fetchAllRssArticles } from "./lib/rss";
import { fetchAllNaverArticles } from "./lib/naver";
import { dedupeArticles, selectTopArticles } from "./lib/select";
import { analyzeArticle, generateDailyOverview, generateQuiz } from "./lib/gemini";
import { getSupabaseAdmin } from "./lib/supabase-admin";
import type { CandidateArticle } from "./lib/types";
import type { Article } from "@/types/database";

function todayKst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

async function main() {
  const date = todayKst();
  console.log(`[digest] ${date} 배치 시작`);

  const [rssArticles, naverArticles] = await Promise.all([
    fetchAllRssArticles(),
    fetchAllNaverArticles(),
  ]);
  console.log(`[digest] RSS ${rssArticles.length}건, 네이버 ${naverArticles.length}건 수집`);

  const deduped = dedupeArticles([...rssArticles, ...naverArticles]);
  const selected = selectTopArticles(deduped);
  console.log(`[digest] 중복제거 후 ${deduped.length}건, 선별 ${selected.length}건`);

  if (selected.length === 0) {
    console.log("[digest] 선별된 기사가 없어 종료합니다.");
    return;
  }

  const analyzedArticles: (CandidateArticle & Omit<Article, "id" | "created_at" | "published_date">)[] = [];

  for (const candidate of selected) {
    const analysis = await analyzeArticle(candidate);
    if (!analysis) continue;
    analyzedArticles.push({
      ...candidate,
      title: candidate.title,
      source: candidate.source,
      source_url: candidate.link,
      category: candidate.category,
      keywords: analysis.keywords,
      summary: analysis.summary,
      insight: analysis.insight,
      prediction: analysis.prediction,
      concepts: analysis.concepts,
    });
  }
  console.log(`[digest] Gemini 분석 완료: ${analyzedArticles.length}/${selected.length}건`);

  if (analyzedArticles.length === 0) {
    console.log("[digest] 분석된 기사가 없어 종료합니다.");
    return;
  }

  const supabase = getSupabaseAdmin();

  const { data: insertedArticles, error: articlesError } = await supabase
    .from("articles")
    .upsert(
      analyzedArticles.map((a) => ({
        published_date: date,
        category: a.category,
        title: a.title,
        source: a.source,
        source_url: a.source_url,
        keywords: a.keywords,
        summary: a.summary,
        insight: a.insight,
        prediction: a.prediction,
        concepts: a.concepts,
      })),
      { onConflict: "source_url" }
    )
    .select();

  if (articlesError) {
    console.error("[digest] 기사 저장 실패:", articlesError.message);
    return;
  }
  console.log(`[digest] 기사 ${insertedArticles?.length ?? 0}건 저장 완료`);

  const savedArticles = insertedArticles ?? [];

  const overview = await generateDailyOverview(
    savedArticles.map((a) => a.title),
    savedArticles.map((a) => a.summary)
  );

  const { error: digestError } = await supabase.from("daily_digest").upsert({
    date,
    overview_text: overview,
    article_ids: savedArticles.map((a) => a.id),
  });
  if (digestError) {
    console.error("[digest] 다이제스트 저장 실패:", digestError.message);
  } else {
    console.log("[digest] 오늘의 다이제스트 저장 완료");
  }

  const quizDrafts = await generateQuiz(
    savedArticles.map((a) => ({ title: a.title, summary: a.summary }))
  );
  console.log(`[digest] 퀴즈 문항 ${quizDrafts.length}개 생성`);

  if (quizDrafts.length > 0) {
    await supabase.from("quiz_questions").delete().eq("date", date);

    const { error: quizError } = await supabase.from("quiz_questions").insert(
      quizDrafts
        .filter((q) => savedArticles[q.articleIndex])
        .map((q) => ({
          date,
          question_text: q.question_text,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          related_article_id: savedArticles[q.articleIndex].id,
        }))
    );
    if (quizError) {
      console.error("[digest] 퀴즈 저장 실패:", quizError.message);
    } else {
      console.log("[digest] 퀴즈 저장 완료");
    }
  }

  console.log("[digest] 배치 종료");
}

main().catch((err) => {
  console.error("[digest] 배치 실행 중 치명적 오류:", err);
  process.exit(1);
});
