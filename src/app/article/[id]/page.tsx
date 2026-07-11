import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatDateKo } from "@/lib/dates";
import { stripMarkdown } from "@/lib/text";

const CATEGORY_STYLE = {
  economy_affairs: { label: "시사·경제", className: "bg-info-soft text-info" },
  ai: { label: "AI", className: "bg-violet-soft text-violet" },
} as const;

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("article_reads")
      .upsert({ user_id: user.id, article_id: article.id }, { onConflict: "user_id,article_id" });
  }

  const category = CATEGORY_STYLE[article.category];

  return (
    <article>
      <div className="mb-4 flex items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${category.className}`}>
          {category.label}
        </span>
        <span className="text-foreground/50">{article.source}</span>
        <span className="text-foreground/50">· {formatDateKo(article.published_date)}</span>
      </div>

      <h1 className={`text-2xl font-extrabold leading-tight ${article.headline ? "mb-1" : "mb-4"}`}>
        {article.headline ?? article.title}
      </h1>
      {article.headline && (
        <p className="mb-4 text-xs text-foreground/45">원제목: {article.title}</p>
      )}

      <div className="mb-6 flex flex-wrap gap-1.5">
        {article.keywords.map((kw) => (
          <span
            key={kw}
            className="rounded-full border border-card-border px-2 py-0.5 text-xs text-foreground/60"
          >
            #{kw}
          </span>
        ))}
      </div>

      <Section title="종합 요약" accent="accent">
        {stripMarkdown(article.summary)}
      </Section>
      <Section title="현실 적용 인사이트" accent="info">
        {stripMarkdown(article.insight)}
      </Section>
      <Section title="미래 예측" accent="violet">
        {stripMarkdown(article.prediction)}
      </Section>

      {article.concepts.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-bold text-amber-foreground">
            추가로 공부하면 좋은 개념
          </h2>
          <dl className="space-y-3">
            {article.concepts.map((c) => (
              <div key={c.term} className="rounded-2xl border border-card-border bg-amber-soft p-3">
                <dt className="mb-1 text-sm font-semibold">{stripMarkdown(c.term)}</dt>
                <dd className="text-sm text-foreground/70">{stripMarkdown(c.explanation)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <a
        href={article.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-accent hover:underline"
      >
        원문 기사 보기 ({article.source}) →
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
  title,
  accent,
  children,
}: {
  title: string;
  accent: "accent" | "info" | "violet";
  children: string;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-card-border bg-card p-4 shadow-sm">
      <h2 className={`mb-2 text-sm font-bold ${ACCENT_TEXT_CLASS[accent]}`}>{title}</h2>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}
