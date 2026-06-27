export function minutesToHHMM(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`;
}

export function formatProtein(grams: number): string {
  return `${Math.round(grams)}g`;
}

export function formatBedtime(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

export function pplLabel(type: string): string {
  const map: Record<string, string> = {
    push: 'Push Day',
    pull: 'Pull Day',
    legs: 'Legs Day',
    rest: 'Rest Day',
  };
  return map[type] ?? type;
}

export function pplSubtitle(type: string): string {
  const map: Record<string, string> = {
    push: 'Chest / Shoulders / Tri',
    pull: 'Back / Biceps / Rear Delt',
    legs: 'Quads / Hamstrings / Calves',
    rest: 'Active recovery',
  };
  return map[type] ?? '';
}
