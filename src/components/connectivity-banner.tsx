import { StyleSheet, Text, View } from 'react-native';

import { useSyncState } from '../providers/sync-provider';

export function ConnectivityBanner(): React.JSX.Element {
  const { isConnected, pendingCount, syncError } = useSyncState();
  return (
    <View>
      <View style={[styles.container, isConnected ? styles.online : styles.offline]}>
        <View style={styles.statusGroup}>
          <View style={[styles.dot, isConnected ? styles.onlineDot : styles.offlineDot]} />
          <Text style={styles.text}>{isConnected ? 'Conectado' : 'Sin conexión'}</Text>
        </View>
        <Text style={styles.pending}>Pendientes {pendingCount}</Text>
      </View>
      {syncError ? <Text style={styles.error}>Sincronización: {syncError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
  dot: { borderRadius: 5, height: 10, marginRight: 7, width: 10 },
  error: { backgroundColor: '#FEF3F2', color: '#B42318', fontSize: 12, padding: 6, textAlign: 'center' },
  offline: { backgroundColor: '#FEE4E2' },
  offlineDot: { backgroundColor: '#D92D20' },
  online: { backgroundColor: '#D1FADF' },
  onlineDot: { backgroundColor: '#039855' },
  pending: { color: '#344054', fontSize: 12, fontWeight: '700' },
  statusGroup: { alignItems: 'center', flexDirection: 'row' },
  text: { color: '#344054', fontSize: 12, textAlign: 'center' },
});
