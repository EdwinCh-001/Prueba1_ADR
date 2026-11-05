import '../global.css';

import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Image, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat/400Regular';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';
import { Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat/800ExtraBold';

import { SessionProvider } from '../context/session-context';
import { NoticeProvider } from '../context/notice-context';
import { ReadingProvider } from '../context/reading-context';
import { ConnectivityProvider } from '../providers/connectivity-provider';
import { QueryProvider } from '../providers/query-provider';
import { SyncProvider } from '../providers/sync-provider';
import { ConnectivityBanner } from '../components/connectivity-banner';
import { StyledSafeAreaView } from '../components/ui';

void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.error('No se pudo mantener visible la pantalla de inicio mientras carga la tipografía.', error);
});

export default function RootLayout(): React.JSX.Element {
  const [fontsLoaded, fontError] = useFonts({
    EPMAPSNunitoRegular: Nunito_400Regular,
    EPMAPSNunitoSemiBold: Nunito_600SemiBold,
    EPMAPSNunitoBold: Nunito_700Bold,
    EPMAPSNunitoExtraBold: Nunito_800ExtraBold,
    EPMAPSMontserratRegular: Montserrat_400Regular,
    EPMAPSMontserratSemiBold: Montserrat_600SemiBold,
    EPMAPSMontserratBold: Montserrat_700Bold,
    EPMAPSMontserratExtraBold: Montserrat_800ExtraBold,
  });

  useEffect(() => {
    if (!fontsLoaded && !fontError) {
      return;
    }

    if (fontError) {
      console.error('No se pudo cargar Nunito; se usará la tipografía del sistema.', fontError);
    }

    void SplashScreen.hideAsync().catch((error: unknown) => {
      console.error('No se pudo ocultar la pantalla de inicio.', error);
    });
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return <></>;
  }

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
                      animation: 'fade',
                      animationDuration: 240,
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
