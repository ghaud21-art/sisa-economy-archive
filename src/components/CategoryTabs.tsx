import Link from "next/link";
import type { ArticleCategory } from "@/types/database";

const TABS: { label: string; value: ArticleCategory | "all" }[] = [
  { label: "전체", value: "all" },
  { label: "시사·경제", value: "economy_affairs" },
  { label: "AI", value: "ai" },
];

export default function CategoryTabs({
  basePath,
  active,
}: {
  basePath: string;
  active: ArticleCategory | "all";
}) {
  return (
    <div className="mb-6 flex gap-2">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={tab.value === "all" ? basePath : `${basePath}?category=${tab.value}`}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            active === tab.value
              ? "bg-accent text-accent-foreground shadow-sm"
              : "border border-card-border text-foreground/70 hover:border-accent hover:text-accent"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
