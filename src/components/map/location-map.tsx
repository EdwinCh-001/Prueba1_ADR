import { z } from 'zod';
import { ActivityIndicator, View } from 'react-native';
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from 'react-native-webview';
import type { WebViewErrorEvent, WebViewHttpErrorEvent } from 'react-native-webview/lib/WebViewTypes';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useConnectivity } from '../../providers/sync-provider';
import { Text } from '../ui/text';
import { buildLeafletHtml, DEFAULT_MAP_CENTER } from './leaflet-html';

const BASE_URL = 'https://epmaps.local/';
const webViewMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ready') }),
  z.object({ type: z.literal('error'), reason: z.string().optional() }),
  z.object({
    type: z.literal('position'),
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  }),
]);

interface LocationMapProps {
  latitude: number | null;
  longitude: number | null;
  editable: boolean;
  onPositionChange: (latitude: number, longitude: number) => void;
  height?: number;
}

interface MarkerState {
  latitude: number;
  longitude: number;
  editable: boolean;
}

export function LocationMap({
  latitude,
  longitude,
  editable,
  onPositionChange,
  height = 288,
}: LocationMapProps): React.JSX.Element {
  const { isConnected } = useConnectivity();
  const webViewRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const pendingMarkerRef = useRef<MarkerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const hasCoordinates = latitude !== null && longitude !== null;
  const mapLatitude = hasCoordinates ? latitude : DEFAULT_MAP_CENTER.latitude;
  const mapLongitude = hasCoordinates ? longitude : DEFAULT_MAP_CENTER.longitude;
  const [html] = useState(() => (
    buildLeafletHtml({ latitude: mapLatitude, longitude: mapLongitude, zoom: 15 })
  ));

  const applyMarker = useCallback((marker: MarkerState | null): void => {
    if (!readyRef.current) {
      return;
    }
    if (!marker) {
      webViewRef.current?.injectJavaScript('window.clearMarker(); true;');
      return;
    }
    webViewRef.current?.injectJavaScript(
      `window.setMarker(${JSON.stringify(marker.latitude)}, ${JSON.stringify(marker.longitude)}, ${JSON.stringify(marker.editable)}); true;`,
    );
  }, []);

  const updateMarker = useCallback((): void => {
    pendingMarkerRef.current = hasCoordinates
      ? { latitude, longitude, editable }
      : null;
    applyMarker(pendingMarkerRef.current);
  }, [applyMarker, editable, hasCoordinates, latitude, longitude]);

  useEffect(() => {
    updateMarker();
  }, [updateMarker]);

  const handleMessage = (event: WebViewMessageEvent): void => {
    let parsedRawMessage: unknown;
    try {
      parsedRawMessage = JSON.parse(event.nativeEvent.data) as unknown;
    } catch {
      setHasLoadError(true);
      return;
    }
    const parsedMessage = webViewMessageSchema.safeParse(parsedRawMessage);
    if (!parsedMessage.success) {
      setHasLoadError(true);
      return;
    }
    if (parsedMessage.data.type === 'error') {
      const errorReason = 'reason' in parsedMessage.data ? parsedMessage.data.reason : undefined;
      setHasLoadError(true);
      if (__DEV__) {
        console.error('Leaflet error:', errorReason ?? 'Error sin detalle');
      }
    } else if (parsedMessage.data.type === 'ready') {
      readyRef.current = true;
      setIsReady(true);
      setIsLoading(false);
      applyMarker(pendingMarkerRef.current);
    } else if (parsedMessage.data.type === 'position') {
      onPositionChange(parsedMessage.data.latitude, parsedMessage.data.longitude);
    }
  };

  const handleNavigation = (request: WebViewNavigation): boolean => (
    request.url === 'about:blank'
    || request.url.startsWith('data:')
    || request.url.startsWith(BASE_URL)
  );

  const handleWebViewError = (event: WebViewErrorEvent): void => {
    const message = event.nativeEvent.description || 'Error de carga del WebView';
    setIsLoading(false);
    setHasLoadError(true);
    if (__DEV__) {
      console.error('WebView error:', message);
    }
  };

  const handleHttpError = (event: WebViewHttpErrorEvent): void => {
    const { statusCode, description, url } = event.nativeEvent;
    const message = `${statusCode} ${description} (${url})`;
    setHasLoadError(true);
    if (__DEV__) {
      console.error('WebView HTTP error:', message);
    }
  };

  const offlineOverlayVisible = !isConnected && !isReady;

  return (
    <View
      className="relative overflow-hidden rounded-2xl border border-line"
      style={{ height }}
    >
      <WebView
        // WebView no aplica className de Uniwind; su tamaño nativo se fija con style.
        style={{ flex: 1 }}
        ref={webViewRef}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        nestedScrollEnabled
        originWhitelist={['https://*', 'about:blank', 'data:*']}
        scrollEnabled
        source={{ html, baseUrl: BASE_URL }}
        onMessage={handleMessage}
        onLoadStart={() => {
          readyRef.current = false;
          setIsReady(false);
          setIsLoading(true);
          setHasLoadError(false);
        }}
        onLoadEnd={() => {
          setIsLoading(false);
        }}
        onError={handleWebViewError}
        onHttpError={handleHttpError}
        onShouldStartLoadWithRequest={handleNavigation}
      />
      {isLoading && (
        <View className="absolute inset-0 items-center justify-center bg-surface/90">
          <ActivityIndicator />
          <Text className="mt-2 text-center text-muted">Cargando mapa...</Text>
        </View>
      )}
      {(offlineOverlayVisible || hasLoadError) && (
        <View className="absolute inset-x-0 bottom-0 bg-surface/95 p-3">
          <Text className="text-center text-danger">
            {offlineOverlayVisible
              ? 'Sin conexión: el mapa no está disponible.'
              : 'No se pudo cargar el mapa.'}
          </Text>
          <Text className="mt-1 text-center text-muted">
            Coordenadas: {mapLatitude.toFixed(5)}, {mapLongitude.toFixed(5)}
          </Text>
        </View>
      )}
    </View>
  );
}
