import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateKo } from "@/lib/dates";
import QuizForm from "@/components/QuizForm";
import type { QuizAnswer } from "@/types/database";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function QuizPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!DATE_RE.test(date)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/quiz/${date}`);

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("date", date)
    .order("created_at", { ascending: true });

  if (!questions || questions.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-extrabold">{formatDateKo(date)} 퀴즈</h1>
        <p className="text-sm text-foreground/60">아직 이 날짜의 퀴즈가 준비되지 않았어요.</p>
      </div>
    );
  }

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  const { data: articles } = await supabase
    .from("articles")
    .select("id")
    .eq("published_date", date);

  const articleIds = (articles ?? []).map((a) => a.id);
  let readCount = 0;
  if (articleIds.length > 0) {
    const { count } = await supabase
      .from("article_reads")
      .select("article_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("article_id", articleIds);
    readCount = count ?? 0;
  }

  if (!attempt) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-extrabold">{formatDateKo(date)} 퀴즈</h1>
        <p className="mb-6 rounded-2xl border border-card-border bg-accent-soft px-4 py-3 text-sm text-foreground/80">
          오늘 기사 {articleIds.length}건 중 <span className="font-bold text-accent">{readCount}건</span>을
          읽었어요. 기사를 다 읽고 나서 퀴즈를 풀면 더 정확하게 이해도를 점검할 수 있어요.
        </p>
        <QuizForm date={date} questions={questions.map((q) => ({ id: q.id, question_text: q.question_text }))} />
      </div>
    );
  }

  const { data: answers } = await supabase
    .from("quiz_answers")
    .select("*")
    .eq("attempt_id", attempt.id);

  const answersByQuestion = new Map<string, QuizAnswer>((answers ?? []).map((a) => [a.question_id, a]));

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold">{formatDateKo(date)} 퀴즈 결과</h1>
      <div className="mb-8 rounded-2xl border border-card-border bg-accent-soft p-5 text-center shadow-sm">
        <p className="text-3xl font-extrabold text-accent">
          {attempt.score} / {attempt.total}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground/70">
          정답률 {attempt.correct_rate}%
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const answer = answersByQuestion.get(q.id);
          const isCorrect = answer?.is_correct ?? false;
          return (
            <div
              key={q.id}
              className={`rounded-2xl border p-4 shadow-sm ${
                isCorrect ? "border-card-border bg-card" : "border-accent/40 bg-accent-soft"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium leading-relaxed">
                  {i + 1}. {q.question_text}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isCorrect ? "bg-info-soft text-info" : "bg-accent text-accent-foreground"
                  }`}
                >
                  {isCorrect ? "정답" : "오답"}
                </span>
              </div>
              <p className="mb-1 text-xs text-foreground/60">
                내 답: {answer?.user_answer ? "O" : "X"} · 정답: {q.correct_answer ? "O" : "X"}
              </p>
              <p className="text-sm text-foreground/70">{q.explanation}</p>
              {q.related_article_id && (
                <Link
                  href={`/article/${q.related_article_id}`}
                  className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
                >
                  관련 기사 다시 보기 →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
