import Link from "next/link";
import type { Article } from "@/types/database";

const CATEGORY_LABEL: Record<Article["category"], string> = {
  economy_affairs: "시사·경제",
  ai: "AI",
};

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/article/${article.id}`}
      className="block rounded-xl border border-black/10 p-4 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
        <span className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/10">
          {CATEGORY_LABEL[article.category]}
        </span>
        <span>{article.source}</span>
      </div>
      <h3 className="mb-2 text-base font-semibold leading-snug">{article.title}</h3>
      <p className="mb-3 line-clamp-2 text-sm text-black/70 dark:text-white/70">
        {article.summary}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {article.keywords.slice(0, 5).map((kw) => (
          <span
            key={kw}
            className="rounded-full border border-black/10 px-2 py-0.5 text-xs text-black/60 dark:border-white/10 dark:text-white/60"
          >
            #{kw}
          </span>
        ))}
      </div>
    </Link>
  );
}
