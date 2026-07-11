import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasNewYoutubeInsight } from "@/lib/data";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let hasNewInsight = false;
  if (user) {
    const [{ data: profile }, newInsight] = await Promise.all([
      supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle(),
      hasNewYoutubeInsight(user.id),
    ]);
    isAdmin = profile?.is_admin ?? false;
    hasNewInsight = newInsight;
  }

  return (
    <header className="border-b border-card-border">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-y-2 px-4 py-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-accent">
          뉴스 아카이브
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/" className="hover:text-accent">
            오늘의 뉴스
          </Link>
          <Link href="/archive" className="hover:text-accent">
            아카이브
          </Link>
          <Link href="/insights" className="relative hover:text-accent">
            지식 인사이트
            {hasNewInsight && (
              <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-accent" />
            )}
          </Link>
          {user ? (
            <>
              <Link href="/trends" className="hover:text-accent">
                트렌드
              </Link>
              <Link href="/leaderboard" className="hover:text-accent">
                랭킹
              </Link>
              <Link href="/mypage" className="hover:text-accent">
                마이페이지
              </Link>
              {isAdmin && (
                <Link href="/admin" className="hover:text-accent">
                  관리자
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-accent">
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-4 py-1.5 font-semibold text-accent-foreground shadow-sm hover:opacity-90"
              >
                회원가입
              </Link>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
