import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { useSession } from '../context/session-context';

export default function EntryScreen(): React.JSX.Element {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-transparent">
        <ActivityIndicator colorClassName="accent-brand-light" />
        <Text className="mt-3 text-sm font-bold text-content-muted">Preparando la jornada...</Text>
      </View>
    );
  }

  return <Redirect href={session ? '/home' : '/login'} />;
}
