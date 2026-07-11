"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createYoutubeInsightAction, deleteYoutubeInsightAction } from "@/app/admin/actions";

interface InsightSummary {
  id: string;
  video_title: string;
  headline: string;
  published_at: string;
}

export default function YoutubeInsightManager({ items }: { items: InsightSummary[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      try {
        await createYoutubeInsightAction(url);
        setUrl("");
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteYoutubeInsightAction(id);
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-xl border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending || !url.trim()}
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "분석 중... (최대 1~2분)" : "영상 분석해서 등록"}
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-foreground/60">아직 등록된 지식 인사이트가 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-card-border bg-card px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.headline}</p>
                <p className="truncate text-xs text-foreground/50">{item.video_title}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="shrink-0 rounded-full border border-card-border px-3 py-1 text-xs hover:border-accent hover:text-accent"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
