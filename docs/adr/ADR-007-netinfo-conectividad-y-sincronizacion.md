# ADR-007: Usar NetInfo para detectar conectividad y sincronizar lecturas pendientes

## Estado

Aceptado.

## Fecha

27 de octubre de 2026.

## Requisitos relacionados

R4 (registro de lecturas sin conexión) y R9 (envío automático de lecturas pendientes al recuperar conectividad, sin duplicados aunque la señal se corte a mitad de un envío, y con el estado de conexión y la cantidad de pendientes visibles en todas las pantallas).

## Contexto

Los técnicos que utilizan la aplicación pueden trabajar en zonas donde la conectividad es inexistente o inestable.

La aplicación debe permitir registrar lecturas incluso cuando no existe acceso a internet, almacenando temporalmente la información en el dispositivo hasta que la comunicación sea restablecida.

Además, una vez recuperada la conectividad, el sistema debe sincronizar automáticamente las lecturas pendientes sin obligar al usuario a realizar acciones manuales.

Para cumplir este comportamiento es necesario detectar los cambios de estado de red y ejecutar procesos de sincronización únicamente cuando exista una conexión disponible.

La solución también debe evitar intentos constantes de envío cuando el dispositivo permanece desconectado, ya que esto genera consumo innecesario de recursos y experiencia de usuario deficiente.

Por último, el técnico debe ver en todo momento si tiene conexión y cuántas lecturas le quedan por enviar, sin importar la pantalla en la que se encuentre.

## Alternativas consideradas

| **Alternativa** | **Ventajas en este proyecto** | **Desventajas en este proyecto** |
|---|---|---|
| NetInfo | Permite detectar cambios reales de conectividad y reaccionar automáticamente ante la recuperación de red. Se integra fácilmente con React Native y Expo. | Agrega una dependencia adicional al proyecto. |
| Intentar enviar periódicamente mediante temporizadores | No requiere información explícita sobre el estado de la red. | Genera intentos de envío innecesarios cuando no existe conectividad y aumenta el consumo de batería. |
| Permitir sincronización manual mediante un botón | Implementación sencilla y control explícito por parte del usuario. | Depende de que el técnico recuerde ejecutar la sincronización y puede dejar registros pendientes sin enviar. |
| Verificar conectividad únicamente al abrir la aplicación | Menor complejidad de implementación. | No detecta recuperaciones de red mientras la aplicación permanece abierta. |

## Decisión

Se utilizará **@react-native-community/netinfo** para detectar cambios en la conectividad del dispositivo.

Cuando NetInfo informe que existe conexión disponible, la aplicación iniciará automáticamente el proceso de sincronización de las lecturas pendientes almacenadas en SQLite.

La sincronización consultará todas las lecturas cuyo estado sea `pendiente` y las enviará en orden de antigüedad.

Cada lectura utiliza un identificador único generado en el cliente, que se guarda también como campo de la lectura en MockAPI. Antes de enviar una lectura, se consulta a MockAPI si ya existe una con ese identificador. Si existe, la lectura se marca como enviada sin reenviarla; si no existe, se envía y, tras una respuesta exitosa, se marca como enviada en SQLite. Así, si la señal se corta a mitad de un envío y la lectura llegó al servidor, el siguiente intento no la duplica.

El estado de conexión informado por NetInfo y la cantidad de lecturas con estado `pendiente` se muestran en un componente ubicado en el layout raíz de la aplicación, para que sean visibles en todas las pantallas.

La detección de conectividad tendrá exclusivamente la responsabilidad de indicar cuándo es posible iniciar la sincronización. El almacenamiento de pendientes continúa siendo responsabilidad de SQLite.

## Consecuencias

- La aplicación puede reaccionar automáticamente cuando la conectividad es recuperada.
- Se reduce la necesidad de intervención manual por parte del técnico.
- Los registros pendientes tienen mayor probabilidad de sincronizarse oportunamente.
- Se evita ejecutar intentos de envío constantes cuando el dispositivo permanece sin señal.
- El técnico ve en todas las pantallas si tiene conexión y cuántas lecturas faltan por enviar.
- Se agrega una dependencia adicional al proyecto.
- La disponibilidad de conexión reportada por el sistema operativo no garantiza que el servidor remoto responda correctamente.
- La lógica de sincronización debe manejar errores parciales y reintentos sin perder información pendiente.
- La verificación previa al envío agrega una consulta a MockAPI por cada lectura pendiente, lo que aumenta el tiempo de sincronización.

## Verificación

- Registrar una lectura con el dispositivo en modo avión.
- Confirmar que la lectura queda almacenada con estado `pendiente`.
- Restaurar la conectividad y verificar que la sincronización se ejecuta automáticamente.
- Confirmar que la lectura cambia a estado `enviada` una vez completado el proceso.
- Activar el modo avión durante un envío, restaurar la conexión y verificar que la lectura existe una sola vez en MockAPI.
- Navegar por todas las pantallas y verificar que el estado de conexión y el número de lecturas pendientes se muestran en cada una.
- Revisar que `package.json` contiene `@react-native-community/netinfo`.

## Uso de IA

Se solicitó a la IA comparar mecanismos para gestionar conectividad en aplicaciones móviles con soporte offline. La IA propuso utilizar NetInfo, sincronización manual por parte del usuario, verificaciones periódicas mediante temporizadores y comprobaciones únicamente al iniciar la aplicación. Se eligió NetInfo debido a que permite detectar cambios de conectividad en tiempo real, iniciar sincronizaciones automáticas y reducir intentos de envío innecesarios cuando el dispositivo permanece sin conexión.

La IA señaló que este ADR asociaba la prevención de duplicados al requisito equivocado (R10) y que no describía cómo se evita duplicar una lectura ni el indicador de conexión que exige R9. Se corrigieron ambos puntos.