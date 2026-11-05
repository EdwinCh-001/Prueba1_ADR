# Prueba1 ADR

## Taller 7

### Flujo de ubicación

Cada lectura nueva requiere una ubicación válida. La aplicación intenta obtenerla
mediante GPS en primer plano usando `expo-location`. Si el permiso es denegado,
los servicios están apagados o la solicitud falla, el técnico puede cambiar a
modo manual y colocar el marcador en el mapa Leaflet. Las coordenadas y el
origen (`gps` o `manual`) se guardan junto con la lectura en SQLite.

El mapa usa Leaflet 1.9.4 con teselas de OpenStreetMap. Requiere conexión a
internet para cargar el mapa y sus teselas; las coordenadas continúan visibles
cuando no hay conexión. Las lecturas antiguas pueden no tener ubicación y se
mantienen compatibles con valores nulos.

### Dependencias nuevas

- `expo-location`: permisos y lectura de ubicación GPS.
- `react-native-webview`: mapa Leaflet embebido.
- `lottie-react-native`: animaciones de estados de carga y éxito.

### Créditos de animaciones

Las animaciones `loading-meter.json` y `reading-saved.json` son recursos
proporcionados para el Taller 7 y se almacenan en `assets/animations/`.

### Casos manuales

- GPS concedido: abrir una lectura nueva y comprobar que obtiene y guarda las
  coordenadas GPS.
- Permiso denegado: rechazar el permiso y comprobar el cambio automático a modo
  Manual.
- Servicios apagados: desactivar la ubicación del dispositivo y comprobar el
  aviso y el modo Manual.
- Manual: desplazar, hacer zoom y mover el marcador; verificar que se guardan
  las coordenadas manuales.
- Sin conexión: comprobar que las coordenadas permanecen visibles aunque no
  carguen las teselas del mapa.
- Edición de lectura pendiente: abrirla y confirmar que conserva ubicación y
  origen.
- Borrador antiguo: restaurar un borrador sin ubicación y comprobar que solicita
  GPS sin descartar los demás datos.
