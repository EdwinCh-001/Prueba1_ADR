import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { findRemoteReadingByClientId, sendReading } from '../api/reading-api';
import { findPendingReadings, markReadingAsSent } from '../repositories/reading-repository';

interface SyncState {
  isConnected: boolean;
  pendingCount: number;
  syncError: string | null;
}

export function SyncProvider({ children }: React.PropsWithChildren): React.JSX.Element {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SyncState>({
    isConnected: false,
    pendingCount: 0,
    syncError: null,
  });
  const isSynchronizing = useRef(false);

  const refreshPendingCount = useCallback(async (): Promise<void> => {
    const pending = await findPendingReadings();
    setState((current) => ({ ...current, pendingCount: pending.length }));
  }, []);

  const synchronize = useCallback(async (): Promise<void> => {
    if (isSynchronizing.current) {
      return;
    }

    isSynchronizing.current = true;
    setState((current) => ({ ...current, syncError: null }));
    try {
      const pending = await findPendingReadings();
      for (const reading of pending) {
        const alreadyExists = await findRemoteReadingByClientId(reading.id);
        if (!alreadyExists) {
          await sendReading(reading);
        }
        await markReadingAsSent(reading.id, new Date().toISOString());
      }
      await refreshPendingCount();
      await queryClient.invalidateQueries({ queryKey: ['meter'] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo sincronizar.';
      setState((current) => ({ ...current, syncError: message }));
      await refreshPendingCount();
    } finally {
      isSynchronizing.current = false;
    }
  }, [queryClient, refreshPendingCount]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((networkState) => {
      const isConnected = Boolean(
        networkState.isConnected && networkState.isInternetReachable !== false,
      );
      setState((current) => ({ ...current, isConnected }));
      if (isConnected) {
        void synchronize();
      }
    });

    void NetInfo.fetch().then((networkState) => {
      const isConnected = Boolean(
        networkState.isConnected && networkState.isInternetReachable !== false,
      );
      setState((current) => ({ ...current, isConnected }));
      if (isConnected) {
        void synchronize();
      } else {
        void refreshPendingCount();
      }
    });

    return unsubscribe;
  }, [refreshPendingCount, synchronize]);

  return <SyncContext.Provider value={state}>{children}</SyncContext.Provider>;
}

const SyncContext = createContext<SyncState | null>(null);

export const useSyncState = (): SyncState => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncState debe utilizarse dentro de SyncProvider');
  }
  return context;
};
