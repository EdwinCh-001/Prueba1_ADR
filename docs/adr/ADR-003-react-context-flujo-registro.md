# ADR-003: Usar React Context para gestionar el estado compartido del registro de lecturas

## Estado

Aceptado.

## Fecha

27 de octubre de 2026.

## Requisitos relacionados

R5 (registro de lectura con distintos estados del medidor), R6 (cálculo de consumo), R7 (captura de fotografía) y R8 (continuación de registros incompletos).

## Contexto

El registro de una lectura no consiste en una única pantalla ni en un único dato.

Durante el proceso, el técnico consulta un medidor, registra la lectura actual, selecciona el estado del medidor, puede tomar una fotografía y, dependiendo del estado seleccionado, debe ingresar información adicional como motivos u observaciones.

La información capturada en un paso debe permanecer disponible en los pasos siguientes sin obligar al usuario a volver a ingresarla. Además, la aplicación debe ser capaz de recuperar un registro incompleto previamente guardado y continuar desde el punto donde se interrumpió el proceso.

La solución debe permitir compartir el estado entre múltiples pantallas relacionadas con el mismo registro sin duplicar información ni propagar datos mediante cadenas extensas de propiedades.

## Alternativas consideradas

| **Alternativa** | **Ventajas en este proyecto** | **Desventajas en este proyecto** |
|---|---|---|
| React Context | Forma parte de React, no agrega dependencias externas y permite compartir el estado del registro en todas las pantallas involucradas. | Puede provocar renderizados innecesarios si se utiliza incorrectamente. |
| Zustand | API simple, buen rendimiento y menor cantidad de renderizados. | Requiere una dependencia adicional cuya única finalidad sería gestionar un flujo específico. |
| Redux Toolkit | Arquitectura escalable y herramientas avanzadas de depuración. | Incrementa considerablemente la complejidad para una aplicación de tamaño reducido. |
| Paso de props entre pantallas | No requiere librerías adicionales. | Genera acoplamiento entre componentes y dificulta mantener el flujo conforme aumenta la cantidad de datos. |

## Decisión

Se utilizará **React Context** para gestionar el estado compartido de un registro de lectura en curso.

El contexto almacenará la información necesaria para completar el proceso de registro, incluyendo:

- Código del medidor.
- Lectura anterior.
- Lectura actual.
- Consumo calculado.
- Estado del medidor.
- Motivo u observaciones cuando correspondan.
- Ruta de la fotografía asociada.
- Paso actual del proceso.

Los componentes involucrados en el registro consumirán el contexto para leer y actualizar la información sin necesidad de intercambiar datos mediante múltiples niveles de propiedades.

Cuando el técnico avanza de un paso a otro, el contenido del contexto se guarda en una tabla `borradores` de la misma base SQLite del ADR-001, con una sola fila por código de empleado. El guardado se hace en cada cambio de paso y no al cerrar la aplicación, porque quitarla de las recientes no ejecuta ningún código de cierre. Al abrir la aplicación, una vez cargada la base, si existe un borrador se ofrece al técnico continuar o descartar. Al continuar, el contexto se reconstruye con los datos guardados y se navega al paso pendiente. Al descartar, se elimina la fila del borrador y la fotografía asociada. Cuando el registro se completa, el borrador se elimina y la lectura pasa a la tabla `lecturas`.

## Consecuencias

- El flujo completo de registro utiliza una única fuente de verdad para la información temporal.
- Las pantallas pueden compartir datos sin depender unas de otras.
- El cálculo de consumo se mantiene consistente durante todo el proceso.
- La restauración de borradores resulta más sencilla porque el contexto puede reconstruirse a partir de SQLite.
- El borrador no es una lectura: vive en su propia tabla y no participa del índice único de `lecturas`, por lo que un registro a medias no bloquea al medidor en el mes.
- No se introduce una dependencia adicional para gestión de estado global.
- Un uso incorrecto del contexto puede provocar renderizados innecesarios en componentes que no requieren actualizarse.
- Es necesario inicializar correctamente el contexto antes de mostrar pantallas que dependan de datos restaurados desde SQLite.
- Guardar en cada cambio de paso agrega una escritura a SQLite por paso, y una escritura fallida podría dejar el borrador desactualizado.

## Verificación

- Iniciar un registro, avanzar entre pantallas y verificar que los datos ingresados permanecen disponibles.
- Modificar una lectura y comprobar que el consumo calculado se actualiza correctamente en todas las pantallas relacionadas.
- Avanzar hasta el segundo paso de un registro, quitar la aplicación de las recientes y abrirla de nuevo: se ofrece continuar o descartar, y al continuar los datos ingresados siguen presentes.
- Verificar que el registro continúa desde el último paso completado.
- Descartar un borrador y comprobar que ya no se ofrece al abrir de nuevo la aplicación.
- Revisar que `package.json` no contiene dependencias adicionales para gestión de estado como Redux Toolkit o Zustand.

## Uso de IA

Se solicitó a la IA comparar alternativas para compartir información entre las pantallas involucradas en el registro de lecturas. La IA propuso React Context, Zustand, Redux Toolkit y paso de propiedades entre componentes. Se eligió React Context debido a que resuelve el problema sin incorporar dependencias adicionales, simplifica la restauración de borradores almacenados en SQLite y proporciona una única fuente de verdad para el proceso de registro.