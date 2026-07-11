import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreatePersonalInsight } from "@/lib/data";
import { computeStreak, formatDateKo, getMonthInfo, todayKst } from "@/lib/dates";
import { stripMarkdown } from "@/lib/text";
import QuizCalendar from "@/components/QuizCalendar";
import InterestEditor from "@/components/InterestEditor";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("interest")
    .eq("id", user.id)
    .maybeSingle();

  const personalInsight = profile?.interest
    ? await getOrCreatePersonalInsight(user.id, profile.interest)
    : null;

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
      <h1 className="mb-6 text-2xl font-extrabold">마이페이지</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="연속 학습" value={`${streak}일`} tone="amber" />
        <StatCard
          label={`${monthInfo.month}월 평균 정답률`}
          value={monthAvg !== null ? `${monthAvg}%` : "-"}
          tone="accent"
        />
        <StatCard label={`${monthInfo.month}월 응시 횟수`} value={`${monthAttempts.length}회`} tone="violet" />
      </div>

      <div className="mb-8 rounded-2xl border border-card-border bg-accent-soft p-5 shadow-sm">
        {profile?.interest ? (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-accent">
                &ldquo;{profile.interest}&rdquo; 관점의 오늘 인사이트
              </h2>
              <InterestEditor userId={user.id} interest={profile.interest} />
            </div>
            {personalInsight ? (
              <p className="text-sm leading-relaxed">{personalInsight}</p>
            ) : (
              <p className="text-sm text-foreground/60">
                아직 발행된 오늘의 뉴스가 없어서 맞춤 인사이트를 준비하지 못했어요.
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-foreground/70">
              관심분야를 등록하면 그 관점에서 오늘 뉴스를 다시 짚어드려요.
            </p>
            <InterestEditor userId={user.id} interest={null} />
          </div>
        )}
      </div>

      <div className="mb-10 rounded-2xl border border-card-border bg-card p-4 shadow-sm">
        <QuizCalendar monthInfo={monthInfo} ratesByDate={ratesByDate} />
      </div>

      <h2 className="mb-4 text-lg font-bold">오답노트</h2>
      {wrongItems.length === 0 ? (
        <p className="text-sm text-foreground/60">최근 틀린 문제가 없어요.</p>
      ) : (
        <div className="space-y-3">
          {wrongItems.map((item, i) => (
            <div key={i} className="rounded-2xl border border-card-border bg-card p-4 shadow-sm">
              <p className="mb-1 text-xs text-foreground/50">{formatDateKo(item.date)}</p>
              <p className="mb-2 text-sm font-medium leading-relaxed">
                {stripMarkdown(item.question_text)}
              </p>
              <p className="text-sm text-foreground/70">{stripMarkdown(item.explanation)}</p>
              {item.related_article_id && (
                <Link
                  href={`/article/${item.related_article_id}`}
                  className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
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

const STAT_CARD_TONE = {
  amber: "border-amber/30 bg-amber-soft text-amber-foreground",
  accent: "border-accent/30 bg-accent-soft text-accent",
  violet: "border-violet/30 bg-violet-soft text-violet",
} as const;

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: keyof typeof STAT_CARD_TONE;
}) {
  return (
    <div className={`rounded-2xl border p-4 text-center shadow-sm ${STAT_CARD_TONE[tone]}`}>
      <p className="text-xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs font-medium text-foreground/60">{label}</p>
    </div>
  );
}
