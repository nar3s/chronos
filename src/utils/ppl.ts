import { PPL_CYCLE, PPL_START_DATE } from '../domain/constants/ppl';
import { daysBetween, getToday } from './dates';
import type { PPLDay } from '../domain/types/gym';

export function getPPLDayForDate(date: string): PPLDay {
  const daysSinceStart = daysBetween(PPL_START_DATE, date);
  const index = ((daysSinceStart % PPL_CYCLE.length) + PPL_CYCLE.length) % PPL_CYCLE.length;
  return PPL_CYCLE[index];
}

export function getTodayPPLDay(): PPLDay {
  return getPPLDayForDate(getToday());
}
