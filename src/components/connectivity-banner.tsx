import { Text, View } from 'react-native';

import { useSyncState } from '../providers/sync-provider';

export function ConnectivityBanner(): React.JSX.Element {
  const { isConnected, pendingCount, syncError } = useSyncState();
  return (
    <View className="bg-brand-dark">
      <View className="flex-row items-center justify-between border-b border-white/20 px-5 py-3.5">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-extrabold uppercase tracking-wide text-white">
            {isConnected ? 'Conectado' : 'Sin conexión'}
          </Text>
        </View>
        <View className={`flex-row items-center gap-2 rounded-full border px-3 py-1.5 ${pendingCount > 0 ? 'border-warning bg-warning' : 'border-white/40 bg-white/10'}`}>
          <Text className="text-xs font-extrabold uppercase tracking-wide text-white">
            Pendientes {pendingCount}
          </Text>
        </View>
      </View>
      {syncError ? (
        <View className="bg-danger px-5 py-2.5">
          <Text className="text-xs font-semibold text-white">Sincronización: {syncError}</Text>
        </View>
      ) : null}
    </View>
  );
}
