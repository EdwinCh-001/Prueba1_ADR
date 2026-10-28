import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';

export function ConnectivityProvider({ children }: React.PropsWithChildren): React.JSX.Element {
  useEffect(() => {
    return onlineManager.setEventListener((setOnline) =>
      NetInfo.addEventListener((state) => {
        setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
      }),
    );
  }, []);

  return <>{children}</>;
}
