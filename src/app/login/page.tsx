"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "이메일 또는 비밀번호가 올바르지 않아요."
          : error.message
      );
      return;
    }

    const redirectTo = searchParams.get("redirectTo") ?? "/";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">로그인</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            이메일
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-transparent dark:focus:border-white/40"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-transparent dark:focus:border-white/40"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
      <p className="mt-4 text-sm text-black/60 dark:text-white/60">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
