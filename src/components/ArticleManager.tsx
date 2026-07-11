"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteArticleAction } from "@/app/admin/actions";

interface ArticleSummary {
  id: string;
  headline: string | null;
  title: string;
  category: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  economy_affairs: "시사·경제",
  ai: "AI",
};

export default function ArticleManager({ date, items }: { date: string; items: ArticleSummary[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, label: string) {
    if (!confirm(`"${label}" 기사를 삭제할까요? 이 기사에 연결된 퀴즈 문항도 함께 영향을 받아요.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await deleteArticleAction(id, date);
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-foreground/60">이 날짜에 발행된 기사가 없어요.</p>;
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <ul className="space-y-2">
        {items.map((item) => {
          const label = item.headline ?? item.title;
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-card-border bg-card px-4 py-3"
            >
              <div className="min-w-0">
                <span className="mr-2 rounded-full bg-info-soft px-2 py-0.5 text-xs font-medium text-info">
                  {CATEGORY_LABEL[item.category] ?? item.category}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id, label)}
                disabled={isPending}
                className="shrink-0 rounded-full border border-card-border px-3 py-1 text-xs hover:border-accent hover:text-accent"
              >
                삭제
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
