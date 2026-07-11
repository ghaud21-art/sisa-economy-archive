import Link from "next/link";
import type { Article } from "@/types/database";

const CATEGORY_STYLE: Record<Article["category"], { label: string; className: string }> = {
  economy_affairs: { label: "시사·경제", className: "bg-info-soft text-info" },
  ai: { label: "AI", className: "bg-violet-soft text-violet" },
};

export default function ArticleCard({ article }: { article: Article }) {
  const category = CATEGORY_STYLE[article.category];
  return (
    <Link
      href={`/article/${article.id}`}
      className="block rounded-2xl border border-card-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${category.className}`}>
          {category.label}
        </span>
        <span className="text-foreground/50">{article.source}</span>
      </div>
      <h3 className="mb-2 text-base font-semibold leading-snug">
        {article.headline ?? article.title}
      </h3>
      <p className="mb-3 line-clamp-2 text-sm text-foreground/70">{article.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {article.keywords.slice(0, 5).map((kw) => (
          <span
            key={kw}
            className="rounded-full border border-card-border px-2 py-0.5 text-xs text-foreground/60"
          >
            #{kw}
          </span>
        ))}
      </div>
    </Link>
  );
}
