import Link from "next/link";
import {
  getArticlesByDate,
  getBookmarkedArticleIds,
  getDailyDigest,
  getLatestPublishedDate,
} from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { todayKst, formatDateKo } from "@/lib/dates";
import { stripMarkdown } from "@/lib/text";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [articles, digest, bookmarkedIds] = await Promise.all([
    getArticlesByDate(date, validCategory),
    getDailyDigest(date),
    user ? getBookmarkedArticleIds(user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold">오늘의 뉴스</h1>
        <p className="mt-1 text-sm text-foreground/60">{formatDateKo(date)}</p>
        {date !== today && (
          <p className="mt-2 rounded-xl bg-amber-soft px-3 py-2 text-sm font-medium text-amber-foreground">
            오늘자 발행이 아직 준비되지 않아 가장 최근({formatDateKo(date)}) 발행분을 보여드리고 있어요.
          </p>
        )}
      </div>

      {digest && (
        <div className="mb-8 rounded-2xl border border-card-border bg-accent-soft p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-accent">오늘의 종합 다이제스트</h2>
          <p className="text-sm leading-relaxed">{stripMarkdown(digest.overview_text)}</p>
          <Link
            href={`/quiz/${date}`}
            className="mt-4 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground shadow-sm hover:opacity-90"
          >
            오늘의 O/X 퀴즈 풀기 →
          </Link>
        </div>
      )}

      <CategoryTabs basePath="/" active={validCategory ?? "all"} />

      {articles.length === 0 ? (
        <p className="text-sm text-foreground/60">아직 발행된 기사가 없어요.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              userId={user?.id}
              isBookmarked={bookmarkedIds.has(article.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
