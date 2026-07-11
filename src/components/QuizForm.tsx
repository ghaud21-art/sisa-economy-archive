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
        <div key={q.id} className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <p className="mb-3 text-sm font-medium leading-relaxed">
            {i + 1}. {q.question_text}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: true }))}
              className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition ${
                answers[q.id] === true
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-black/15 hover:border-black/30 dark:border-white/15 dark:hover:border-white/30"
              }`}
            >
              O
            </button>
            <button
              type="button"
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: false }))}
              className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition ${
                answers[q.id] === false
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-black/15 hover:border-black/30 dark:border-white/15 dark:hover:border-white/30"
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
        className="w-full rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
      >
        {isPending ? "채점 중..." : allAnswered ? "제출하고 채점하기" : `${Object.keys(answers).length}/${questions.length}개 답변함`}
      </button>
    </div>
  );
}
