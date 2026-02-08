import { WEEKLY_CHALLENGES, type ChallengeId } from '../data/challenges';
import type { AppState } from './appState';
import type { WasteType } from '../utils/types';
import { getWeekId } from '../utils/dates';

export function getTotalConfirmedScans(state: AppState) {
  return state.scanHistory.length;
}

export function getWasteTypeCounts(state: AppState): Record<WasteType, number> {
  const counts: Record<WasteType, number> = {
    plastic: 0,
    paper: 0,
    glass: 0,
    metal: 0,
    battery: 0,
    unknown: 0,
  };

  for (const scan of state.scanHistory) {
    const t = scan.confirmation.selectedWasteType;
    counts[t] = (counts[t] ?? 0) + 1;
  }
  return counts;
}

export type WeeklyChallengeStatus = {
  id: ChallengeId;
  title: string;
  description: string;
  target: number;
  rewardPoints: number;
  progress: number;
  completedAt?: string;
};

export function getWeeklyChallengeStatus(state: AppState, now: Date): WeeklyChallengeStatus[] {
  const weekId = getWeekId(now);
  const completions = state.challengeCompletionsByWeek[weekId] ?? {};

  const weekScans = state.scanHistory.filter((s) => getWeekId(new Date(s.createdAt)) === weekId);
  const weekQuiz = state.quizHistory.filter((q) => getWeekId(new Date(q.completedAt)) === weekId);
  const uniqueTypesThisWeek = new Set(
    weekScans.map((s) => s.confirmation.selectedWasteType).filter((t) => t !== 'unknown'),
  ).size;

  return WEEKLY_CHALLENGES.map((def) => {
    const progress =
      def.kind === 'scan_count'
        ? weekScans.length
        : def.kind === 'unique_types'
          ? uniqueTypesThisWeek
          : weekQuiz.length;

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      target: def.target,
      rewardPoints: def.rewardPoints,
      progress,
      completedAt: completions[def.id]?.completedAt,
    };
  });
}

export function getWeeklyCompletedChallengeCount(state: AppState, now: Date) {
  const weekId = getWeekId(now);
  return Object.keys(state.challengeCompletionsByWeek[weekId] ?? {}).length;
}
