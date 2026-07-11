export function todayKst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export function formatDateKo(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function addDaysUtc(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

// 문자열(YYYY-MM-DD) 배열로부터 오늘(혹은 어제)부터 이어지는 연속 학습일 수를 계산
export function computeStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  let cursor = set.has(today) ? today : addDaysUtc(today, -1);
  if (!set.has(cursor)) return 0;

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDaysUtc(cursor, -1);
  }
  return streak;
}

export interface MonthInfo {
  year: number;
  month: number; // 1-12
  monthKey: string; // YYYY-MM
  daysInMonth: number;
  firstWeekday: number; // 0(일)~6(토)
  prevMonthKey: string;
  nextMonthKey: string;
  label: string;
}

export function getMonthInfo(monthKey?: string): MonthInfo {
  const today = todayKst();
  const [defaultYear, defaultMonth] = today.split("-").map(Number);
  let year = defaultYear;
  let month = defaultMonth;

  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
    const [y, m] = monthKey.split("-").map(Number);
    year = y;
    month = m;
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const prevDate = new Date(Date.UTC(year, month - 2, 1));
  const nextDate = new Date(Date.UTC(year, month, 1));

  return {
    year,
    month,
    monthKey: `${year}-${pad2(month)}`,
    daysInMonth,
    firstWeekday,
    prevMonthKey: `${prevDate.getUTCFullYear()}-${pad2(prevDate.getUTCMonth() + 1)}`,
    nextMonthKey: `${nextDate.getUTCFullYear()}-${pad2(nextDate.getUTCMonth() + 1)}`,
    label: `${year}년 ${month}월`,
  };
}
