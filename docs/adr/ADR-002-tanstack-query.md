# ADR-002: Usar TanStack Query para consultas remotas y gestión del estado de servidor

## Estado

Aceptado.

## Fecha

27 de octubre de 2026.

## Requisitos relacionados

R3 (consulta de medidores con reutilización de información previamente obtenida). También contribuye indirectamente a R4 y R9 al facilitar el manejo uniforme de errores de red y estados de sincronización.

## Contexto

La aplicación necesita consultar información de medidores desde MockAPI utilizando el código ingresado por el técnico. Estas consultas pueden repetirse varias veces durante una misma jornada, ya sea porque el técnico vuelve a consultar un medidor o porque navega entre pantallas que utilizan los mismos datos.

La interfaz debe informar claramente cuándo una consulta está cargando, cuándo finalizó correctamente y cuándo ocurrió un error de comunicación. También debe evitar solicitudes duplicadas cuando varias pantallas o componentes requieren la misma información.

Además, el proyecto requiere funcionar en escenarios con conectividad inestable. La aplicación debe reaccionar adecuadamente ante pérdidas temporales de red sin obligar a implementar manualmente el ciclo completo de carga, error, reintento y actualización de cada consulta.

La persistencia local de datos, las lecturas pendientes y la operación offline se resuelven en el ADR-001 mediante SQLite, por lo que esta decisión se limita exclusivamente a la gestión de consultas remotas.

## Alternativas consideradas

| **Alternativa** | **Ventajas en este proyecto** | **Desventajas en este proyecto** |
|---|---|---|
| TanStack Query para consultas remotas | Proporciona estados de carga y error, permite reintentos automáticos configurables, evita consultas duplicadas y centraliza la obtención de datos remotos. Facilita la separación entre datos remotos y persistencia local. | Agrega una dependencia adicional y requiere comprender conceptos como `queryKey`, `staleTime` e invalidación de consultas. |
| Fetch nativo con estados manuales | No agrega dependencias y permite control total sobre la implementación. | Obliga a programar manualmente estados de carga, errores, reintentos y prevención de consultas duplicadas. Aumenta la cantidad de código repetitivo. |
| Axios | Ofrece interceptores, configuración centralizada y manejo simplificado de solicitudes HTTP. | No proporciona mecanismos de caché, reutilización de consultas ni gestión automática del estado del servidor. Requiere implementar estas funcionalidades por separado. |

## Decisión

Se utilizará **TanStack Query** como capa de gestión de consultas remotas de la aplicación.

Las consultas a MockAPI se implementarán mediante queries identificadas por el código del medidor consultado. Cada consulta será gestionada por TanStack Query, que proporcionará estados de carga, éxito y error para la interfaz. La queryKey se basará en el código del medidor para garantizar la reutilización correcta de resultados.

Cada consulta de medidor sigue este orden. Primero lee la tabla `medidores_cache` de SQLite definida en el ADR-001: si el medidor está guardado y fue consultado hace menos de 12 horas, devuelve ese dato sin consultar la red. Si no está guardado o el dato venció, consulta MockAPI con un tiempo límite de 10 segundos implementado con `AbortController`, valida la respuesta con Zod (ADR-004) y la guarda en `medidores_cache`. Si la red falla y existe un dato guardado, aunque haya vencido, se muestra ese dato.

TanStack Query se configura con `staleTime` de 12 horas y `gcTime` de 24 horas, porque el valor por defecto de `gcTime` es de 5 minutos y descartaría el dato en memoria antes de terminar la jornada. La detección de conexión de NetInfo (ADR-007) se conecta al `onlineManager` de TanStack Query para que la consulta no quede en pausa cuando no hay conexión.

SQLite continúa siendo el mecanismo oficial de persistencia local definido en el ADR-001. TanStack Query no almacena lecturas pendientes, borradores ni registros que deban sobrevivir al cierre de la aplicación.

Cuando una lectura se envía con éxito, se actualiza la última lectura del medidor en `medidores_cache` y se invalida su consulta, para no calcular el siguiente consumo con un dato desactualizado.

## Consecuencias

- Se reduce la cantidad de código necesario para gestionar estados de carga, éxito y error.
- Las consultas repetidas al mismo medidor reutilizan resultados previamente obtenidos, incluso sin conexión y después de cerrar la aplicación, porque la fuente persistente es `medidores_cache`.
- La aplicación dispone de mecanismos configurables de reintento ante fallos temporales de comunicación.
- Se evita que varios componentes ejecuten simultáneamente la misma solicitud al servidor.
- La solución introduce una nueva dependencia que debe mantenerse y comprenderse.
- El equipo debe conocer conceptos específicos de TanStack Query para depurar y modificar el comportamiento de las consultas.
- Un valor inadecuado de vigencia de los datos puede provocar que la aplicación muestre información desactualizada durante más tiempo del previsto.
- TanStack Query no reemplaza SQLite y no debe utilizarse para almacenar información que deba persistir después del cierre de la aplicación.
- TanStack Query no corta por sí misma una petición que se queda esperando: el tiempo límite se implementa a mano con `AbortController`.
- Los datos viven en dos niveles, la memoria de TanStack Query y `medidores_cache` en SQLite. La fuente persistente es SQLite y la memoria se reconstruye desde ella.

## Verificación

- Consultar un medidor y navegar entre pantallas utilizando la misma información: no deben generarse solicitudes duplicadas al servidor.
- Simular una falla temporal de red y verificar que la consulta expone correctamente el estado de error.
- Consultar dos veces consecutivas el mismo medidor durante la misma sesión y verificar que la información se reutiliza sin una nueva descarga inmediata.
- Con señal, consultar un medidor, activar modo avión y consultarlo de nuevo: muestra los datos sin error.
- Cerrar la aplicación desde recientes, abrirla en modo avión y consultar el mismo medidor: muestra los datos guardados en `medidores_cache`.
- Revisar que la función de consulta lee SQLite antes de llamar a la red y que usa `AbortController`.
- Verificar que las lecturas pendientes y borradores permanecen almacenados en SQLite incluso después de cerrar la aplicación.
- Revisar que `package.json` contiene `@tanstack/react-query` y que no existen implementaciones manuales equivalentes para el mismo propósito.

## Uso de IA

Se solicitó a la IA comparar diferentes estrategias para gestionar consultas remotas en una aplicación móvil con soporte offline. La IA propuso utilizar TanStack Query, fetch nativo y Axios como alternativas viables.

Al evaluar la opción elegida, la IA recomendó usar fetch nativo con una caché propia en SQLite, sin TanStack Query, para no mantener dos cachés. También advirtió que TanStack Query no maneja timeouts por sí misma y que descarta sus datos a los 5 minutos por defecto. No se siguió esa recomendación porque TanStack Query aporta estados de carga y error, reintentos y prevención de consultas duplicadas que con fetch habría que programar a mano. El riesgo de tener dos cachés se resolvió dejando a SQLite como única fuente persistente y a TanStack Query como capa en memoria, y las advertencias sobre el timeout y la duración de la caché se incorporaron a la Decisión.