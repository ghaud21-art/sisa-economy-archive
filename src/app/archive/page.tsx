import Link from "next/link";
import { listArchiveDates } from "@/lib/data";
import { formatDateKo } from "@/lib/dates";

export default async function ArchivePage() {
  const days = await listArchiveDates();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">아카이브</h1>

      {days.length === 0 ? (
        <p className="text-sm text-foreground/60">아직 아카이브된 발행분이 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {days.map((day) => (
            <li key={day.date}>
              <Link
                href={`/archive/${day.date}`}
                className="block rounded-2xl border border-card-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold">{formatDateKo(day.date)}</span>
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                    기사 {day.article_count}건
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-foreground/70">{day.overview_text}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
