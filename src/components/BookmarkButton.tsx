"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BookmarkButton({
  articleId,
  userId,
  initialBookmarked,
  size = "md",
}: {
  articleId: string;
  userId: string;
  initialBookmarked: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const next = !bookmarked;
    setBookmarked(next);

    startTransition(async () => {
      const supabase = createClient();
      if (next) {
        await supabase.from("bookmarks").insert({ user_id: userId, article_id: articleId });
      } else {
        await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", userId)
          .eq("article_id", articleId);
      }
      router.refresh();
    });
  }

  const dimension = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "북마크 해제" : "북마크"}
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full border transition ${
        bookmarked
          ? "border-accent bg-accent text-accent-foreground"
          : "border-card-border bg-card text-foreground/50 hover:border-accent hover:text-accent"
      }`}
    >
      <svg viewBox="0 0 20 20" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
        <path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v14l-5-3.2-5 3.2v-14Z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
