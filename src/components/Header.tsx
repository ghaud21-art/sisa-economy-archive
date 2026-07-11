import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          뉴스 아카이브
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">
            오늘의 뉴스
          </Link>
          <Link href="/archive" className="hover:underline">
            아카이브
          </Link>
          {user ? (
            <>
              <Link href="/mypage" className="hover:underline">
                마이페이지
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-foreground px-3 py-1.5 text-background hover:opacity-90"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
