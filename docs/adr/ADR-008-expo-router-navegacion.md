# ADR-008: Usar Expo Router para la navegación de la aplicación

## Estado

Aceptado.

## Fecha

27 de octubre de 2026.

## Requisitos relacionados

R1 (inicio de sesión y restauración de sesión persistente), R3 (consulta de medidores), R4 (registro de lecturas sin conexión), R5 (flujo de registro según el estado del medidor), R7 (captura de fotografías) y R8 (continuación de registros incompletos).

## Contexto

La aplicación está compuesta por múltiples pantallas relacionadas entre sí mediante distintos flujos de trabajo.

El técnico debe autenticarse antes de acceder al sistema. Una vez iniciada la sesión, puede consultar medidores, registrar lecturas, capturar fotografías, corregir registros pendientes y continuar procesos previamente interrumpidos.

La navegación debe organizar estos flujos de forma clara y permitir controlar el acceso a determinadas pantallas según el estado de autenticación del usuario.

Además, al recuperarse un borrador almacenado localmente, la aplicación debe ser capaz de redirigir al usuario al punto adecuado del proceso de registro sin obligarlo a reiniciar todas las etapas.

La solución debe integrarse correctamente con Expo y minimizar la complejidad de configuración y mantenimiento.

## Alternativas consideradas

| **Alternativa** | **Ventajas en este proyecto** | **Desventajas en este proyecto** |
|---|---|---|
| Expo Router | Enrutamiento basado en archivos, integración oficial con Expo, organización clara de pantallas y configuración reducida. | Requiere comprender la estructura de rutas basada en directorios. |
| React Navigation configurado manualmente | Amplia flexibilidad y gran adopción en la comunidad React Native. | Exige mayor configuración inicial y más código para mantener la estructura de navegación. |
| Navegación basada únicamente en estado local | No requiere bibliotecas adicionales de navegación. | Dificulta la organización de pantallas y el mantenimiento conforme aumenta la complejidad de la aplicación. |

## Decisión

Se utilizará **Expo Router** como mecanismo principal de navegación de la aplicación.

La estructura de pantallas se organizará mediante directorios y archivos de rutas siguiendo las convenciones oficiales de Expo Router.

La navegación distinguirá dos áreas principales:

- Rutas de autenticación.
- Rutas protegidas para funcionalidades de trabajo.

La restauración de sesión definida en el ADR-001 determinará automáticamente si el usuario debe acceder al flujo de autenticación o a las funcionalidades principales de la aplicación.

Cuando exista un registro incompleto almacenado localmente, la aplicación podrá redirigir al usuario al paso correspondiente del proceso utilizando la navegación basada en rutas.

Expo Router será responsable únicamente de la navegación entre pantallas. El estado compartido del proceso de registro continuará siendo gestionado mediante React Context según lo definido en el ADR-003.

## Consecuencias

- La organización de pantallas resulta más clara y mantenible mediante la estructura basada en archivos.
- La integración con Expo reduce la configuración necesaria para comenzar el desarrollo.
- Los flujos de autenticación y trabajo pueden mantenerse claramente separados.
- La navegación hacia registros recuperados o procesos incompletos resulta más sencilla de implementar.
- Expo Router ya forma parte de la plantilla por defecto de Expo SDK 57, por lo que no se agrega ninguna dependencia
- Los desarrolladores deben respetar las convenciones de directorios y archivos establecidas por Expo Router.
- Una estructura de rutas mal diseñada puede dificultar el crecimiento futuro de la aplicación.

## Verificación

- Abrir la aplicación sin sesión activa y verificar que se muestra la pantalla de autenticación.
- Iniciar sesión correctamente y confirmar la navegación hacia las funcionalidades principales.
- Cerrar y volver a abrir la aplicación con una sesión válida y verificar que no se solicita autenticación nuevamente.
- Crear un borrador de registro, reabrir la aplicación y comprobar que la navegación permite continuar el proceso.
- Revisar que `package.json` contiene la dependencia `expo-router`.
- Confirmar que las pantallas se organizan mediante rutas basadas en archivos y no mediante configuraciones manuales extensas.

## Uso de IA

Se solicitó a la IA comparar alternativas para la navegación de una aplicación React Native desarrollada con Expo. La IA propuso Expo Router, React Navigation configurado manualmente y estrategias basadas exclusivamente en estado local. Se eligió Expo Router debido a su integración nativa con Expo, menor complejidad de configuración, organización basada en archivos y capacidad para estructurar claramente los flujos de autenticación y trabajo de la aplicación.