import { getTopKeywords } from "@/lib/data";

const CATEGORY_STYLE: Record<string, { label: string; className: string }> = {
  economy_affairs: { label: "시사·경제", className: "bg-info-soft text-info" },
  ai: { label: "AI", className: "bg-violet-soft text-violet" },
  mixed: { label: "복합", className: "bg-amber-soft text-amber-foreground" },
};

export default async function TrendsPage() {
  const keywords = await getTopKeywords(7, 20);
  const maxCount = keywords[0]?.count ?? 1;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold">키워드 트렌드</h1>
      <p className="mb-8 text-sm text-foreground/60">최근 7일간 가장 자주 등장한 키워드예요.</p>

      {keywords.length === 0 ? (
        <p className="text-sm text-foreground/60">아직 집계할 데이터가 없어요.</p>
      ) : (
        <ol className="space-y-2">
          {keywords.map((k, i) => {
            const category = CATEGORY_STYLE[k.category];
            const barWidth = Math.max(8, Math.round((k.count / maxCount) * 100));
            return (
              <li
                key={k.keyword}
                className="relative overflow-hidden rounded-xl border border-card-border bg-card px-4 py-3"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-accent-soft"
                  style={{ width: `${barWidth}%` }}
                />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-sm font-bold text-foreground/40">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold">#{k.keyword}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${category.className}`}>
                      {category.label}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-foreground/60">
                    {k.count}회
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
