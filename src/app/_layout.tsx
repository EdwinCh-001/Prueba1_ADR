import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionProvider } from '../context/session-context';
import { ReadingProvider } from '../context/reading-context';
import { ConnectivityProvider } from '../providers/connectivity-provider';
import { QueryProvider } from '../providers/query-provider';
import { SyncProvider } from '../providers/sync-provider';
import { ConnectivityBanner } from '../components/connectivity-banner';

export default function RootLayout(): React.JSX.Element {
  return (
    <QueryProvider>
      <ConnectivityProvider>
        <SyncProvider>
          <SessionProvider>
            <ReadingProvider>
              <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFFFF', flex: 1 }}>
                <ConnectivityBanner />
                <Stack screenOptions={{ headerShown: false }} />
              </SafeAreaView>
            </ReadingProvider>
          </SessionProvider>
        </SyncProvider>
      </ConnectivityProvider>
    </QueryProvider>
  );
}
