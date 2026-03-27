const TZ = "Asia/Shanghai";

export function todayISO() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date());
}

export function monthISO(date = todayISO()) {
  return date.slice(0, 7);
}

export function formatDateLabel(date: string) {
  const [, m, d] = date.split("-");
  return `${m}月${d}日`;
}

export function formatMonthLabel(month: string) {
  const [y, m] = month.split("-");
  return `${y}年${m}月`;
}
