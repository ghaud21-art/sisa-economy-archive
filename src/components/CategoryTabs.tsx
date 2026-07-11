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
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            active === tab.value
              ? "bg-foreground text-background"
              : "border border-black/10 text-black/70 hover:border-black/30 dark:border-white/10 dark:text-white/70 dark:hover:border-white/30"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
