import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="mx-auto max-w-sm text-center">
      <h1 className="mb-4 text-2xl font-extrabold">인증 링크가 만료됐어요</h1>
      <p className="mb-6 text-sm text-foreground/70">
        이메일 인증 링크가 유효하지 않거나 이미 사용됐어요. 다시 회원가입을 시도하거나
        로그인해주세요.
      </p>
      <div className="flex justify-center gap-3">
        <Link
          href="/signup"
          className="rounded-full border border-card-border px-4 py-2 text-sm hover:border-accent hover:text-accent"
        >
          다시 회원가입
        </Link>
        <Link
          href="/login"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm hover:opacity-90"
        >
          로그인
        </Link>
      </div>
    </div>
  );
}
