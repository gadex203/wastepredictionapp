function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function getLocalYmd(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function startOfIsoWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const isoDay = day === 0 ? 7 : day;
  d.setDate(d.getDate() - (isoDay - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekId(date: Date) {
  const weekStart = startOfIsoWeek(date);
  const year = weekStart.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const jan4Start = startOfIsoWeek(jan4);
  const diffDays = Math.floor((weekStart.getTime() - jan4Start.getTime()) / 86400000);
  const week = 1 + Math.floor(diffDays / 7);
  return `${year}-W${pad2(week)}`;
}

