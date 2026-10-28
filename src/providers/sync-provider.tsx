import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { findRemoteReadingByClientId, sendReading } from '../api/reading-api';
import { fetchMeter } from '../api/meter-api';
import { updateCachedLastReading } from '../repositories/meter-cache-repository';
import {
  findPendingReadings,
  findPendingVerificationReadings,
  markReadingAsSent,
  markReadingVerification,
} from '../repositories/reading-repository';

interface SyncState {
  isConnected: boolean;
  pendingCount: number;
  syncError: string | null;
}

interface SyncContextValue extends SyncState {
  refreshPendingCount: () => Promise<void>;
  synchronize: () => Promise<void>;
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
      const verificationPending = await findPendingVerificationReadings();
      for (const reading of verificationPending) {
        if (reading.currentReading === null) {
          await markReadingVerification(reading.id, 'verificada', new Date().toISOString());
          continue;
        }
        const remoteMeter = await fetchMeter(reading.meterCode);
        const status = reading.currentReading < remoteMeter.previousReading
          ? 'inconsistente'
          : 'verificada';
        await markReadingVerification(reading.id, status, new Date().toISOString());
      }

      const pending = await findPendingReadings();
      for (const reading of pending) {
        if (reading.verificationStatus === 'inconsistente') {
          continue;
        }
        const alreadyExists = await findRemoteReadingByClientId(reading.id);
        if (!alreadyExists) {
          await sendReading(reading);
        }
        await markReadingAsSent(reading.id, new Date().toISOString());
        if (reading.currentReading !== null) {
          await updateCachedLastReading(
            reading.meterCode,
            reading.currentReading,
            reading.createdAt,
          );
        }
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

  return (
    <SyncContext.Provider
      value={{ ...state, refreshPendingCount, synchronize }}
    >
      {children}
    </SyncContext.Provider>
  );
}

const SyncContext = createContext<SyncContextValue | null>(null);

export const useSyncState = (): SyncContextValue => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncState debe utilizarse dentro de SyncProvider');
  }
  return context;
};
