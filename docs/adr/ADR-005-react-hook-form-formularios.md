# ADR-005: Usar React Hook Form para la gestión de formularios

## Estado

Aceptado.

## Fecha

27 de octubre de 2026.

## Requisitos relacionados

R2 (validación del código de medidor), R5 (registro de lecturas según el estado del medidor), R6 (captura de lecturas para el cálculo de consumo), R7 (captura de fotografía asociada a una lectura) y R8 (continuación de registros incompletos).

## Contexto

La aplicación requiere varios formularios para capturar información durante el proceso de trabajo del técnico.

Entre estos formularios se encuentran la autenticación del usuario, la consulta de medidores y el registro de lecturas. Dependiendo del estado seleccionado para un medidor, ciertos campos pueden ser obligatorios o no, como observaciones, motivos o fotografías.

Además, el proyecto requiere validaciones consistentes y mensajes de error claros para evitar registros incompletos o incorrectos.

La solución debe integrarse con el mecanismo de validación definido en el ADR-004 y minimizar la cantidad de código necesario para manejar estados, errores y controles de entrada.

## Alternativas consideradas

| **Alternativa** | **Ventajas en este proyecto** | **Desventajas en este proyecto** |
|---|---|---|
| React Hook Form | Reduce la cantidad de código para formularios, permite validación integrada con Zod y mejora el rendimiento al evitar renderizados innecesarios. | Agrega una dependencia adicional y requiere conocer su API. |
| useState para cada campo | No requiere dependencias externas y resulta sencillo en formularios pequeños. | Incrementa rápidamente la complejidad cuando existen varios campos, validaciones y reglas condicionales. |
| Formik | Biblioteca ampliamente utilizada y con abundante documentación. | Mayor cantidad de renderizados y menor integración con TypeScript respecto a React Hook Form. |

## Decisión

Se utilizará **React Hook Form** como mecanismo principal para gestionar formularios en la aplicación.

Los formularios delegarán en React Hook Form la captura de datos, el manejo de errores y el control del estado de cada campo.

Las reglas de validación serán definidas mediante esquemas de Zod según lo establecido en el ADR-004.

React Hook Form será utilizado en:

- Inicio de sesión del técnico.
- Consulta de medidores.
- Registro de lecturas.
- Captura de observaciones y motivos.
- Formularios asociados a correcciones de registros pendientes.

Los mensajes de error se mostrarán directamente en la interfaz para facilitar la corrección de datos antes de su almacenamiento o envío.

## Consecuencias

- Se reduce la cantidad de código necesario para manejar formularios complejos.
- Las validaciones quedan centralizadas mediante la integración con Zod.
- Los errores pueden mostrarse de manera consistente en toda la aplicación.
- El rendimiento mejora al evitar renderizados innecesarios de formularios completos.
- Se incorpora una nueva dependencia al proyecto.
- Los desarrolladores deben familiarizarse con conceptos como controladores, resolvers y manejo de formularios controlados.
- Una configuración incorrecta puede impedir que las validaciones se ejecuten según lo esperado.

## Verificación

- Intentar enviar formularios con campos obligatorios vacíos y verificar que aparezcan mensajes de error.
- Ingresar un código de medidor inválido y comprobar que el formulario impide continuar.
- Verificar que los formularios permitan corregir errores sin perder información previamente ingresada.
- Confirmar que React Hook Form utiliza los esquemas definidos en Zod para validar los datos.
- Revisar que `package.json` contiene `react-hook-form` y `@hookform/resolvers`.

## Uso de IA

Se solicitó a la IA comparar diferentes estrategias para la gestión de formularios en aplicaciones React Native. La IA propuso React Hook Form, Formik y el uso exclusivo de estados locales mediante useState. Se eligió React Hook Form debido a su integración con Zod, menor cantidad de código repetitivo y mejor rendimiento en formularios con múltiples campos y reglas de validación.