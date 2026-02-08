import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppState } from './appState';
import { STORAGE_KEY, STORAGE_VERSION, createInitialState } from './appState';

type PersistedStateEnvelope = {
  version: number;
  data: AppState;
};

export async function loadPersistedState(): Promise<AppState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState();

  try {
    const parsed = JSON.parse(raw) as PersistedStateEnvelope;
    if (!parsed || typeof parsed !== 'object') return createInitialState();
    if (parsed.version !== STORAGE_VERSION) return createInitialState();
    if (!parsed.data || typeof parsed.data !== 'object') return createInitialState();
    return parsed.data;
  } catch {
    return createInitialState();
  }
}

export async function persistState(state: AppState): Promise<void> {
  const envelope: PersistedStateEnvelope = { version: STORAGE_VERSION, data: state };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

export async function clearPersistedState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

