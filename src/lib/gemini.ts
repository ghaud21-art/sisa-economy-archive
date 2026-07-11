import { GoogleGenAI, Type } from "@google/genai";
import type { ArticleConcept } from "@/types/database";

const MODEL = "gemini-2.5-flash";

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return client;
}

// 사용자의 관심분야/직업 관점에서 오늘 뉴스를 재해석한 맞춤 인사이트 (마이페이지용)
export async function generatePersonalInsight(
  interest: string,
  overviewText: string,
  articleSummaries: { title: string; summary: string }[]
): Promise<string> {
  const articlesInput = articleSummaries.map((a) => `- ${a.title}: ${a.summary}`).join("\n");

  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: `사용자의 관심분야/직업은 "${interest}"이다.

오늘의 종합 다이제스트:
${overviewText}

오늘의 기사 목록:
${articlesInput}

위 뉴스들을 "${interest}" 관점에서 다시 읽었을 때 특별히 주목할 만한 부분을 3~4문장으로 짚어줘. 그 분야/직업에 실질적으로 어떤 의미가 있는지, 어떻게 참고하면 좋을지 구체적으로 알려줘. 관련 없는 뉴스는 무시하고, 정말 연관 있는 내용 위주로 작성해. **, #, - 같은 마크다운 기호 없이 순수 텍스트로만 작성해.`,
  });

  return response.text?.trim() ?? "";
}

export interface YoutubeInsightDraft {
  video_title: string;
  headline: string;
  keywords: string[];
  summary: string;
  key_arguments: string;
  economic_meaning: string;
  insight: string;
  concepts: ArticleConcept[];
}

const YOUTUBE_INSIGHT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    video_title: { type: Type.STRING, description: "영상의 실제 제목" },
    headline: { type: Type.STRING, description: "영상 내용을 압축한 한 줄 제목 (25자 내외)" },
    keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "핵심 키워드/해시태그 5개" },
    summary: { type: Type.STRING, description: "영상 전체 내용을 아우르는 종합 요약 (5~8문장)" },
    key_arguments: {
      type: Type.STRING,
      description: "영상이 전개하는 주요 주장과 논리 구조를 단락 형태로 정리",
    },
    economic_meaning: {
      type: Type.STRING,
      description: "이 내용이 갖는 경제적·시사적 의미와 배경",
    },
    insight: {
      type: Type.STRING,
      description: "시청자가 실생활/업무/투자 등에 실제로 적용할 수 있는 구체적인 인사이트",
    },
    concepts: {
      type: Type.ARRAY,
      description: "영상을 제대로 이해하는 데 필요한 배경 개념/용어 3~5개와 설명",
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
  required: [
    "video_title",
    "headline",
    "keywords",
    "summary",
    "key_arguments",
    "economic_meaning",
    "insight",
    "concepts",
  ],
};

// 유튜브 영상 링크를 Gemini가 직접 시청/분석해서 구조화된 지식 인사이트를 생성 (관리자 전용)
export async function generateYoutubeInsight(youtubeUrl: string): Promise<YoutubeInsightDraft> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { fileData: { fileUri: youtubeUrl } },
          {
            text: `이 유튜브 영상을 시청하고 시사/경제/AI 학습 콘텐츠로 정리해줘. 아래 항목을 한국어로 작성해:
- video_title: 영상의 실제 제목
- headline: 영상 내용을 압축한 한 줄 제목 (25자 내외)
- keywords: 핵심 키워드/해시태그 5개
- summary: 영상 전체 내용을 아우르는 종합 요약 (5~8문장)
- key_arguments: 영상이 전개하는 주요 주장과 논리 구조
- economic_meaning: 이 내용이 갖는 경제적·시사적 의미와 배경
- insight: 실생활/업무/투자 등에 적용할 수 있는 구체적인 인사이트
- concepts: 이해에 필요한 배경 개념/용어 3~5개와 설명

**, #, - 같은 마크다운 기호 없이 순수 텍스트로만 작성해.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: YOUTUBE_INSIGHT_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini가 응답을 생성하지 못했습니다. 영상이 비공개이거나 너무 길 수 있습니다.");
  return JSON.parse(text) as YoutubeInsightDraft;
}
