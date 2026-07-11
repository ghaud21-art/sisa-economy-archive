import Link from "next/link";
import { getArticlesByDate, getDailyDigest, getLatestPublishedDate } from "@/lib/data";
import { todayKst, formatDateKo } from "@/lib/dates";
import CategoryTabs from "@/components/CategoryTabs";
import ArticleCard from "@/components/ArticleCard";
import type { ArticleCategory } from "@/types/database";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const validCategory: ArticleCategory | undefined =
    category === "economy_affairs" || category === "ai" ? category : undefined;

  const today = todayKst();
  const latestDate = await getLatestPublishedDate();
  const date = latestDate ?? today;

  const [articles, digest] = await Promise.all([
    getArticlesByDate(date, validCategory),
    getDailyDigest(date),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">오늘의 뉴스</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">{formatDateKo(date)}</p>
        {date !== today && (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            오늘자 발행이 아직 준비되지 않아 가장 최근({formatDateKo(date)}) 발행분을 보여드리고 있어요.
          </p>
        )}
      </div>

      {digest && (
        <div className="mb-8 rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <h2 className="mb-2 text-sm font-semibold text-black/60 dark:text-white/60">
            오늘의 종합 다이제스트
          </h2>
          <p className="text-sm leading-relaxed">{digest.overview_text}</p>
          <Link
            href={`/quiz/${date}`}
            className="mt-3 inline-block rounded-full bg-foreground px-4 py-1.5 text-sm text-background hover:opacity-90"
          >
            오늘의 O/X 퀴즈 풀기 →
          </Link>
        </div>
      )}

      <CategoryTabs basePath="/" active={validCategory ?? "all"} />

      {articles.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">아직 발행된 기사가 없어요.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
