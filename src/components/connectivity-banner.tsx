import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text } from './ui/text';
import { PulsingAlert } from './ui';

import { useConnectivity, usePendingCount, useSyncError } from '../providers/sync-provider';

export function ConnectivityBanner(): React.JSX.Element {
  const { isConnected } = useConnectivity();
  const { pendingCount } = usePendingCount();
  const { syncError } = useSyncError();
  return (
    <View className="relative overflow-hidden bg-brand-dark">
      <View className="absolute -left-8 -top-10 h-24 w-24 rounded-full bg-brand/35" />
      <View className="absolute -bottom-12 right-[28%] h-24 w-24 rounded-full border-[10px] border-white/5" />
      <View className="relative flex-row items-center justify-between border-b border-white/20 px-5 py-3.5">
        <View className="flex-row items-center gap-2">
          <PulsingAlert
            active={!isConnected}
            haloClassName="border-danger"
          >
            <View className={`rounded-full px-3 py-1.5 ${isConnected ? 'bg-success' : 'bg-danger'}`}>
              <Text className="text-sm font-extrabold text-white" accessibilityRole="text">
                {isConnected ? 'Conectado' : 'Sin conexión'}
              </Text>
            </View>
          </PulsingAlert>
        </View>
        <PulsingAlert
          active={pendingCount > 0}
          haloClassName="border-warning"
        >
          <View className={`flex-row items-center gap-2 rounded-full border px-3 py-1.5 ${pendingCount > 0 ? 'border-warning bg-warning' : 'border-white/40 bg-white/10'}`}>
            <Text className="text-xs font-extrabold text-white">
              Pendientes {pendingCount}
            </Text>
          </View>
        </PulsingAlert>
      </View>
      {syncError ? (
        <Animated.View
          className="relative bg-danger px-5 py-2.5"
          entering={FadeInDown.duration(320)}
        >
          <Text className="text-xs font-semibold text-white">Sincronización: {syncError}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
