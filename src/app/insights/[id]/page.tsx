import { notFound } from "next/navigation";
import { getYoutubeInsightById } from "@/lib/data";
import { formatDateKo } from "@/lib/dates";
import { stripMarkdown } from "@/lib/text";

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getYoutubeInsightById(id);
  if (!item) notFound();

  return (
    <article>
      <p className="mb-2 text-xs text-foreground/50">
        {formatDateKo(item.published_at)} · {item.video_title}
      </p>
      <h1 className="mb-3 text-2xl font-extrabold leading-tight">📺 {item.headline}</h1>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {item.keywords.map((kw) => (
          <span
            key={kw}
            className="rounded-full border border-card-border px-2 py-0.5 text-xs text-foreground/60"
          >
            #{kw}
          </span>
        ))}
      </div>

      <Section emoji="📝" title="전체 요약" accent="accent">
        {stripMarkdown(item.summary)}
      </Section>
      <Section emoji="🔍" title="주요 주장 및 논리 구조" accent="info">
        {stripMarkdown(item.key_arguments)}
      </Section>
      <Section emoji="📈" title="경제/시사적 의미" accent="violet">
        {stripMarkdown(item.economic_meaning)}
      </Section>
      <Section emoji="🏃" title="현실 적용 인사이트" accent="accent">
        {stripMarkdown(item.insight)}
      </Section>

      {item.concepts.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-bold text-amber-foreground">📚 추가로 공부해야 할 개념 정리</h2>
          <dl className="space-y-3">
            {item.concepts.map((c) => (
              <div key={c.term} className="rounded-2xl border border-card-border bg-amber-soft p-3">
                <dt className="mb-1 text-sm font-semibold">{stripMarkdown(c.term)}</dt>
                <dd className="text-sm text-foreground/70">{stripMarkdown(c.explanation)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <a
        href={item.youtube_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm hover:opacity-90"
      >
        ▶ 전체 영상 보기
      </a>
    </article>
  );
}

const ACCENT_TEXT_CLASS = {
  accent: "text-accent",
  info: "text-info",
  violet: "text-violet",
} as const;

function Section({
  emoji,
  title,
  accent,
  children,
}: {
  emoji: string;
  title: string;
  accent: "accent" | "info" | "violet";
  children: string;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-card-border bg-card p-4 shadow-sm">
      <h2 className={`mb-2 text-sm font-bold ${ACCENT_TEXT_CLASS[accent]}`}>
        {emoji} {title}
      </h2>
      <p className="whitespace-pre-line text-sm leading-relaxed">{children}</p>
    </div>
  );
}
