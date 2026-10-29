import { Text, View } from 'react-native';

import { useSyncState } from '../providers/sync-provider';
import { AccentBar, StatusChip } from './ui';

export function ConnectivityBanner(): React.JSX.Element {
  const { isConnected, pendingCount, syncError } = useSyncState();
  return (
    <View className="bg-surface">
      <View className="flex-row items-center justify-between px-5 py-2">
        <View className="flex-row items-center gap-2">
          <View
            className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-success' : 'bg-accent-red'}`}
          />
          <Text className="text-xs font-semibold text-content">
            {isConnected ? 'Conectado' : 'Sin conexión'}
          </Text>
        </View>
        <StatusChip
          label={`Pendientes ${pendingCount}`}
          tone={pendingCount > 0 ? 'warning' : 'neutral'}
        />
      </View>
      <AccentBar />
      {syncError ? (
        <View className="bg-danger-soft px-5 py-2">
          <Text className="text-xs text-danger">Sincronización: {syncError}</Text>
        </View>
      ) : null}
    </View>
  );
}
