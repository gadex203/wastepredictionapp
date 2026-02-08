import type { ScanHistoryItem, WasteType } from '../utils/types';
import { getLocalYmd, getWeekId } from '../utils/dates';
import { WEEKLY_CHALLENGES, type ChallengeId } from '../data/challenges';
import type { BadgeId } from '../data/badges';

export type BadgeUnlock = {
  id: BadgeId;
  unlockedAt: string;
};

export type SettingsState = {
  hapticsEnabled: boolean;
  reduceMotion: boolean;
  showDemoLeaderboard: boolean;
  selectedModelId: string | null;
};

export type StreakState = {
  current: number;
  best: number;
  lastActiveDate: string | null;
};

export type QuizSession = {
  id: string;
  completedAt: string;
  correct: number;
  total: number;
  awardedPoints: number;
};

export type ChallengeCompletion = {
  completedAt: string;
  rewardPoints: number;
};

export type AppState = {
  displayName: string;
  totalPoints: number;
  streak: StreakState;
  badges: BadgeUnlock[];
  batterySafetyCardRead: boolean;

  scanHistory: ScanHistoryItem[];
  quizHistory: QuizSession[];

  challengeCompletionsByWeek: Record<string, Partial<Record<ChallengeId, ChallengeCompletion>>>;

  settings: SettingsState;
};

export const STORAGE_VERSION = 1;
export const STORAGE_KEY = `sra.appState.v${STORAGE_VERSION}`;

const DEFAULT_NAME = 'Recycling Hero';
const SCAN_CONFIRM_POINTS = 10;
const QUIZ_POINT_PER_CORRECT = 1;

export function createInitialState(): AppState {
  return {
    displayName: DEFAULT_NAME,
    totalPoints: 0,
    streak: { current: 0, best: 0, lastActiveDate: null },
    badges: [],
    batterySafetyCardRead: false,

    scanHistory: [],
    quizHistory: [],

    challengeCompletionsByWeek: {},

    settings: {
      hapticsEnabled: true,
      reduceMotion: false,
      showDemoLeaderboard: true,
      selectedModelId: null,
    },
  };
}

type HydrateAction = { type: 'HYDRATE'; payload: AppState };
type SetDisplayNameAction = { type: 'SET_DISPLAY_NAME'; payload: { displayName: string } };
type ToggleSettingAction = { type: 'TOGGLE_SETTING'; payload: keyof SettingsState };
type SetSelectedModelAction = { type: 'SET_SELECTED_MODEL'; payload: { modelId: string | null } };
type MarkBatteryCardReadAction = { type: 'MARK_BATTERY_CARD_READ' };
type ConfirmScanAction = {
  type: 'CONFIRM_SCAN';
  payload: {
    scan: Omit<ScanHistoryItem, 'confirmation'>;
    selectedWasteType: WasteType;
    confirmedAt: string;
  };
};
type CompleteQuizAction = {
  type: 'COMPLETE_QUIZ';
  payload: { session: Omit<QuizSession, 'awardedPoints'> };
};
type ResetAction = { type: 'RESET' };

export type AppAction =
  | HydrateAction
  | SetDisplayNameAction
  | ToggleSettingAction
  | SetSelectedModelAction
  | MarkBatteryCardReadAction
  | ConfirmScanAction
  | CompleteQuizAction
  | ResetAction;

function unlockBadge(state: AppState, id: BadgeId, unlockedAt: string): AppState {
  if (state.badges.some((b) => b.id === id)) return state;
  return { ...state, badges: [...state.badges, { id, unlockedAt }] };
}

function applyMeaningfulActionForStreak(state: AppState, now: Date): AppState {
  const today = getLocalYmd(now);
  const last = state.streak.lastActiveDate;

  if (last === today) return state;

  const yesterday = getLocalYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const nextCurrent = last === yesterday ? state.streak.current + 1 : 1;
  const nextBest = Math.max(state.streak.best, nextCurrent);

  return {
    ...state,
    streak: { current: nextCurrent, best: nextBest, lastActiveDate: today },
  };
}

function ensureWeekRecord(
  completionsByWeek: AppState['challengeCompletionsByWeek'],
  weekId: string,
) {
  return completionsByWeek[weekId] ? completionsByWeek : { ...completionsByWeek, [weekId]: {} };
}

function maybeCompleteWeeklyChallenges(state: AppState, now: Date): AppState {
  const weekId = getWeekId(now);
  const byWeek = ensureWeekRecord(state.challengeCompletionsByWeek, weekId);
  const existing = byWeek[weekId] ?? {};

  const weekScans = state.scanHistory.filter((s) => getWeekId(new Date(s.createdAt)) === weekId);
  const weekQuiz = state.quizHistory.filter((q) => getWeekId(new Date(q.completedAt)) === weekId);

  const completions: Partial<Record<ChallengeId, ChallengeCompletion>> = { ...existing };
  let rewardPoints = 0;

  const uniqueTypesThisWeek = new Set(
    weekScans.map((s) => s.confirmation.selectedWasteType).filter((t) => t !== 'unknown'),
  ).size;

  for (const def of WEEKLY_CHALLENGES) {
    const progress =
      def.kind === 'scan_count'
        ? weekScans.length
        : def.kind === 'unique_types'
          ? uniqueTypesThisWeek
          : weekQuiz.length;
    if (progress < def.target) continue;
    if (completions[def.id]) continue;
    completions[def.id] = { completedAt: now.toISOString(), rewardPoints: def.rewardPoints };
    rewardPoints += def.rewardPoints;
  }

  if (rewardPoints === 0) return state;

  return {
    ...state,
    totalPoints: state.totalPoints + rewardPoints,
    challengeCompletionsByWeek: { ...byWeek, [weekId]: completions },
  };
}

function maybeUnlockBadges(state: AppState, now: Date): AppState {
  const unlockedAt = now.toISOString();
  let next = state;

  if (state.scanHistory.length >= 1) next = unlockBadge(next, 'first_scan', unlockedAt);
  const plasticCount = state.scanHistory.filter((s) => s.confirmation.selectedWasteType === 'plastic').length;
  if (plasticCount >= 10) next = unlockBadge(next, 'plastic_hero', unlockedAt);
  const batteryConfirmed = state.scanHistory.some((s) => s.confirmation.selectedWasteType === 'battery');
  if (batteryConfirmed && state.batterySafetyCardRead) next = unlockBadge(next, 'battery_aware', unlockedAt);
  if (state.streak.current >= 7) next = unlockBadge(next, 'streak_7', unlockedAt);

  return next;
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE':
      const base = createInitialState();
      return {
        ...base,
        ...action.payload,
        settings: { ...base.settings, ...action.payload.settings },
      };
    case 'SET_DISPLAY_NAME':
      return { ...state, displayName: action.payload.displayName };
    case 'TOGGLE_SETTING':
      return {
        ...state,
        settings: { ...state.settings, [action.payload]: !state.settings[action.payload] },
      };
    case 'SET_SELECTED_MODEL':
      return {
        ...state,
        settings: { ...state.settings, selectedModelId: action.payload.modelId },
      };
    case 'MARK_BATTERY_CARD_READ':
      return { ...state, batterySafetyCardRead: true };
    case 'CONFIRM_SCAN': {
      const now = new Date(action.payload.confirmedAt);

      if (state.scanHistory.some((s) => s.id === action.payload.scan.id)) return state;

      let next: AppState = {
        ...state,
        totalPoints: state.totalPoints + SCAN_CONFIRM_POINTS,
        scanHistory: [
          ...state.scanHistory,
          {
            ...action.payload.scan,
            confirmation: {
              selectedWasteType: action.payload.selectedWasteType,
              confirmedAt: action.payload.confirmedAt,
              awardedPoints: SCAN_CONFIRM_POINTS,
            },
          },
        ],
      };

      next = applyMeaningfulActionForStreak(next, now);
      next = maybeUnlockBadges(next, now);
      next = maybeCompleteWeeklyChallenges(next, now);
      next = maybeUnlockBadges(next, now);
      return next;
    }
    case 'COMPLETE_QUIZ': {
      const now = new Date(action.payload.session.completedAt);
      const awardedPoints = Math.max(0, action.payload.session.correct) * QUIZ_POINT_PER_CORRECT;

      let next: AppState = {
        ...state,
        totalPoints: state.totalPoints + awardedPoints,
        quizHistory: [...state.quizHistory, { ...action.payload.session, awardedPoints }],
      };

      next = applyMeaningfulActionForStreak(next, now);
      next = maybeCompleteWeeklyChallenges(next, now);
      next = maybeUnlockBadges(next, now);
      return next;
    }
    case 'RESET':
      return createInitialState();
    default:
      return state;
  }
}
