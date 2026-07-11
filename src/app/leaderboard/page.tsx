import { getWeeklyLeaderboard } from "@/lib/data";

const MEDAL = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const rows = await getWeeklyLeaderboard();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold">이번 주 정답률 랭킹</h1>
      <p className="mb-8 text-sm text-foreground/60">
        최근 7일간 응시 기록 기준, 랭킹 공개에 동의한 사용자만 표시돼요. 마이페이지에서 공개
        여부를 바꿀 수 있어요.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-foreground/60">
          아직 랭킹을 공개한 사용자가 없어요. 마이페이지에서 가장 먼저 공개해보세요!
        </p>
      ) : (
        <ol className="space-y-2">
          {rows.map((row, i) => (
            <li
              key={`${row.nickname}-${i}`}
              className="flex items-center justify-between rounded-xl border border-card-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-center text-sm font-bold text-foreground/50">
                  {MEDAL[i] ?? i + 1}
                </span>
                <span className="text-sm font-semibold">{row.nickname}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-foreground/60">
                <span>{row.attempt_count}회 응시</span>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 font-bold text-accent">
                  {row.avg_correct_rate}%
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
