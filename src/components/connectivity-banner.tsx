import { StyleSheet, Text, View } from 'react-native';

import { useSyncState } from '../providers/sync-provider';

export function ConnectivityBanner(): React.JSX.Element {
  const { isConnected, pendingCount, syncError } = useSyncState();
  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, isConnected ? styles.online : styles.offline]}>
        <View style={styles.statusGroup}>
          <View style={[styles.dot, isConnected ? styles.onlineDot : styles.offlineDot]} />
          <Text style={[styles.text, isConnected ? styles.onlineText : styles.offlineText]}>
            {isConnected ? 'Conectado' : 'Sin conexión'}
          </Text>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingLabel}>Pendientes</Text>
          <Text style={styles.pendingCount}>{pendingCount}</Text>
        </View>
      </View>
      {syncError ? <Text style={styles.error}>Sincronización: {syncError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10 },
  dot: { borderRadius: 5, height: 9, marginRight: 8, width: 9 },
  error: { backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: 12, lineHeight: 17, paddingHorizontal: 16, paddingVertical: 8 },
  offline: { backgroundColor: '#FEF2F2' },
  offlineDot: { backgroundColor: '#DC2626' },
  offlineText: { color: '#991B1B' },
  online: { backgroundColor: '#ECFDF5' },
  onlineDot: { backgroundColor: '#059669' },
  onlineText: { color: '#047857' },
  pendingBadge: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#BFDBFE', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingVertical: 5 },
  pendingCount: { color: '#004B87', fontSize: 13, fontWeight: '900' },
  pendingLabel: { color: '#475569', fontSize: 12, fontWeight: '600' },
  statusGroup: { alignItems: 'center', flexDirection: 'row' },
  text: { fontSize: 13, fontWeight: '800' },
  wrapper: { backgroundColor: '#FFFFFF', borderBottomColor: '#E2E8F0', borderBottomWidth: 1 },
});
