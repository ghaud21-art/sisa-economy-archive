import { GoogleGenAI } from "@google/genai";

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

위 뉴스들을 "${interest}" 관점에서 다시 읽었을 때 특별히 주목할 만한 부분을 3~4문장으로 짚어줘. 그 분야/직업에 실질적으로 어떤 의미가 있는지, 어떻게 참고하면 좋을지 구체적으로 알려줘. 관련 없는 뉴스는 무시하고, 정말 연관 있는 내용 위주로 작성해.`,
  });

  return response.text?.trim() ?? "";
}
