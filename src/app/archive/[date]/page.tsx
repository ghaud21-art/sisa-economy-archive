import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticlesByDate, getDailyDigest } from "@/lib/data";
import { formatDateKo } from "@/lib/dates";
import { stripMarkdown } from "@/lib/text";
import CategoryTabs from "@/components/CategoryTabs";
import ArticleCard from "@/components/ArticleCard";
import type { ArticleCategory } from "@/types/database";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function ArchiveDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { date } = await params;
  if (!DATE_RE.test(date)) notFound();

  const { category } = await searchParams;
  const validCategory: ArticleCategory | undefined =
    category === "economy_affairs" || category === "ai" ? category : undefined;

  const digest = await getDailyDigest(date);
  if (!digest) notFound();

  const articles = await getArticlesByDate(date, validCategory);

  return (
    <div>
      <div className="mb-6">
        <Link href="/archive" className="text-sm text-foreground/60 hover:text-accent">
          ← 아카이브 목록
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold">{formatDateKo(date)}</h1>
      </div>

      <div className="mb-8 rounded-2xl border border-card-border bg-accent-soft p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-accent">이 날의 종합 다이제스트</h2>
        <p className="text-sm leading-relaxed">{stripMarkdown(digest.overview_text)}</p>
        <Link
          href={`/quiz/${date}`}
          className="mt-4 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground shadow-sm hover:opacity-90"
        >
          이 날의 O/X 퀴즈 풀기 →
        </Link>
      </div>

      <CategoryTabs basePath={`/archive/${date}`} active={validCategory ?? "all"} />

      {articles.length === 0 ? (
        <p className="text-sm text-foreground/60">해당 카테고리의 기사가 없어요.</p>
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
