"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [interest, setInterest] = useState("");
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
      options: { data: { nickname, interest: interest || null } },
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
        <h1 className="mb-4 text-2xl font-extrabold">이메일을 확인해주세요</h1>
        <p className="text-sm text-foreground/70">
          {email} 주소로 확인 메일을 보냈어요. 메일함에서 링크를 눌러 가입을 완료해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-extrabold">회원가입</h1>
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
            className="w-full rounded-xl border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="interest" className="mb-1 block text-sm font-medium">
            관심 분야 / 직업 <span className="font-normal text-foreground/40">(선택)</span>
          </label>
          <input
            id="interest"
            type="text"
            placeholder="예: 반도체 산업, 스타트업 창업, 개발자"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="w-full rounded-xl border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <p className="mt-1 text-xs text-foreground/45">
            입력하면 마이페이지에서 이 분야 관점의 맞춤 인사이트를 볼 수 있어요.
          </p>
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
            className="w-full rounded-xl border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
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
            className="w-full rounded-xl border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>
      <p className="mt-4 text-sm text-foreground/60">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
