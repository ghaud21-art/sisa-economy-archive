"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { resolveReviewAction } from "@/app/mypage/review/actions";

interface ReviewItem {
  answerId: string;
  question_text: string;
}

export default function ReviewQuizForm({ items }: { items: ReviewItem[] }) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{ resolvedCount: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allAnswered = items.every((item) => answers[item.answerId] !== undefined);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await resolveReviewAction(answers);
        setResult(res);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-card-border bg-accent-soft p-6 text-center shadow-sm">
        <p className="text-2xl font-extrabold text-accent">
          {result.resolvedCount} / {result.total}
        </p>
        <p className="mt-1 text-sm text-foreground/70">
          이번에 새로 맞힌 문제는 오답노트에서 사라져요. 나머지는 계속 남아있으니 또 도전해보세요.
        </p>
        <Link
          href="/mypage"
          className="mt-4 inline-block rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          마이페이지로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div
          key={item.answerId}
          className="rounded-2xl border border-card-border bg-card p-4 shadow-sm"
        >
          <p className="mb-3 text-sm font-medium leading-relaxed">
            {i + 1}. {item.question_text}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAnswers((a) => ({ ...a, [item.answerId]: true }))}
              className={`flex-1 rounded-xl border-2 py-2 text-sm font-bold transition ${
                answers[item.answerId] === true
                  ? "border-info bg-info text-info-foreground"
                  : "border-card-border hover:border-info"
              }`}
            >
              O
            </button>
            <button
              type="button"
              onClick={() => setAnswers((a) => ({ ...a, [item.answerId]: false }))}
              className={`flex-1 rounded-xl border-2 py-2 text-sm font-bold transition ${
                answers[item.answerId] === false
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-card-border hover:border-accent"
              }`}
            >
              X
            </button>
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allAnswered || isPending}
        className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:opacity-90 disabled:opacity-40"
      >
        {isPending
          ? "채점 중..."
          : allAnswered
            ? "다시 채점하기"
            : `${Object.keys(answers).length}/${items.length}개 답변함`}
      </button>
    </div>
  );
}
