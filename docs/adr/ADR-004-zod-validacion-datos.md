# ADR-004: Usar Zod para la validación de entradas y respuestas externas

## Estado

Aceptado.

## Fecha

27 de octubre de 2026.

## Requisitos relacionados

R2 (validación del código de medidor), R5 (validación de reglas de registro según el estado del medidor) y R6 (validación de lecturas antes del cálculo de consumo).

## Contexto

La aplicación recibe información desde dos orígenes que no deben considerarse confiables por defecto.

El primero corresponde a los datos ingresados por el técnico durante el proceso de registro, como el código del medidor, las lecturas, los estados reportados y las observaciones obligatorias en determinados casos.

El segundo corresponde a las respuestas obtenidas desde MockAPI durante la consulta de medidores.

Los datos inválidos podrían provocar cálculos incorrectos, errores de sincronización o registros inconsistentes. Por ello es necesario validar la información antes de utilizarla o almacenarla.

La solución debe permitir centralizar las reglas de validación para evitar duplicar lógica en múltiples pantallas de la aplicación.

## Alternativas consideradas

| **Alternativa** | **Ventajas en este proyecto** | **Desventajas en este proyecto** |
|---|---|---|
| Zod | Permite definir esquemas reutilizables para formularios y respuestas de MockAPI. Se integra fácilmente con React Hook Form. | Agrega una dependencia adicional y requiere definir esquemas explícitos. |
| Validación manual con JavaScript | No requiere dependencias externas. | Genera código repetitivo y aumenta el riesgo de inconsistencias entre pantallas. |
| Yup | Biblioteca ampliamente utilizada para validación de formularios. | Menor integración con TypeScript y duplicación de tipos respecto a Zod. |

## Decisión

Se utilizará **Zod** como mecanismo principal de validación de datos en la aplicación.

Los esquemas de validación se utilizarán para:

- Verificar el formato del código de medidor.
- Validar las lecturas ingresadas por el técnico.
- Validar los estados admitidos por el sistema.
- Verificar la información obtenida desde MockAPI antes de utilizarla.
- Comprobar reglas obligatorias según el estado reportado del medidor.

Para el código del medidor se aplicará el formato:

```text
MED-123456
```

mediante una expresión regular que garantice el cumplimiento de la estructura requerida por el sistema.

## Consecuencias

- Las reglas de validación quedan centralizadas en esquemas reutilizables.
- Los errores de entrada pueden detectarse antes de almacenar información incorrecta.
- Se reduce la duplicación de lógica entre formularios y servicios de consulta.
- Los datos provenientes de MockAPI se validan antes de ser utilizados por la aplicación.
- Se incorpora una nueva dependencia al proyecto.
- Cada nuevo modelo de datos requiere mantener su esquema correspondiente.
- Es posible rechazar información válida si las reglas de validación se definen incorrectamente.

## Verificación

- Ingresar un código válido con formato `MED-123456` y verificar que sea aceptado.
- Ingresar códigos inválidos y verificar que la aplicación los rechace.
- Intentar registrar lecturas negativas o incompletas y verificar que no puedan guardarse.
- Simular respuestas inválidas desde MockAPI y verificar que sean rechazadas por los esquemas.
- Revisar que `package.json` contiene la dependencia `zod`.

## Uso de IA

Se solicitó a la IA comparar mecanismos de validación para aplicaciones TypeScript. La IA propuso Zod, Yup y validaciones manuales. Se eligió Zod debido a su integración con TypeScript, la reutilización de esquemas entre formularios y servicios, y la posibilidad de validar tanto datos ingresados por el usuario como respuestas obtenidas desde MockAPI.