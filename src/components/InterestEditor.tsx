"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InterestEditor({
  userId,
  interest,
}: {
  userId: string;
  interest: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(interest ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ interest: value.trim() || null })
      .eq("id", userId);

    setSaving(false);
    if (error) {
      setError("저장에 실패했어요. 다시 시도해주세요.");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="mb-8 rounded-2xl border border-card-border bg-card p-4 shadow-sm">
        <label htmlFor="interest-input" className="mb-1 block text-sm font-semibold">
          관심 분야 / 직업
        </label>
        <div className="flex gap-2">
          <input
            id="interest-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="예: 반도체 산업, 스타트업 창업, 개발자"
            className="w-full rounded-xl border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValue(interest ?? "");
              setError(null);
            }}
            className="shrink-0 rounded-full border border-card-border px-4 py-2 text-sm hover:border-accent hover:text-accent"
          >
            취소
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-xs font-medium text-accent hover:underline"
    >
      {interest ? "관심분야 수정" : "관심분야 등록하기"}
    </button>
  );
}
