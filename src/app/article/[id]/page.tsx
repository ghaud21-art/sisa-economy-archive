import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatDateKo } from "@/lib/dates";

const CATEGORY_LABEL = {
  economy_affairs: "시사·경제",
  ai: "AI",
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

  return (
    <article>
      <div className="mb-4 flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
        <span className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/10">
          {CATEGORY_LABEL[article.category]}
        </span>
        <span>{article.source}</span>
        <span>· {formatDateKo(article.published_date)}</span>
      </div>

      <h1 className="mb-4 text-2xl font-bold leading-tight">{article.title}</h1>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {article.keywords.map((kw) => (
          <span
            key={kw}
            className="rounded-full border border-black/10 px-2 py-0.5 text-xs text-black/60 dark:border-white/10 dark:text-white/60"
          >
            #{kw}
          </span>
        ))}
      </div>

      <Section title="종합 요약">{article.summary}</Section>
      <Section title="현실 적용 인사이트">{article.insight}</Section>
      <Section title="미래 예측">{article.prediction}</Section>

      {article.concepts.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-black/60 dark:text-white/60">
            추가로 공부하면 좋은 개념
          </h2>
          <dl className="space-y-3">
            {article.concepts.map((c) => (
              <div key={c.term} className="rounded-lg border border-black/10 p-3 dark:border-white/10">
                <dt className="mb-1 text-sm font-semibold">{c.term}</dt>
                <dd className="text-sm text-black/70 dark:text-white/70">{c.explanation}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <a
        href={article.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        원문 기사 보기 ({article.source}) →
      </a>
    </article>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-black/60 dark:text-white/60">{title}</h2>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}
