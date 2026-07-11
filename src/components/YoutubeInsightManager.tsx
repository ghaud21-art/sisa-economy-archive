"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteYoutubeInsightAction,
  deleteYoutubeInsightRequestAction,
  requestYoutubeInsightAction,
  retryYoutubeInsightRequestAction,
} from "@/app/admin/actions";

interface InsightSummary {
  id: string;
  video_title: string;
  headline: string;
  published_at: string;
}

interface RequestSummary {
  id: string;
  youtube_url: string;
  status: "pending" | "success" | "failed";
  error_message: string | null;
  created_at: string;
}

const REQUEST_STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending: { label: "대기 중", className: "bg-amber-soft text-amber-foreground" },
  success: { label: "완료", className: "bg-info-soft text-info" },
  failed: { label: "실패", className: "bg-accent text-accent-foreground" },
};

export default function YoutubeInsightManager({
  items,
  requests,
}: {
  items: InsightSummary[];
  requests: RequestSummary[];
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      try {
        await requestYoutubeInsightAction(url);
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

  function handleRetry(id: string) {
    startTransition(async () => {
      try {
        await retryYoutubeInsightRequestAction(id);
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  function handleDeleteRequest(id: string) {
    startTransition(async () => {
      try {
        await deleteYoutubeInsightRequestAction(id);
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <div>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row">
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
          대기열에 등록
        </button>
      </div>
      <p className="mb-4 text-xs text-foreground/50">
        등록하면 최대 30분 내 자동으로 분석돼요. 바로 처리하고 싶으면 GitHub 저장소의 Actions 탭에서
        &ldquo;Process YouTube Insight Requests&rdquo; 워크플로를 수동 실행하세요.
      </p>
      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {requests.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-foreground/60">요청 대기열</h3>
          <ul className="space-y-2">
            {requests.map((req) => {
              const status = REQUEST_STATUS_STYLE[req.status];
              return (
                <li
                  key={req.id}
                  className="rounded-xl border border-card-border bg-card px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                      <span className="truncate text-sm">{req.youtube_url}</span>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {req.status === "failed" && (
                        <button
                          type="button"
                          onClick={() => handleRetry(req.id)}
                          disabled={isPending}
                          className="rounded-full border border-card-border px-3 py-1 text-xs hover:border-accent hover:text-accent"
                        >
                          재시도
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(req.id)}
                        disabled={isPending}
                        className="rounded-full border border-card-border px-3 py-1 text-xs hover:border-accent hover:text-accent"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  {req.status === "failed" && req.error_message && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{req.error_message}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <h3 className="mb-2 text-sm font-semibold text-foreground/60">발행된 인사이트</h3>
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
