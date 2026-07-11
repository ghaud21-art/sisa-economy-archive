import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStreak, formatDateKo, getMonthInfo, todayKst } from "@/lib/dates";
import QuizCalendar from "@/components/QuizCalendar";

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/mypage");

  const monthInfo = getMonthInfo(month);

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("date, score, total, correct_rate")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  const allAttempts = attempts ?? [];
  const streak = computeStreak(allAttempts.map((a) => a.date), todayKst());

  const monthAttempts = allAttempts.filter((a) => a.date.startsWith(monthInfo.monthKey));
  const monthAvg =
    monthAttempts.length > 0
      ? Math.round(
          (monthAttempts.reduce((sum, a) => sum + a.correct_rate, 0) / monthAttempts.length) * 10
        ) / 10
      : null;

  const ratesByDate: Record<string, number> = {};
  for (const a of monthAttempts) ratesByDate[a.date] = a.correct_rate;

  // 오답노트: 최근 응시 중 틀린 문제 모음
  const { data: recentAttempts } = await supabase
    .from("quiz_attempts")
    .select("id, date")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(14);

  const attemptIds = (recentAttempts ?? []).map((a) => a.id);
  const attemptDateById = new Map((recentAttempts ?? []).map((a) => [a.id, a.date]));

  let wrongItems: {
    date: string;
    question_text: string;
    explanation: string;
    related_article_id: string | null;
  }[] = [];

  if (attemptIds.length > 0) {
    const { data: wrongAnswers } = await supabase
      .from("quiz_answers")
      .select("attempt_id, question_id")
      .in("attempt_id", attemptIds)
      .eq("is_correct", false);

    if (wrongAnswers && wrongAnswers.length > 0) {
      const questionIds = [...new Set(wrongAnswers.map((w) => w.question_id))];
      const { data: questions } = await supabase
        .from("quiz_questions")
        .select("id, question_text, explanation, related_article_id")
        .in("id", questionIds);

      const questionById = new Map((questions ?? []).map((q) => [q.id, q]));
      wrongItems = wrongAnswers
        .map((w) => {
          const q = questionById.get(w.question_id);
          const date = attemptDateById.get(w.attempt_id);
          if (!q || !date) return null;
          return {
            date,
            question_text: q.question_text,
            explanation: q.explanation,
            related_article_id: q.related_article_id,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">마이페이지</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="연속 학습" value={`${streak}일`} />
        <StatCard label={`${monthInfo.month}월 평균 정답률`} value={monthAvg !== null ? `${monthAvg}%` : "-"} />
        <StatCard label={`${monthInfo.month}월 응시 횟수`} value={`${monthAttempts.length}회`} />
      </div>

      <div className="mb-10 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <QuizCalendar monthInfo={monthInfo} ratesByDate={ratesByDate} />
      </div>

      <h2 className="mb-4 text-lg font-bold">오답노트</h2>
      {wrongItems.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">최근 틀린 문제가 없어요.</p>
      ) : (
        <div className="space-y-3">
          {wrongItems.map((item, i) => (
            <div key={i} className="rounded-xl border border-black/10 p-4 dark:border-white/10">
              <p className="mb-1 text-xs text-black/50 dark:text-white/50">{formatDateKo(item.date)}</p>
              <p className="mb-2 text-sm font-medium leading-relaxed">{item.question_text}</p>
              <p className="text-sm text-black/70 dark:text-white/70">{item.explanation}</p>
              {item.related_article_id && (
                <Link
                  href={`/article/${item.related_article_id}`}
                  className="mt-2 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  관련 기사 다시 보기 →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 p-4 text-center dark:border-white/10">
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-black/60 dark:text-white/60">{label}</p>
    </div>
  );
}
