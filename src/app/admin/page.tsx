import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateKo } from "@/lib/dates";
import YoutubeInsightManager from "@/components/YoutubeInsightManager";

// 유튜브 영상 분석(Gemini)이 길게 걸릴 수 있어 Vercel Hobby 한도까지 늘려둔다.
export const maxDuration = 60;

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  success: { label: "성공", className: "bg-info-soft text-info" },
  failed: { label: "실패", className: "bg-accent text-accent-foreground" },
  running: { label: "실행 중", className: "bg-amber-soft text-amber-foreground" },
};

function durationText(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "-";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return `${Math.round(ms / 1000)}초`;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect("/");

  const admin = createAdminClient();

  const [{ data: runs }, { count: userCount }, { data: latestArticle }, { data: youtubeInsights }] =
    await Promise.all([
      admin.from("batch_runs").select("*").order("started_at", { ascending: false }).limit(20),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin
        .from("articles")
        .select("published_date")
        .order("published_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("youtube_insights")
        .select("id, video_title, headline, published_at")
        .order("published_at", { ascending: false }),
    ]);

  const latestDate = latestArticle?.published_date ?? null;

  let latestArticlesCount = 0;
  let latestQuizCount = 0;
  let latestDigestExists = false;
  if (latestDate) {
    const [{ count: articlesCount }, { count: quizCount }, { data: digest }] = await Promise.all([
      admin
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("published_date", latestDate),
      admin.from("quiz_questions").select("id", { count: "exact", head: true }).eq("date", latestDate),
      admin.from("daily_digest").select("date").eq("date", latestDate).maybeSingle(),
    ]);
    latestArticlesCount = articlesCount ?? 0;
    latestQuizCount = quizCount ?? 0;
    latestDigestExists = digest !== null;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">관리자 페이지</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="가입자 수" value={`${userCount ?? 0}명`} />
        <StatCard
          label="최신 발행일"
          value={latestDate ? formatDateKo(latestDate) : "-"}
        />
        <StatCard label="최신 발행 기사" value={`${latestArticlesCount}건`} />
        <StatCard
          label="최신 발행 퀴즈"
          value={`${latestQuizCount}문항${latestDigestExists ? "" : " (다이제스트 없음)"}`}
        />
      </div>

      <h2 className="mb-4 text-lg font-bold">지식 인사이트 (유튜브)</h2>
      <div className="mb-10">
        <YoutubeInsightManager items={youtubeInsights ?? []} />
      </div>

      <h2 className="mb-4 text-lg font-bold">배치 실행 이력</h2>
      {!runs || runs.length === 0 ? (
        <p className="text-sm text-foreground/60">아직 실행 기록이 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-card-border bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-card-border text-xs text-foreground/50">
              <tr>
                <th className="px-4 py-2 font-medium">날짜</th>
                <th className="px-4 py-2 font-medium">상태</th>
                <th className="px-4 py-2 font-medium">기사</th>
                <th className="px-4 py-2 font-medium">퀴즈</th>
                <th className="px-4 py-2 font-medium">소요시간</th>
                <th className="px-4 py-2 font-medium">에러</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const status = STATUS_STYLE[run.status] ?? STATUS_STYLE.running;
                return (
                  <tr key={run.id} className="border-b border-card-border last:border-0">
                    <td className="px-4 py-2 whitespace-nowrap">{formatDateKo(run.date)}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-2">{run.articles_count ?? "-"}</td>
                    <td className="px-4 py-2">{run.quiz_count ?? "-"}</td>
                    <td className="px-4 py-2">{durationText(run.started_at, run.finished_at)}</td>
                    <td className="max-w-[240px] truncate px-4 py-2 text-red-600 dark:text-red-400">
                      {run.error_message ?? ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-card-border bg-card p-4 text-center shadow-sm">
      <p className="text-lg font-extrabold">{value}</p>
      <p className="mt-1 text-xs font-medium text-foreground/60">{label}</p>
    </div>
  );
}
