import Link from "next/link";
import type { MonthInfo } from "@/lib/dates";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function levelClass(rate: number | null): string {
  if (rate === null) return "bg-card border border-card-border text-foreground/40";
  if (rate >= 80) return "bg-emerald-500 text-white";
  if (rate >= 50) return "bg-amber text-amber-foreground";
  return "bg-accent text-accent-foreground";
}

export default function QuizCalendar({
  monthInfo,
  ratesByDate,
}: {
  monthInfo: MonthInfo;
  ratesByDate: Record<string, number>;
}) {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const cells: { date: string | null; day: number | null }[] = [];

  for (let i = 0; i < monthInfo.firstWeekday; i++) {
    cells.push({ date: null, day: null });
  }
  for (let day = 1; day <= monthInfo.daysInMonth; day++) {
    cells.push({ date: `${monthInfo.monthKey}-${pad2(day)}`, day });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`/mypage?month=${monthInfo.prevMonthKey}`}
          className="rounded-full border border-card-border px-3 py-1 text-sm hover:border-accent hover:text-accent"
        >
          ← 이전달
        </Link>
        <h2 className="text-base font-bold">{monthInfo.label}</h2>
        <Link
          href={`/mypage?month=${monthInfo.nextMonthKey}`}
          className="rounded-full border border-card-border px-3 py-1 text-sm hover:border-accent hover:text-accent"
        >
          다음달 →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-foreground/50">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="pb-1">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={`empty-${i}`} />;
          const rate = ratesByDate[cell.date] ?? null;
          return (
            <Link
              key={cell.date}
              href={`/quiz/${cell.date}`}
              className={`flex aspect-square items-center justify-center rounded-lg text-xs font-medium transition hover:opacity-80 ${levelClass(rate)}`}
            >
              {cell.day}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
