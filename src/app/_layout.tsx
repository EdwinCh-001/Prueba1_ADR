import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, View } from 'react-native';

import { SessionProvider } from '../context/session-context';
import { NoticeProvider } from '../context/notice-context';
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
              <NoticeProvider>
                <StyledSafeAreaView edges={['top']} className="flex-1 bg-transparent">
                  <StatusBar style="dark" />
                  <View className="flex-1">
                    <Image
                    accessible={false}
                    className="absolute inset-0 h-full w-full"
                    resizeMode="cover"
                    source={require('../../assets/global.jpg')}
                  />
                  <View className="absolute inset-0 bg-background/65" />
                  <ConnectivityBanner />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: 'transparent' },
                    }}
                  />
                </View>
                </StyledSafeAreaView>
              </NoticeProvider>
            </ReadingProvider>
          </SessionProvider>
        </SyncProvider>
      </ConnectivityProvider>
    </QueryProvider>
  );
}
