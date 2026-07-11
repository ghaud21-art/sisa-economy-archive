import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUnresolvedWrongItems } from "@/lib/data";
import ReviewQuizForm from "@/components/ReviewQuizForm";

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/mypage/review");

  const items = await getUnresolvedWrongItems(user.id);

  return (
    <div>
      <Link href="/mypage" className="text-sm text-foreground/60 hover:text-accent">
        ← 마이페이지
      </Link>
      <h1 className="mb-2 mt-2 text-2xl font-extrabold">오답만 다시 풀기</h1>
      <p className="mb-6 text-sm text-foreground/60">
        맞히면 오답노트에서 사라지고, 틀리면 그대로 남아있어요.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-foreground/60">복습할 오답이 없어요. 다 잘 알고 계시네요!</p>
      ) : (
        <ReviewQuizForm items={items.map((i) => ({ answerId: i.answerId, question_text: i.question_text }))} />
      )}
    </div>
  );
}
