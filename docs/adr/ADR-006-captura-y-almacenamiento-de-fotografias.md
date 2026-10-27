# ADR-006: Usar Expo Image Picker y Expo FileSystem para la captura y persistencia de fotografías

## Estado

Aceptado.

## Fecha

27 de octubre de 2026.

## Requisitos relacionados

R7 (captura obligatoria de evidencia fotográfica para determinados estados del medidor) y R8 (continuación de registros incompletos después de reiniciar la aplicación).

## Contexto

Durante el proceso de registro, determinados estados del medidor requieren evidencia fotográfica para respaldar la información reportada por el técnico.

La fotografía debe permanecer disponible incluso si la aplicación se cierra, el dispositivo se reinicia o el usuario continúa el registro en otro momento.

Las imágenes obtenidas mediante la cámara suelen almacenarse inicialmente en ubicaciones temporales administradas por el sistema operativo. Dichos archivos pueden ser eliminados automáticamente cuando la aplicación se reinicia o el sistema necesita liberar espacio.

Por este motivo, la aplicación necesita un mecanismo que permita capturar fotografías y moverlas a una ubicación persistente controlada por la aplicación antes de asociarlas a una lectura.

La solución también debe permitir recuperar la fotografía al reabrir un borrador almacenado localmente.

La ruta persistente de la fotografía será almacenada en la tabla de lecturas definida en el ADR-001.

## Alternativas consideradas

| **Alternativa** | **Ventajas en este proyecto** | **Desventajas en este proyecto** |
|---|---|---|
| Expo Image Picker + Expo FileSystem | Permite capturar imágenes utilizando APIs oficiales de Expo y almacenarlas de forma persistente dentro del espacio de la aplicación. | Requiere dos dependencias y la gestión explícita de archivos. |
| Expo Image Picker únicamente | Implementación más simple y menor cantidad de código. | Las imágenes pueden permanecer únicamente en almacenamiento temporal y perderse después del reinicio de la aplicación. |
| Guardar imágenes codificadas en SQLite | Facilita mantener toda la información en una única base de datos. | Incrementa significativamente el tamaño de la base de datos y reduce el rendimiento de lectura y escritura. |
| Almacenar imágenes en un servicio remoto inmediatamente | Evita mantener archivos localmente durante largos periodos. | No funciona cuando el dispositivo se encuentra sin conexión, incumpliendo el escenario offline requerido por la aplicación. |

## Decisión

Se utilizará **Expo Image Picker** para capturar fotografías desde la cámara del dispositivo.

Una vez obtenida la imagen, se utilizará **Expo FileSystem** para copiar el archivo desde la ubicación temporal proporcionada por el sistema hacia un directorio persistente administrado por la aplicación.

La base de datos definida en el ADR-001 almacenará únicamente la ruta del archivo y no el contenido binario de la imagen.

Cada lectura conservará una referencia a su fotografía asociada mediante la ruta persistente generada durante el proceso de captura.

Cuando la aplicación recupere un borrador o una lectura pendiente, utilizará la ruta almacenada para acceder nuevamente a la evidencia fotográfica.

## Consecuencias

- Las fotografías permanecen disponibles después de cerrar la aplicación o reiniciar el dispositivo.
- El almacenamiento de imágenes se mantiene separado de los datos estructurados gestionados por SQLite.
- Se reduce el tamaño de la base de datos al almacenar únicamente rutas de archivo.
- La aplicación puede continuar funcionando sin conexión incluso cuando existen fotografías pendientes de envío.
- Se incorporan dos dependencias adicionales al proyecto.
- Es necesario gestionar la eliminación de archivos que ya no se utilicen para evitar consumo innecesario de almacenamiento.
- Una copia fallida del archivo puede provocar referencias inválidas si no se valida correctamente el resultado de la operación.

## Verificación

- Capturar una fotografía asociada a una lectura.
- Cerrar completamente la aplicación y volver a abrirla.
- Verificar que la fotografía sigue siendo accesible desde el registro correspondiente.
- Crear un borrador con fotografía, reiniciar el dispositivo y comprobar que la imagen continúa disponible.
- Confirmar que SQLite almacena únicamente la ruta del archivo y no el contenido completo de la imagen.
- Revisar que `package.json` contiene `expo-image-picker` y `expo-file-system`.

## Uso de IA

Se solicitó a la IA comparar distintas estrategias para gestionar fotografías en una aplicación móvil con funcionamiento offline. La IA propuso almacenar rutas mediante Expo FileSystem, utilizar únicamente las rutas temporales generadas por la cámara, guardar imágenes dentro de SQLite y realizar cargas inmediatas a un servicio remoto. Se eligió la combinación de Expo Image Picker y Expo FileSystem debido a que garantiza persistencia local, compatibilidad con escenarios sin conexión y mejor separación entre almacenamiento de archivos y datos estructurados.