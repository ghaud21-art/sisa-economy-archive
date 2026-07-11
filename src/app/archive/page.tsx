import Link from "next/link";
import { listArchiveDates } from "@/lib/data";
import { formatDateKo } from "@/lib/dates";

export default async function ArchivePage() {
  const days = await listArchiveDates();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">아카이브</h1>

      {days.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">아직 아카이브된 발행분이 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {days.map((day) => (
            <li key={day.date}>
              <Link
                href={`/archive/${day.date}`}
                className="block rounded-xl border border-black/10 p-4 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold">{formatDateKo(day.date)}</span>
                  <span className="text-xs text-black/50 dark:text-white/50">
                    기사 {day.article_count}건
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-black/70 dark:text-white/70">
                  {day.overview_text}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
