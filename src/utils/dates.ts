function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getToday(): string {
  return localDateStr(new Date());
}

export function getDateDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return localDateStr(d);
}

export function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return localDateStr(d);
  });
}

export function getDayLabel(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getWeeksBack(weeksBack: number): string[][] {
  return Array.from({ length: weeksBack }, (_, weekIdx) => {
    const offset = (weeksBack - 1 - weekIdx) * 7;
    return Array.from({ length: 7 }, (_, dayIdx) => {
      return getDateDaysAgo(offset + (6 - dayIdx));
    }).reverse();
  });
}

export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort((a, b) => b.localeCompare(a));
  const today = getToday();
  let streak = 0;
  let cursor = today;
  for (const date of sorted) {
    if (date === cursor) {
      streak++;
      const d = new Date(cursor + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      cursor = localDateStr(d);
    } else if (date < cursor) {
      break;
    }
    // Future-dated entries are ignored so timezone drift does not extend today's streak.
  }
  return streak;
}

export function calculateBestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = [...new Set(dates)].sort((a, b) => a.localeCompare(b));
  let best = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + 'T00:00:00');
    prev.setDate(prev.getDate() + 1);
    if (localDateStr(prev) === unique[i]) {
      run++;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}

export function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00').getTime();
  const b = new Date(to + 'T00:00:00').getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
