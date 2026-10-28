import { Redirect } from 'expo-router';

import { useSession } from '../context/session-context';

export default function EntryScreen(): React.JSX.Element | null {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return null;
  }

  return <Redirect href={session ? '/home' : '/login'} />;
}
