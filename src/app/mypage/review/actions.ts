"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function resolveReviewAction(
  answers: Record<string, boolean>
): Promise<{ resolvedCount: number; total: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const answerIds = Object.keys(answers);
  if (answerIds.length === 0) return { resolvedCount: 0, total: 0 };

  const { data: rows, error: rowsError } = await supabase
    .from("quiz_answers")
    .select("id, question_id")
    .in("id", answerIds);

  if (rowsError || !rows) throw new Error(rowsError?.message ?? "오답 정보를 불러오지 못했습니다.");

  const questionIds = [...new Set(rows.map((r) => r.question_id))];
  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("id, correct_answer")
    .in("id", questionIds);

  if (questionsError || !questions) {
    throw new Error(questionsError?.message ?? "문제 정보를 불러오지 못했습니다.");
  }

  const correctByQuestion = new Map(questions.map((q) => [q.id, q.correct_answer]));

  let resolvedCount = 0;
  for (const row of rows) {
    const userAnswer = answers[row.id];
    const isCorrect = correctByQuestion.get(row.question_id) === userAnswer;
    if (isCorrect) {
      const { error } = await supabase
        .from("quiz_answers")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", row.id);
      if (!error) resolvedCount += 1;
    }
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/review");

  return { resolvedCount, total: rows.length };
}
