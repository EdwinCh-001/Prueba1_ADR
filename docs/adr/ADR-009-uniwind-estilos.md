# ADR-009: Usar Uniwind para los estilos y el sistema de diseño de la aplicación

## Estado

Aceptado.

## Fecha

29 de octubre de 2026.

## Requisitos relacionados

El rediseño visual responde por una interfaz genérica. Sin embargo, varios elementos de pantalla sostienen requisitos y el rediseño debe volverlos más legibles en campo:

- R2: el mensaje de error de formato del código de medidor debe seguir visible bajo el campo.
- R3: los siete datos del medidor deben seguir visibles y jerarquizados.
- R6: la advertencia de consumo anómalo y su confirmación deben seguir claras.
- R7: la etiqueta de foto obligatoria u opcional, la vista previa y el mensaje de permiso denegado deben conservarse.
- R9: el indicador de conexión y la cantidad de pendientes deben verse en todas las pantallas.

## Contexto

La aplicación móvil de EPMAPS está construida con Expo SDK 57 y React Native. Hasta ahora, cada pantalla define sus estilos con `StyleSheet.create` y valores hexadecimales repetidos en cada archivo. Esto produce un diseño visual genérico, dificulta mantener una identidad institucional coherente y obliga a repetir decenas de líneas de estilo por pantalla.

La prueba calificó negativamente el diseño visual por ser genérico. Se necesita un tema oscuro sobrio, con jerarquía tipográfica clara, contraste alto y uso de los colores del logo de EPMAPS. El cambio debe ser visual: no se puede alterar la lógica de negocio, las validaciones, las consultas, la navegación ni los textos de alertas y errores.

El proyecto ya usa Expo Router y Metro. Cualquier solución de estilos debe integrarse con ese bundler, funcionar sin Babel adicional y mantener el rendimiento en un dispositivo de campo. También debe permitir centralizar los tokens de color y tipografía en un solo archivo para que un cambio de marca no obligue a recorrer todas las pantallas.

## Alternativas consideradas

| **Alternativa** | **Ventajas en este proyecto** | **Desventajas en este proyecto** |
|---|---|---|
| `StyleSheet` nativo con un archivo de tokens | Cero dependencias nuevas, máxima estabilidad, sin configuración de bundler y sin pasos de generación de tipos. Es la opción de menor riesgo técnico. | Los estilos siguen dispersos en cada pantalla, se repite mucho código, no hay utilidades de estado ni variantes, y mantener la coherencia visual depende de la disciplina de cada archivo. El rediseño seguiría siendo lento de aplicar y de revisar. |
| NativeWind | Mismo modelo de clases utilitarias que Tailwind, amplia adopción y documentación madura. | Exige Tailwind v3, configuración de Babel y de Reanimated, y arrastra más dependencias y pasos de build. La integración con SDK 57 es más frágil. |
| Uniwind | Clases de Tailwind v4 compiladas directamente en Metro, sin Babel ni Reanimated. Tokens centralizados en un `global.css` con `@theme`, tipado generado y soporte de `className` en componentes de React Native. Integración oficial para Expo. | Dos dependencias nuevas (`uniwind` y `tailwindcss`), un `metro.config.js` que antes no existía, un paso de generación de tipos al arrancar Metro y la posibilidad de que una clase no soportada falle en silencio. |

## Decisión

Se utilizará **Uniwind** con **Tailwind CSS v4** para definir los estilos y el sistema de diseño de la aplicación.

Esta decisión es una **migración**: Uniwind reemplaza a `StyleSheet` en toda la aplicación y **no se usan ambos sistemas a la vez**. Al finalizar, ningún archivo de `src/` debe contener `StyleSheet.create`, el import de `StyleSheet`, objetos `styles` ni `style={styles.xxx}`. Solo se admiten excepciones puntuales para propiedades sin equivalente en `className` y para estilos calculados en tiempo de ejecución, cada una con un comentario que la justifique.

Los estilos migrados son:

- `src/app/_layout.tsx`
- `src/app/(auth)/login.tsx`
- `src/app/(protected)/home.tsx`
- `src/app/(protected)/register.tsx`
- `src/app/(protected)/pending.tsx`
- `src/components/connectivity-banner.tsx`

Los estilos nuevos se concentran en:

- `src/global.css`: importaciones de Tailwind y Uniwind, y tokens de color del tema oscuro.
- `src/components/ui/`: componentes presentacionales reutilizables (`Button`, `Card`, `Badge`, `StatusChip`, `StatsRow`, `KeyValueRow`, `Field`, `LogoPlate`, `AccentBar`, `Screen`).

Se adopta un único tema oscuro, sin alternancia claro/oscuro, para minimizar riesgo. `app.json` cambia `userInterfaceStyle` a `"dark"` para que teclado, alertas nativas y barras del sistema combinen con la interfaz.

La lógica de negocio, las consultas, los repositorios, las validaciones, la navegación y los textos de alertas y errores no se modifican. Uniwind se ocupa únicamente de la presentación.

### Actualización posterior: tema claro

El 29 de octubre de 2026 se reemplazó el tema oscuro por un tema claro a pedido del usuario. Se mantienen Uniwind, los tokens y la estructura de componentes; solo cambian los valores de `src/global.css`, `userInterfaceStyle` vuelve a `"light"`, la barra de estado pasa a `style="dark"` y el `contentStyle` de los `Stack` se ajusta al nuevo fondo. Los neutros y los colores de estado se oscurecieron para conservar el contraste sobre superficies blancas.

## Consecuencias

- La interfaz gana coherencia visual y una identidad derivada del logo institucional.
- Los tokens de color y tipografía quedan en un solo archivo, lo que facilita futuros ajustes de marca.
- Cada pantalla queda más corta y legible al eliminar los bloques de `StyleSheet`.
- Se agregan dos dependencias nuevas al proyecto: `uniwind` y `tailwindcss`.
- Aparece un `metro.config.js` que antes no existía y debe mantenerse como el envoltorio más externo de la configuración de Metro.
- Metro genera `src/uniwind-types.d.ts` al arrancar; sin ese paso, TypeScript no reconoce las clases.
- Una clase no soportada por React Native puede fallar en silencio, por lo que hay que verificar visualmente cada pantalla.
- El equipo debe conocer las utilidades de Tailwind y la regla de escribir clases completas, sin interpolación dinámica.
- No hay alternancia automática entre tema claro y oscuro: el tema vigente se define en `src/global.css`.

## Verificación

- Revisar `package.json` y confirmar que las únicas dependencias nuevas son `uniwind` y `tailwindcss`.
- Confirmar que existe `src/global.css` con las importaciones de Tailwind y Uniwind y el bloque `@theme` con los tokens del tema vigente.
- Ejecutar `grep -rn "StyleSheet" src/` y confirmar que no queda ningún resultado.
- Confirmar que no hay valores hexadecimales de interfaz fuera de `src/global.css` y de la configuración nativa de `app.json`.
- Recorrer Login, Home, Registro de lectura y Lecturas registradas en un dispositivo o emulador y verificar que el banner de conexión y pendientes se ve en todas.
- Verificar que los siete datos del medidor, el error de formato, la advertencia de consumo anómalo, la etiqueta de foto y el botón "Corregir lectura" siguen visibles y funcionales.
- Ejecutar `npx tsc --noEmit`, `npx expo lint` y `npx expo-doctor`.

## Uso de IA

<!-- completar por el estudiante -->
