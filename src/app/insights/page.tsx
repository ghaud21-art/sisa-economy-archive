import Link from "next/link";
import { listYoutubeInsights, markInsightsSeen } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatDateKo } from "@/lib/dates";
import { stripMarkdown } from "@/lib/text";

export default async function InsightsPage() {
  const insights = await listYoutubeInsights();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await markInsightsSeen(user.id);
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold">📺 지식 인사이트</h1>
      <p className="mb-8 text-sm text-foreground/60">새로운 지식 인사이트를 확인해보세요.</p>

      {insights.length === 0 ? (
        <p className="text-sm text-foreground/60">아직 등록된 인사이트가 없어요.</p>
      ) : (
        <div className="space-y-4">
          {insights.map((item) => (
            <Link
              key={item.id}
              href={`/insights/${item.id}`}
              className="block rounded-2xl border border-card-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="mb-1 text-xs text-foreground/50">{formatDateKo(item.published_at)}</p>
              <h2 className="mb-2 text-lg font-bold leading-snug">{item.headline}</h2>
              <p className="mb-3 line-clamp-2 text-sm text-foreground/70">
                {stripMarkdown(item.summary)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.keywords.slice(0, 5).map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full border border-card-border px-2 py-0.5 text-xs text-foreground/60"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
