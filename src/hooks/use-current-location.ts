import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

type LocationStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'services-off' | 'error';

interface CurrentCoordinates {
  latitude: number;
  longitude: number;
}

interface CurrentLocationState {
  status: LocationStatus;
  coords: CurrentCoordinates | null;
}

interface CurrentLocationResult extends CurrentLocationState {
  request: () => Promise<void>;
}

const LOCATION_TIMEOUT_MS = 10000;

export const useCurrentLocation = (): CurrentLocationResult => {
  const isMounted = useRef(true);
  const [state, setState] = useState<CurrentLocationState>({
    status: 'idle',
    coords: null,
  });

  useEffect(() => () => {
    isMounted.current = false;
  }, []);

  const request = useCallback(async (): Promise<void> => {
    if (!isMounted.current) {
      return;
    }
    setState((current) => ({ ...current, status: 'loading' }));

    try {
      if (!(await Location.hasServicesEnabledAsync())) {
        if (isMounted.current) {
          setState((current) => ({ ...current, status: 'services-off' }));
        }
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        if (isMounted.current) {
          setState((current) => ({ ...current, status: 'denied' }));
        }
        return;
      }

      const position = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Tiempo agotado al obtener la ubicación.')), LOCATION_TIMEOUT_MS);
        }),
      ]);

      if (isMounted.current) {
        setState({
          status: 'ready',
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      }
    } catch {
      if (isMounted.current) {
        setState((current) => ({ ...current, status: 'error' }));
      }
    }
  }, []);

  return { ...state, request };
};
