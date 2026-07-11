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
        <h1 className="mb-4 text-2xl font-bold">{formatDateKo(date)} 퀴즈</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          아직 이 날짜의 퀴즈가 준비되지 않았어요.
        </p>
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
        <h1 className="mb-2 text-2xl font-bold">{formatDateKo(date)} 퀴즈</h1>
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">
          오늘 기사 {articleIds.length}건 중 {readCount}건을 읽었어요. 기사를 다 읽고 나서 퀴즈를
          풀면 더 정확하게 이해도를 점검할 수 있어요.
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
      <h1 className="mb-2 text-2xl font-bold">{formatDateKo(date)} 퀴즈 결과</h1>
      <div className="mb-8 rounded-xl border border-black/10 p-4 text-center dark:border-white/10">
        <p className="text-3xl font-bold">
          {attempt.score} / {attempt.total}
        </p>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
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
              className={`rounded-xl border p-4 ${
                isCorrect
                  ? "border-black/10 dark:border-white/10"
                  : "border-red-300 bg-red-500/5 dark:border-red-900"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium leading-relaxed">
                  {i + 1}. {q.question_text}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isCorrect
                      ? "bg-green-500/15 text-green-700 dark:text-green-400"
                      : "bg-red-500/15 text-red-700 dark:text-red-400"
                  }`}
                >
                  {isCorrect ? "정답" : "오답"}
                </span>
              </div>
              <p className="mb-1 text-xs text-black/60 dark:text-white/60">
                내 답: {answer?.user_answer ? "O" : "X"} · 정답: {q.correct_answer ? "O" : "X"}
              </p>
              <p className="text-sm text-black/70 dark:text-white/70">{q.explanation}</p>
              {q.related_article_id && (
                <Link
                  href={`/article/${q.related_article_id}`}
                  className="mt-2 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
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
