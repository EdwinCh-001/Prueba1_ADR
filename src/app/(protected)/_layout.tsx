import { Redirect, Stack } from 'expo-router';

import { useSession } from '../../context/session-context';

export default function ProtectedLayout(): React.JSX.Element {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}
