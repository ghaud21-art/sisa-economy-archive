"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitQuizAction(date: string, answers: Record<string, boolean>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("date", date);

  if (questionsError || !questions || questions.length === 0) {
    throw new Error("퀴즈 문제를 불러오지 못했습니다.");
  }

  const total = questions.length;
  let score = 0;
  const answerRows = questions.map((q) => {
    const userAnswer = answers[q.id];
    const isCorrect = userAnswer === q.correct_answer;
    if (isCorrect) score += 1;
    return {
      question_id: q.id,
      user_answer: userAnswer ?? false,
      is_correct: isCorrect,
    };
  });

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      date,
      score,
      total,
      correct_rate: Math.round((score / total) * 1000) / 10,
    })
    .select()
    .single();

  if (attemptError || !attempt) {
    throw new Error(attemptError?.message ?? "채점 결과 저장에 실패했습니다.");
  }

  const { error: answersError } = await supabase
    .from("quiz_answers")
    .insert(answerRows.map((row) => ({ ...row, attempt_id: attempt.id })));

  if (answersError) {
    throw new Error(answersError.message);
  }

  revalidatePath(`/quiz/${date}`);
}
