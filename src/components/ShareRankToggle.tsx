"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ShareRankToggle({
  userId,
  initialShared,
}: {
  userId: string;
  initialShared: boolean;
}) {
  const router = useRouter();
  const [shared, setShared] = useState(initialShared);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !shared;
    setShared(next);
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("profiles").update({ share_rank: next }).eq("id", userId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="flex items-center gap-2 rounded-full border border-card-border bg-card px-3 py-1.5 text-xs font-medium hover:border-accent"
    >
      <span
        className={`relative h-4 w-7 rounded-full transition ${shared ? "bg-accent" : "bg-card-border"}`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${shared ? "left-3.5" : "left-0.5"}`}
        />
      </span>
      정답률 랭킹에 닉네임 공개
    </button>
  );
}
