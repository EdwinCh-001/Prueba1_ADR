# ADR-001: Usar expo-sqlite para los datos de lecturas y expo-secure-store para la sesión

## Estado

Aceptado.

## Fecha

27 de octubre de 2026.

## Requisitos relacionados

R1 (sesión persistente), R3 (caché de medidores consultados), R4 (lectura pendiente sin señal), R9 (cola de envío sin duplicados) y R10 (corrección de pendientes y rechazo de duplicados por medidor y mes). También sostiene R8, cuyo borrador se decide en el ADR de estado compartido.

## Contexto

La aplicación debe conservar en el teléfono, aunque se cierre o se reinicie, dos tipos de datos con necesidades distintas.

El primero es la sesión del técnico (R1): es una credencial, por lo que no debe quedar legible para otras aplicaciones ni en texto plano.

El segundo son los datos de trabajo: las lecturas con su estado de envío (R4, R9, R10) y los medidores ya consultados (R3). Estos datos son estructurados, crecen durante la jornada y deben consultarse por campos concretos: qué lecturas están pendientes, si ya existe una lectura de un medidor en el mes en curso, cuál es la más antigua por enviar. Además, una lectura pendiente no puede quedar a medias si la aplicación se cierra durante la escritura, y el envío debe poder reintentarse sin duplicar (R9).

El almacenamiento debe funcionar sin señal y cargarse antes de mostrar cualquier pantalla que dependa de esos datos.

## Alternativas consideradas

| **Alternativa** | **Ventajas en este proyecto** | **Desventajas en este proyecto** |
| --- | --- | --- |
| expo-sqlite para datos y expo-secure-store para la sesión | SQLite permite un índice único por medidor y periodo, que hace cumplir R10 en la base y no solo en el código; las transacciones evitan lecturas guardadas a medias; las consultas por estado de envío resuelven la cola de R9. SecureStore guarda la credencial cifrada con el almacén seguro del sistema. | Dos dependencias y dos APIs distintas. Hay que diseñar el esquema, escribir SQL y manejar migraciones. |
| Solo expo-sqlite (sesión incluida) | Una sola dependencia y una sola API. | La sesión quedaría en un archivo de base de datos sin cifrar. Mezcla una credencial con datos de trabajo en el mismo almacén. |
| AsyncStorage para todo | Muy simple para guardar sesión y borrador como pares clave-valor. | Solo guarda texto: para saber si un medidor ya tiene lectura en el mes hay que cargar y filtrar todo en JavaScript. No hay transacciones ni índices, por lo que R10 y la cola de R9 dependerían solo del código. La sesión queda sin cifrar. |
| MMKV para todo | Lecturas y escrituras muy rápidas. | Requiere código nativo y un build propio, algo que no trae el proyecto base. Sigue siendo clave-valor, con los mismos límites de consulta que AsyncStorage. |

## Decisión

Se usan dos almacenes, cada uno para lo que hace mejor.

**expo-sqlite** guarda los datos de trabajo:

- Tabla `lecturas`: `id` (UUID generado en el cliente, clave primaria), `medidor_codigo`, `periodo` (AAAA-MM), estado del medidor, lectura actual, lectura anterior, consumo, motivo o descripción, ruta de la foto y estado de envío (`pendiente` o `enviada`).
- Índice único sobre (`medidor_codigo`, `periodo`) para rechazar el segundo registro del mismo medidor en el mismo mes (R10).
- El `id` generado en el cliente permite, antes de enviar, comprobar si la lectura ya llegó al sistema de la oficina, y evitar duplicados si la señal se corta a mitad del envío (R9).
- Tabla `medidores_cache`: código y datos del medidor con la fecha de consulta (R3).
- Las operaciones que modifican más de una fila se hacen dentro de una transacción.
- La versión del esquema se controla con `PRAGMA user_version` para poder migrar.

**expo-secure-store** guarda solo la sesión: el código de empleado y un indicador de sesión activa. La clave no se guarda; con datos quemados se valida contra una constante en el momento del ingreso (R1).

## Consecuencias

- La regla de no duplicar por medidor y mes la hace cumplir la base de datos, no solo la interfaz.
- La sesión queda cifrada y separada de los datos de trabajo.
- El error de un almacén no afecta al otro: un fallo al abrir la base no pierde la sesión, y viceversa.
- Se agregan dos dependencias, que quedan justificadas en este ADR.
- El esquema es un compromiso: cambiar una columna obliga a escribir una migración.
- La base de datos no está cifrada, por lo que no debe guardarse ninguna credencial en ella.
- La foto no se guarda dentro de SQLite: la tabla solo guarda su ruta. La conservación del archivo se decide en el ADR de la foto.
- Riesgo: abrir la base es una operación asíncrona. Si la aplicación navega o intenta leer antes de que termine, la pantalla aparece vacía o falla. La base debe inicializarse antes de mostrar pantallas que dependan de ella.
- Obligación: al cerrar sesión se borra la sesión, pero las lecturas pendientes no se eliminan, para no perder trabajo sin enviar.

## Verificación

- Revisar el archivo donde se abre la base y se crea el esquema: debe existir el índice único sobre medidor y periodo.
- Intentar registrar dos veces el mismo medidor en el mismo mes: el segundo registro debe ser rechazado.
- Registrar una lectura en modo avión, cerrar la aplicación desde recientes y abrirla: la lectura sigue como pendiente.
- Consultar un medidor con señal, activar modo avión y volver a consultarlo: muestra los datos desde la caché.
- Revisar que en SecureStore solo se guarda el código de empleado y el indicador de sesión, y que no aparece ninguna clave.
- Revisar que `package.json` contiene `expo-sqlite` y `expo-secure-store`, y no `@react-native-async-storage/async-storage` ni `react-native-mmkv`.

## Uso de IA

Se le pidió a la IA comparar opciones de almacenamiento local para esta aplicación. Propuso cuatro alternativas (expo-sqlite, AsyncStorage, MMKV y expo-secure-store para la sesión) y sugirió combinar SQLite con SecureStore o usar un solo almacén. Se eligió la combinación de dos almacenes.

