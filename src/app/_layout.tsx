import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SessionProvider } from '../context/session-context';
import { ReadingProvider } from '../context/reading-context';
import { ConnectivityProvider } from '../providers/connectivity-provider';
import { QueryProvider } from '../providers/query-provider';
import { SyncProvider } from '../providers/sync-provider';
import { ConnectivityBanner } from '../components/connectivity-banner';
import { StyledSafeAreaView } from '../components/ui';

export default function RootLayout(): React.JSX.Element {
  return (
    <QueryProvider>
      <ConnectivityProvider>
        <SyncProvider>
          <SessionProvider>
            <ReadingProvider>
              <StyledSafeAreaView edges={['top']} className="flex-1 bg-background">
                <StatusBar style="light" />
                <ConnectivityBanner />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    // Replica --color-background para evitar destellos blancos entre pantallas.
                    contentStyle: { backgroundColor: '#1c1c1e' },
                  }}
                />
              </StyledSafeAreaView>
            </ReadingProvider>
          </SessionProvider>
        </SyncProvider>
      </ConnectivityProvider>
    </QueryProvider>
  );
}
