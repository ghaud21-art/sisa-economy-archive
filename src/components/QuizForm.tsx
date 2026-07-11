"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitQuizAction } from "@/app/quiz/[date]/actions";

interface QuizFormQuestion {
  id: string;
  question_text: string;
}

export default function QuizForm({
  date,
  questions,
}: {
  date: string;
  questions: QuizFormQuestion[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await submitQuizAction(date, answers);
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-2xl border border-card-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium leading-relaxed">
            {i + 1}. {q.question_text}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: true }))}
              className={`flex-1 rounded-xl border-2 py-2 text-sm font-bold transition ${
                answers[q.id] === true
                  ? "border-info bg-info text-info-foreground"
                  : "border-card-border hover:border-info"
              }`}
            >
              O
            </button>
            <button
              type="button"
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: false }))}
              className={`flex-1 rounded-xl border-2 py-2 text-sm font-bold transition ${
                answers[q.id] === false
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
        {isPending ? "채점 중..." : allAnswered ? "제출하고 채점하기" : `${Object.keys(answers).length}/${questions.length}개 답변함`}
      </button>
    </div>
  );
}
