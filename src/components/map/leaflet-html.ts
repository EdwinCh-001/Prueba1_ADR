const QUITO_LATITUDE = -0.1807;
const QUITO_LONGITUDE = -78.4678;

interface LeafletHtmlOptions {
  latitude: number;
  longitude: number;
  zoom: number;
}

const isValidLatitude = (value: number): boolean => Number.isFinite(value) && value >= -90 && value <= 90;
const isValidLongitude = (value: number): boolean => Number.isFinite(value) && value >= -180 && value <= 180;

const validateCoordinate = (
  latitude: number,
  longitude: number,
): void => {
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    throw new Error('Las coordenadas iniciales del mapa no son válidas.');
  }
};

export const buildLeafletHtml = ({
  latitude,
  longitude,
  zoom,
}: LeafletHtmlOptions): string => {
  validateCoordinate(latitude, longitude);
  if (!Number.isFinite(zoom) || zoom < 1 || zoom > 20) {
    throw new Error('El nivel de zoom inicial no es válido.');
  }

  const safeLatitude = JSON.stringify(latitude);
  const safeLongitude = JSON.stringify(longitude);
  const safeZoom = JSON.stringify(zoom);

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      crossorigin="">
    <style>
      html, body, #map { height: 100%; width: 100%; margin: 0; }
    </style>
  </head>
  <body>
    <div id="map" aria-label="Mapa de ubicación de la lectura"></div>
    <script>
      (function () {
        var initialLatitude = ${safeLatitude};
        var initialLongitude = ${safeLongitude};
        var initialZoom = ${safeZoom};
        var map;
        var marker;

        function sendPosition(latitude, longitude) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'position',
            latitude: latitude,
            longitude: longitude
          }));
        }

        function moveMarker(latitude, longitude) {
          if (!marker) {
            marker = L.marker([latitude, longitude], { draggable: false }).addTo(map);
          } else {
            marker.setLatLng([latitude, longitude]);
          }
          map.setView([latitude, longitude]);
        }

        function setEditable(editable) {
          if (!marker) {
            return;
          }
          marker.dragging[editable ? 'enable' : 'disable']();
        }

        window.initializeLeafletMap = function () {
          if (typeof L === 'undefined') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              reason: 'leaflet-no-cargo'
            }));
            return;
          }
          map = L.map('map').setView([initialLatitude, initialLongitude], initialZoom);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          marker = L.marker([initialLatitude, initialLongitude], { draggable: false }).addTo(map);
          marker.on('dragend', function () {
            var position = marker.getLatLng();
            sendPosition(position.lat, position.lng);
          });
          map.whenReady(function () {
            map.invalidateSize();
          });
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        };

        window.setMarker = function (latitude, longitude, editable) {
          if (!map || !isFinite(latitude) || !isFinite(longitude)) {
            return;
          }
          moveMarker(latitude, longitude);
          setEditable(editable);
        };

        window.clearMarker = function () {
          if (marker) {
            map.removeLayer(marker);
            marker = null;
          }
        };
      }());
    </script>
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
      onerror="window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', reason: 'leaflet-script-error' }))"
      onload="window.initializeLeafletMap()"
    ></script>
  </body>
</html>`;
};

export const DEFAULT_MAP_CENTER = {
  latitude: QUITO_LATITUDE,
  longitude: QUITO_LONGITUDE,
};
