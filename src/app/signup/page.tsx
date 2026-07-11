"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });

    setLoading(false);
    if (error) {
      setError(
        error.message === "User already registered"
          ? "이미 가입된 이메일이에요."
          : error.message
      );
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setNeedsEmailConfirm(true);
    }
  }

  if (needsEmailConfirm) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <h1 className="mb-4 text-2xl font-bold">이메일을 확인해주세요</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          {email} 주소로 확인 메일을 보냈어요. 메일함에서 링크를 눌러 가입을 완료해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">회원가입</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nickname" className="mb-1 block text-sm font-medium">
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-transparent dark:focus:border-white/40"
          />
        </div>
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
            minLength={6}
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
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>
      <p className="mt-4 text-sm text-black/60 dark:text-white/60">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
