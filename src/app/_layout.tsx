import { Stack } from 'expo-router';
import { View } from 'react-native';

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
              <View style={{ flex: 1 }}>
                <ConnectivityBanner />
                <Stack screenOptions={{ headerShown: false }} />
              </View>
            </ReadingProvider>
          </SessionProvider>
        </SyncProvider>
      </ConnectivityProvider>
    </QueryProvider>
  );
}
