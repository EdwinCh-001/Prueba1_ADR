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

Las consultas a MockAPI se implementarán mediante queries identificadas por el código del medidor consultado. Cada consulta será gestionada por TanStack Query, que proporcionará estados de carga, éxito y error para la interfaz.

La información obtenida desde el servidor será gestionada por TanStack Query durante la sesión activa. Adicionalmente, los datos requeridos para funcionamiento offline podrán persistirse en SQLite según las políticas definidas en el ADR-001.

SQLite continúa siendo el mecanismo oficial de persistencia local definido en el ADR-001. TanStack Query no almacena lecturas pendientes, borradores ni registros que deban sobrevivir al cierre de la aplicación.

Las configuraciones de vigencia y reutilización de datos serán controladas mediante las opciones propias de TanStack Query, manteniendo una separación clara entre la gestión de datos remotos y la persistencia local.

Las consultas de medidores utilizarán una queryKey basada en el código del medidor para garantizar la reutilización correcta de resultados.

## Consecuencias

- Se reduce la cantidad de código necesario para gestionar estados de carga, éxito y error.
- Las consultas repetidas al mismo medidor reutilizan resultados previamente obtenidos durante la sesión.
- La aplicación dispone de mecanismos configurables de reintento ante fallos temporales de comunicación.
- Se evita que varios componentes ejecuten simultáneamente la misma solicitud al servidor.
- La solución introduce una nueva dependencia que debe mantenerse y comprenderse.
- El equipo debe conocer conceptos específicos de TanStack Query para depurar y modificar el comportamiento de las consultas.
- Un valor inadecuado de vigencia de los datos puede provocar que la aplicación muestre información desactualizada durante más tiempo del previsto.
- TanStack Query no reemplaza SQLite y no debe utilizarse para almacenar información que deba persistir después del cierre de la aplicación.

## Verificación

- Consultar un medidor y navegar entre pantallas utilizando la misma información: no deben generarse solicitudes duplicadas al servidor.
- Simular una falla temporal de red y verificar que la consulta expone correctamente el estado de error.
- Consultar dos veces consecutivas el mismo medidor durante la misma sesión y verificar que la información se reutiliza sin una nueva descarga inmediata.
- Verificar que las lecturas pendientes y borradores permanecen almacenados en SQLite incluso después de cerrar la aplicación.
- Revisar que `package.json` contiene `@tanstack/react-query` y que no existen implementaciones manuales equivalentes para el mismo propósito.

## Uso de IA

Se solicitó a la IA comparar diferentes estrategias para gestionar consultas remotas en una aplicación móvil con soporte offline. La IA propuso utilizar TanStack Query, fetch nativo y Axios como alternativas viables. Se eligió TanStack Query debido a que proporciona reutilización de consultas, gestión del estado del servidor, manejo uniforme de errores y reducción de código repetitivo, manteniendo la persistencia local bajo responsabilidad de SQLite definida en el ADR-001.