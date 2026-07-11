import { GoogleGenAI, Type } from "@google/genai";
import type { ArticleConcept } from "@/types/database";
import type { CandidateArticle } from "./types";

const MODEL = "gemini-2.5-flash";

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return client;
}

export interface ArticleAnalysis {
  headline: string;
  keywords: string[];
  summary: string;
  insight: string;
  prediction: string;
  concepts: ArticleConcept[];
}

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headline: {
      type: Type.STRING,
      description: "기사 원제목 대신 보여줄, 핵심을 담은 한 문장 헤드라인 (25자 내외, 클릭베이트 표현 제거)",
    },
    keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "핵심 키워드 5개" },
    summary: { type: Type.STRING, description: "3~5문장 종합 요약" },
    insight: { type: Type.STRING, description: "이 뉴스를 실생활/업무에 어떻게 적용할 수 있는지에 대한 인사이트" },
    prediction: { type: Type.STRING, description: "이 뉴스로 인해 향후 일어날 수 있는 일에 대한 현실적인 예측" },
    concepts: {
      type: Type.ARRAY,
      description: "이 기사를 이해하기 위해 추가로 공부하면 좋은 개념/용어 2~4개",
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ["term", "explanation"],
      },
    },
  },
  required: ["headline", "keywords", "summary", "insight", "prediction", "concepts"],
};

export async function analyzeArticle(article: CandidateArticle): Promise<ArticleAnalysis | null> {
  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: `다음은 오늘자 뉴스 기사의 제목과 요약문입니다.

제목: ${article.title}
출처: ${article.source}
본문 요약/스니펫: ${article.snippet}

이 기사를 한국어로 분석해서 아래 JSON 스키마에 맞춰 작성해줘.
- headline: 원제목의 낚시성 표현이나 언론사 특유의 말투를 걷어내고, 핵심 사실만 담은 한 문장 헤드라인 (25자 내외)
- keywords: 핵심 키워드 5개 (명사 위주, 짧게)
- summary: 기사 내용을 3~5문장으로 종합 요약
- insight: 이 뉴스를 실생활이나 업무에 어떻게 적용할 수 있을지 구체적인 인사이트
- prediction: 이 뉴스로 인해 향후 일어날 수 있는 일에 대한 현실적인 예측
- concepts: 이 기사를 제대로 이해하는 데 필요한 배경 개념/용어 2~4개와 짧은 설명

중요: 인물 이름, 직함, 소속, 수치 등 사실 정보는 반드시 위에 주어진 제목/스니펫에 있는 내용만 사용해. 스니펫에 없는 정보는 너의 사전 지식으로 추측하거나 채워넣지 마.
모든 텍스트는 **, #, - 같은 마크다운 기호 없이 순수 텍스트로만 작성해.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as ArticleAnalysis;
  } catch (err) {
    console.error(`[gemini] 기사 분석 실패 (${article.title}):`, (err as Error).message);
    return null;
  }
}

const DISTINCT_SELECTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    selectedIndices: {
      type: Type.ARRAY,
      items: { type: Type.INTEGER },
      description: "선택된 기사들의 0-based 인덱스 목록",
    },
  },
  required: ["selectedIndices"],
};

// 같은 실제 사건을 다룬 기사가 여러 소스에서 중복 수집됐을 때, 서로 다른 사건만 남기고 대표 1건씩만 선택
export async function selectDistinctArticles(
  candidates: { title: string; snippet: string; source: string }[],
  maxCount: number
): Promise<number[]> {
  if (candidates.length <= maxCount) {
    return candidates.map((_, i) => i);
  }

  const listInput = candidates
    .map((c, i) => `[${i}] (${c.source}) ${c.title}\n${c.snippet.slice(0, 150)}`)
    .join("\n\n");

  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: `아래는 후보 뉴스 기사 목록(인덱스, 출처, 제목, 스니펫)이다:\n\n${listInput}\n\n이 중에서 서로 다른 실제 사건/이슈를 다루는 기사를 최대 ${maxCount}개 골라줘.
- 같은 사건(예: 같은 인물의 같은 순방, 같은 기업의 같은 발표)을 다룬 기사가 여러 개 있으면 그 중 정보가 가장 풍부하고 구체적인 것 1개만 남기고 나머지는 제외해.
- 운세/부고/게시판 같은 단신성 콘텐츠보다는 실질적인 시사·경제·AI 뉴스 가치가 있는 기사를 우선해.
- 남은 자리 안에서 최대한 다양한 주제를 다루도록 선택해.
- selectedIndices에 최종 선택된 기사의 인덱스만 담아줘.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: DISTINCT_SELECTION_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return candidates.map((_, i) => i).slice(0, maxCount);
    const parsed = JSON.parse(text) as { selectedIndices: number[] };
    const indices = (parsed.selectedIndices ?? []).filter(
      (i) => Number.isInteger(i) && i >= 0 && i < candidates.length
    );
    return indices.length > 0 ? indices.slice(0, maxCount) : candidates.map((_, i) => i).slice(0, maxCount);
  } catch (err) {
    console.error("[gemini] 기사 중복 선별 실패, 최신순으로 대체:", (err as Error).message);
    return candidates.map((_, i) => i).slice(0, maxCount);
  }
}

export async function generateDailyOverview(
  analyzedTitles: string[],
  analyzedSummaries: string[]
): Promise<string> {
  const digestInput = analyzedTitles
    .map((title, i) => `${i + 1}. ${title}\n   ${analyzedSummaries[i]}`)
    .join("\n\n");

  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: `오늘 수집된 시사/경제/AI 뉴스 목록이다:\n\n${digestInput}\n\n위 뉴스들을 관통하는 오늘의 흐름을 한국어로 4~6문장의 종합 다이제스트로 작성해줘. 개별 기사 나열이 아니라 오늘 하루의 시사/경제/AI 이슈를 하나의 흐름으로 엮어서 설명해줘. **, #, - 같은 마크다운 기호 없이 순수 텍스트로만 작성해.`,
  });

  return response.text?.trim() ?? "";
}

export interface QuizQuestionDraft {
  articleIndex: number;
  question_text: string;
  correct_answer: boolean;
  explanation: string;
}

const QUIZ_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          articleIndex: { type: Type.INTEGER, description: "이 문제가 기반한 기사의 0-based 인덱스" },
          question_text: { type: Type.STRING, description: "O/X로 답할 수 있는 퀴즈 질문" },
          correct_answer: { type: Type.BOOLEAN },
          explanation: { type: Type.STRING, description: "정답 해설 (오답노트에 표시됨)" },
        },
        required: ["articleIndex", "question_text", "correct_answer", "explanation"],
      },
    },
  },
  required: ["questions"],
};

export async function generateQuiz(
  analyses: { title: string; summary: string }[]
): Promise<QuizQuestionDraft[]> {
  const articlesInput = analyses
    .map((a, i) => `[${i}] ${a.title}\n${a.summary}`)
    .join("\n\n");

  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: `아래는 오늘의 뉴스 기사 목록(인덱스, 제목, 요약)이다:\n\n${articlesInput}\n\n이 기사들의 내용을 정확히 읽었는지 확인할 수 있는 O/X 퀴즈를 8~10문항 만들어줘.
- 각 문제는 특정 기사 하나의 사실 관계에 기반해야 하고, articleIndex로 어느 기사인지 표시해줘.
- 너무 쉬운 문제만 내지 말고, 헷갈릴 수 있는 디테일(숫자, 주체, 시점 등)을 활용한 문제도 섞어줘.
- O(참)와 X(거짓) 문제 비율을 비슷하게 맞춰줘. X 문제를 만들 때는 위 요약에 있는 인물/기관/숫자 중 하나를 의도적으로 다른 값으로 바꿔서 틀린 문장을 만들어.
- 인물 이름, 직함, 기관명, 숫자 등은 반드시 위 요약에 적힌 대로만 사용해. 요약에 없는 이름이나 사실을 너의 사전 지식으로 채워넣지 마. 대통령·기관장 등 직함이 붙은 인물은 요약에 언급된 이름을 그대로 써야 하고, 임의로 다른 인물 이름으로 바꾸면 안 돼(단, 의도적으로 틀린 X 문제를 만드는 경우는 예외).
- explanation에는 왜 그것이 정답인지 기사 내용을 근거로 간단히 설명해줘.
- question_text와 explanation은 **, #, - 같은 마크다운 기호 없이 순수 텍스트로만 작성해.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: QUIZ_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return [];
    const parsed = JSON.parse(text) as { questions: QuizQuestionDraft[] };
    return parsed.questions ?? [];
  } catch (err) {
    console.error("[gemini] 퀴즈 생성 실패:", (err as Error).message);
    return [];
  }
}
