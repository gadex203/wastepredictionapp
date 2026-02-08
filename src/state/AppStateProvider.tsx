import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

import type { AppAction, AppState } from './appState';
import { appReducer, createInitialState } from './appState';
import { clearPersistedState, loadPersistedState, persistState } from './storage';

type AppStateContextValue = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  hydrated: boolean;
  resetAppData: () => Promise<void>;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    loadPersistedState()
      .then((loaded) => {
        if (!active) return;
        dispatch({ type: 'HYDRATE', payload: loaded });
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const handle = setTimeout(() => {
      persistState(state).catch(() => {});
    }, 250);
    return () => clearTimeout(handle);
  }, [state, hydrated]);

  const value = useMemo<AppStateContextValue>(() => {
    return {
      state,
      dispatch,
      hydrated,
      resetAppData: async () => {
        await clearPersistedState();
        dispatch({ type: 'RESET' });
      },
    };
  }, [state, hydrated]);

  return <AppStateContext value={value}>{children}</AppStateContext>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx.state;
}

export function useAppDispatch() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppDispatch must be used within AppStateProvider');
  return ctx.dispatch;
}

export function useAppHydration() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppHydration must be used within AppStateProvider');
  return ctx.hydrated;
}

export function useResetAppData() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useResetAppData must be used within AppStateProvider');
  return ctx.resetAppData;
}

