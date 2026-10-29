---
name: epmaps-ui-uniwind
description: Rediseño visual completo de la app móvil EPMAPS (Expo SDK 57 + React Native) con Uniwind (Tailwind v4) en tema oscuro elegante, con tokens de color derivados del logo (azul #02519C y rojo #E03030) y botones verde menta. Úsala siempre que el usuario pida mejorar, renovar, rediseñar o estilizar la interfaz, el diseño, los colores, el login, el home, el registro de lectura, la pantalla de lecturas registradas o el banner de conectividad, aunque no mencione Uniwind. Solo toca estilos y componentes visuales; nunca lógica, ADRs existentes ni dependencias fuera de uniwind y tailwindcss.
---

# Rediseño visual EPMAPS con Uniwind (tema oscuro)

Este skill reemplaza a `.github/skill/Design-Skill.md` (que pedía fondos claros). La estética nueva sale de la captura de referencia del usuario: una app oscura, sobria y moderna. Se conservan de aquel skill los botones verdes, el logo institucional y la regla de no tocar lógica.

## Nota importante: esto es una migración, no un complemento

Uniwind **reemplaza** a `StyleSheet`. No conviven ni se complementan en esta app.

- Al terminar, el proyecto no debe contener `StyleSheet.create`, ni el import de `StyleSheet`, ni objetos `styles` ni `style={styles.xxx}` en ninguna pantalla ni componente de `src/`.
- Todo estilo se expresa con `className` y los tokens de `src/global.css`. Cada bloque `StyleSheet.create` existente se elimina completo, pantalla por pantalla, cuando su JSX ya fue migrado a `className`.
- Excepciones, y solo estas: (a) propiedades que no tienen equivalente en `className` y son de comportamiento más que de estilo, como `contentStyle` en `Stack` o `textAlignVertical`, y (b) estilos calculados que realmente dependen de un valor en tiempo de ejecución. Cada excepción lleva un comentario de una línea que la justifique.
- No migres a medias: no dejes una pantalla con `StyleSheet` y otra con `className`. Migra una pantalla completa por commit y no pases a la siguiente hasta que la anterior no tenga ningún `StyleSheet`.
- Esta decisión debe quedar escrita en el ADR-009 (sección 2): "se reemplaza StyleSheet por Uniwind; no se usan ambos".
- Si el usuario elige el Plan B (sección 12), ocurre lo contrario: se queda con `StyleSheet` y no se instala Uniwind. Los dos enfoques son mutuamente excluyentes.

## 0. Cómo trabajar

1. Lee `AGENTS.md` y `.github/copilot-instructions.md` antes de empezar.
2. Antes de escribir código con Uniwind, lee su documentación oficial (`https://docs.uniwind.dev/quickstart`, `https://docs.uniwind.dev/api/metro-config`, y las páginas de theming y de componentes de terceros). La API cambia entre versiones: lo que está escrito aquí es la intención de diseño y la forma esperada, y la documentación manda sobre cualquier detalle de sintaxis.
3. Trabaja en commits pequeños, en este orden: ADR, instalación y configuración, tokens, componentes, pantallas.
4. Al terminar, entrega el resumen de la sección 11.

## 1. Alcance y prohibiciones

Se puede modificar:

- Los estilos y el JSX de presentación de `src/app/**` (solo `className` y la estructura visual, ver sección 8).
- `src/components/**` (el banner y los componentes nuevos de `src/components/ui/`).
- Archivos nuevos: `src/global.css`, `metro.config.js`, `docs/adr/ADR-009-*.md`, `src/components/ui/*`.
- `app.json`: únicamente `userInterfaceStyle` pasa a `"dark"`.
- `package.json`: únicamente por la instalación de `uniwind` y `tailwindcss` (sección 3).

No se puede tocar bajo ningún concepto:

- `src/api/**`, `src/database/**`, `src/repositories/**`, `src/providers/**`, `src/hooks/**`, `src/context/**`, `src/services/**`, `src/types/**`, `src/constants/**`.
- Los ADR-001 a ADR-008, `AGENTS.md`, `.github/copilot-instructions.md`.
- Ningún `onPress`, `handleSubmit`, `useForm`, `Controller`, `useEffect`, `Alert.alert`, consulta, regla de validación ni texto de mensaje de error o de alerta.
- Ninguna otra dependencia. Prohibido: `expo-linear-gradient`, `expo-font`, `@expo-google-fonts/*`, librerías de iconos, de animación o de componentes (gluestack, react-native-paper, etc.). Si algo parece requerir una dependencia, resuélvelo con `View`, `Text` y glifos Unicode.

En las pantallas se permite solo una adición de lectura: `useSyncState()` en `home.tsx` para mostrar `pendingCount` e `isConnected` en las tarjetas. No agregues efectos, consultas ni estado nuevo.

## 2. Paso 0: escribir ADR-009 antes de instalar nada

La prueba exige que cada dependencia esté justificada en un ADR y que el commit del ADR sea anterior al commit que instala la dependencia. Uniwind y Tailwind son dependencias nuevas.

1. Crea `docs/adr/ADR-009-uniwind-estilos.md` con la estructura exacta de los ADR existentes (Estado, Fecha, Requisitos relacionados, Contexto, Alternativas consideradas, Decisión, Consecuencias, Verificación, Uso de IA).
2. Título: "ADR-009: Usar Uniwind para los estilos y el sistema de diseño de la aplicación".
3. Fecha: la fecha real de redacción. No uses fechas anteriores.
4. Requisitos relacionados: sé honesto. El rediseño responde a la sanción de la prueba por diseño visual genérico, que no es un requisito R1–R10. Indica además qué elementos de pantalla sostienen requisitos y que el rediseño debe volverlos más legibles en campo: R2 (error de formato del código), R3 (los siete datos del medidor), R6 (advertencia y confirmación de consumo anómalo), R7 (foto obligatoria u opcional y mensaje de permiso) y R9 (indicador de conexión y pendientes en todas las pantallas).
5. Alternativas (mínimo tres, con ventajas y desventajas aplicadas a este proyecto):
   - `StyleSheet` nativo con un archivo de tokens: cero dependencias, pero estilos dispersos y mucho código repetido; es la alternativa más fuerte y debe tratarse con justicia.
   - NativeWind: mismo modelo de clases, pero exige Tailwind v3 y configuración de Babel y Reanimated.
   - Uniwind: clases Tailwind v4 compiladas en Metro, sin Babel, con tokens centralizados en un CSS.
   En la Decisión, declara de forma explícita que es una migración: Uniwind reemplaza a `StyleSheet` en toda la aplicación y no se usan los dos sistemas a la vez. Lista qué archivos se migran.
6. Consecuencias: incluye al menos estas desventajas reales: dos dependencias nuevas, un `metro.config.js` que antes no existía, un paso de generación de tipos al arrancar Metro, y la posibilidad de que una clase no soportada falle en silencio.
7. Verificación: revisar `package.json` (solo `uniwind` y `tailwindcss` nuevas), que exista `src/global.css` con los tokens, y que ningún `StyleSheet.create` quede en las pantallas.
8. Uso de IA: deja el texto en blanco con un comentario `<!-- completar por el estudiante -->`. El estudiante debe escribirlo él mismo porque lo defenderá de forma oral.
9. Haz un commit que contenga solo ese archivo: `docs: ADR-009 uso de Uniwind para estilos`. Recién después continúa.

## 3. Instalación y configuración

Verifica cada paso contra la documentación oficial.

1. Instala con `npx expo install uniwind tailwindcss` (Uniwind solo soporta Tailwind v4). Si `expo install` no resuelve alguno, usa el gestor del proyecto y anótalo en el resumen.
2. Crea `src/global.css` con las importaciones que indique el quickstart (`@import 'tailwindcss';` y `@import 'uniwind';`) y, a continuación, el bloque de tokens de la sección 4. La ubicación de `global.css` define la raíz que Tailwind escanea: déjalo en `src/` para que cubra `src/app` y `src/components`.
3. Si no existe `metro.config.js`, créalo con `npx expo customize metro.config.js` y envuélvelo así (debe ser el envoltorio más externo):

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
```

4. Importa `./global.css` en la primera línea de `src/app/_layout.tsx` (no en el punto de entrada).
5. Arranca `npx expo start -c` una vez para que se genere `src/uniwind-types.d.ts` y reinicia Metro después de cualquier cambio en `metro.config.js`.
6. En `app.json` cambia `"userInterfaceStyle": "light"` por `"dark"` para que teclado, alertas nativas y barras del sistema combinen con el tema.
7. Regla de Tailwind: las clases deben aparecer como cadenas completas en el código. Nunca construyas clases con interpolación (`` `bg-${tone}` ``). Usa objetos de búsqueda con las clases completas.

## 4. Sistema de diseño: tokens

Un único tema oscuro (sin alternancia claro/oscuro, para minimizar riesgo). Los hex salen de dos fuentes: los neutros de la captura de referencia (`#1C1C1E`, `#2C2C2E`, menta de los botones) y los colores del logo (azul `#02519C`, rojo `#E03030`). Pega esto en `src/global.css` tras las importaciones:

```css
@theme {
  /* Neutros (referencia) */
  --color-background: #1c1c1e;
  --color-surface: #2c2c2e;
  --color-surface-raised: #363638;
  --color-field: #232325;
  --color-line: #3a3a3c;

  /* Texto */
  --color-content: #ffffff;
  --color-content-muted: #a1a1a6;
  --color-content-subtle: #8e8e93;

  /* Marca (logo EPMAPS) */
  --color-brand: #02519c;
  --color-brand-dark: #0a3a6e;
  --color-brand-light: #5aa9f0;
  --color-brand-soft: #12325a;
  --color-accent-red: #e03030;

  /* Acción (botones verde menta de la referencia) */
  --color-action: #3ddc8e;
  --color-action-pressed: #2fbf78;
  --color-on-action: #0b1f14;

  /* Estados */
  --color-success: #3ddc8e;
  --color-success-soft: #17382a;
  --color-warning: #f5a524;
  --color-warning-soft: #3a2e14;
  --color-danger: #ff6b6b;
  --color-danger-soft: #3c2022;
}
```

Reglas de uso:

- Fondo de pantalla `bg-background`; tarjetas `bg-surface`; campos de texto `bg-field` con borde `border-line`.
- Texto principal `text-content`; secundario `text-content-muted`; marcadores y placeholders `text-content-subtle` (nunca para información importante).
- El azul `brand` puro (#02519C) es oscuro y se pierde sobre fondo oscuro. Úsalo solo como relleno de superficies grandes (el hero del medidor, la barra de acento). Para texto azul, bordes o insignias sobre oscuro usa `brand-light`.
- Verde `action`: solo acciones positivas (Iniciar jornada, Consultar, Registrar, Guardar) y valores correctos. El texto sobre verde es siempre `text-on-action`.
- Rojo del logo `accent-red`: solo detalles de marca (la barra de acento y el punto del banner sin conexión). Los errores de texto usan `danger`.
- Sin sombras: la separación se logra con contraste de superficie y bordes, como en la referencia.
- Para evitar riesgo con modificadores de opacidad, usa los tokens `*-soft` en lugar de `bg-xxx/20`.

## 5. Tipografía, espacios y formas

Sin fuentes personalizadas (instalar fuentes agregaría dependencias).

| Uso | Clases |
| --- | --- |
| Título de pantalla (como "HOLA ANDRES") | `text-3xl font-extrabold uppercase tracking-wide text-content` |
| Etiqueta superior (eyebrow) | `text-xs font-bold uppercase tracking-widest text-brand-light` |
| Título de tarjeta | `text-lg font-bold text-content` |
| Título de sección ("Nuevos trainings") | `text-sm font-semibold text-content-muted` |
| Cuerpo | `text-base text-content` |
| Apoyo | `text-sm text-content-muted` |
| Cifra grande (consumo) | `text-5xl font-extrabold` |
| Texto de botón | `text-base font-extrabold uppercase tracking-wider` |

- Márgenes laterales de pantalla `px-5`; separación vertical entre bloques `gap-5` o `mt-5`; relleno de tarjeta `p-5`.
- Radios: tarjetas `rounded-3xl`, campos y selectores `rounded-2xl`, botones y chips `rounded-full`, insignias `rounded-lg`.
- Alto táctil mínimo 56 px para botones principales (`h-14`) y 48 px para el resto. Texto mínimo `text-sm`.
- Quita los `paddingTop: 64` actuales: el `SafeAreaView` de la raíz ya reserva la zona superior. Usa `pt-4` o `pt-6`.

## 6. Logo

- Archivo: `assets/logo-epmaps.jpg` (o el `Logo.jpg` que ya exista en `assets/`). Si ningún logo está en el repositorio, detente y pide al usuario copiarlo; no inventes ni dibujes uno.
- El logo es azul sobre fondo blanco y no se ve sobre el tema oscuro. Muéstralo siempre dentro de una "placa" blanca redondeada (`LogoPlate`). No lo inviertas, no le cambies el color y no lo deformes (`resizeMode="contain"`).
- Proporción aproximada 2.1:1. El archivo es de baja resolución: no lo muestres a más de unos 128 px de ancho para que no se vea borroso.
- Aparece solo en Login (grande) y Home (pequeño). En el resto de pantallas, no.
- Detalle de marca derivado del logo: una barra fina de dos tramos, rojo (≈20 %) y azul (resto), llamada `AccentBar`. Úsala bajo el banner, en el pie del Login y como separador del hero.

## 7. Componentes reutilizables (`src/components/ui/`)

Son 100 % presentacionales: reciben props y no importan hooks, repositorios ni contexto. Cada pantalla los consume. Implementa al menos estos:

```tsx
// button.tsx
import { Pressable, Text } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, disabled }: ButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      className="h-14 items-center justify-center rounded-full bg-action active:bg-action-pressed disabled:opacity-50"
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="text-base font-extrabold uppercase tracking-wider text-on-action">{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled }: ButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      className="h-14 items-center justify-center rounded-full border border-brand-light active:bg-brand-soft disabled:opacity-50"
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="text-base font-bold text-brand-light">{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, tone = 'muted' }: ButtonProps & { tone?: 'muted' | 'danger' }): React.JSX.Element {
  const textClass = tone === 'danger' ? 'text-danger' : 'text-content-muted';
  return (
    <Pressable accessibilityRole="button" className="h-12 items-center justify-center rounded-full active:bg-surface" onPress={onPress}>
      <Text className={`text-base font-semibold ${textClass}`}>{label}</Text>
    </Pressable>
  );
}
```

Verifica en la documentación que las variantes `active:` y `disabled:` funcionen sobre `Pressable`; si no, usa el estado de pulsación mediante la prop `style` solo para la opacidad.

Resto de componentes (misma carpeta, un archivo por componente o agrupados por afinidad):

| Componente | Descripción visual |
| --- | --- |
| `Card` | `rounded-3xl bg-surface p-5`; acepta `className` extra. |
| `Badge` | Insignia de contorno como el "PRO" de la referencia: `self-start rounded-lg border border-brand-light px-3 py-1`, texto `text-xs font-bold uppercase tracking-widest text-brand-light`. |
| `StatusChip` | Chip `rounded-full px-3 py-1` con tonos `success`, `warning`, `danger`, `info` y `neutral`, definidos en un objeto con clases completas (caja y texto). |
| `StatsRow` y `StatTile` | Fila de tres cifras como en la referencia: cada tile `flex-1 items-center` con valor `text-2xl font-extrabold text-content` y etiqueta `text-xs text-content-muted`; separadores `h-10 w-px bg-line`. |
| `KeyValueRow` | Fila etiqueta/valor: etiqueta `text-sm text-content-muted`, valor `text-sm font-semibold text-content text-right`, con línea inferior `border-b border-line` salvo la última. |
| `SectionTitle` | Título de sección pequeño (`text-sm font-semibold text-content-muted`) con margen superior. |
| `ListRow` | Fila como "Simple Warm-Up Exercises": `flex-row items-center rounded-3xl bg-surface p-4`; a la izquierda un recuadro `h-14 w-14 rounded-2xl bg-brand-soft` con un glifo, en medio título y subtítulo (el subtítulo en `text-action`), y a la derecha el chevron `›` en `text-action text-2xl`. |
| `Field` | Envoltorio de campo: etiqueta `text-sm font-semibold text-content-muted`, el hijo (el `TextInput` dentro del `Controller` de cada pantalla) y el mensaje de error `text-sm text-danger` debajo. |
| `LogoPlate` | `self-start rounded-2xl bg-white px-4 py-3` con el `Image` del logo (`resizeMode="contain"`). |
| `AccentBar` | `h-1 flex-row overflow-hidden rounded-full` con un `View w-1/5 bg-accent-red` y un `View flex-1 bg-brand`. |
| `Screen` | `ScrollView` con `className="flex-1 bg-background"` y `contentContainerClassName="px-5 pb-10 pt-6 gap-5"` (verifica el nombre de la prop en la documentación), y `keyboardShouldPersistTaps="handled"`. |

Clase de entrada de texto compartida, exportada como constante para usarla en los `TextInput` de las pantallas:

```tsx
export const inputClassName =
  'h-14 rounded-2xl border border-line bg-field px-4 text-base text-content focus:border-brand-light';
```

Para el color del placeholder usa la prop `placeholderTextColorClassName="accent-content-subtle"` (confírmala en la documentación). Si no existe, resuélvelo con `useCSSVariable('--color-content-subtle')` pasado a `placeholderTextColor`.

Para `SafeAreaView` (componente de terceros) usa el envoltorio de Uniwind:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

export const StyledSafeAreaView = withUniwind(SafeAreaView);
```

## 8. Rediseño pantalla por pantalla

En todas: conserva los textos de alertas y de errores, el orden de los controles interactivos y todos los datos que hoy se muestran. Cambia el contenedor, la jerarquía y las clases.

### 8.1 Raíz (`src/app/_layout.tsx`)

- Importa `./global.css` primero. Reemplaza el `SafeAreaView` por `StyledSafeAreaView` con `edges={['top']}` y `className="flex-1 bg-background"`.
- Añade `<StatusBar style="light" />` (de `expo-status-bar`, que ya es dependencia).
- `Stack` con `headerShown: false` y `contentStyle: { backgroundColor: '#1c1c1e' }` (el único hex permitido fuera de `global.css`, para evitar destellos blancos entre pantallas; comenta que replica `--color-background`).
- Los layouts de `(auth)` y `(protected)` pueden recibir el mismo `contentStyle` en sus `Stack` (solo estilo).

### 8.2 Banner de conectividad (`src/components/connectivity-banner.tsx`)

Mantén exactamente los valores que muestra (`isConnected`, `pendingCount`, `syncError`).

- Barra delgada `bg-surface px-5 py-2 flex-row items-center justify-between`.
- Izquierda: punto de 10 px (`h-2.5 w-2.5 rounded-full`) verde `bg-success` si hay conexión o rojo `bg-accent-red` si no, y texto "Conectado" o "Sin conexión" en `text-xs font-semibold text-content`.
- Derecha: chip con "Pendientes N". Tono `warning` si N > 0 y `neutral` si es 0.
- Debajo, la `AccentBar` de 2–4 px a todo el ancho.
- Si hay `syncError`, una fila `bg-danger-soft px-5 py-2` con el texto en `text-xs text-danger`.
- El banner debe verse en todas las pantallas, incluido el Login (requisito R9).

### 8.3 Login (`src/app/(auth)/login.tsx`)

Estructura vertical centrada, con scroll para teclados pequeños:

1. `LogoPlate` arriba, centrado y grande (`h-14 w-28`).
2. Etiqueta (eyebrow) "APLICACIÓN OFICIAL PARA TÉCNICOS".
3. Título "BIENVENIDO" en el estilo de título de pantalla y subtítulo "Ingresa para comenzar tu jornada." (`text-content-muted`).
4. `Card` con los dos campos: cada uno es `Field` + `Controller` + `TextInput` con `inputClassName`, y el error de Zod debajo. El error de autenticación va en una fila `bg-danger-soft rounded-2xl p-3` con texto `text-danger`.
5. `PrimaryButton` con el texto actual ("Iniciar jornada" / "Ingresando...") y `disabled={isSubmitting}`.
6. Pista de demo como chip `neutral` ("Demo: TEC001 / 1234").
7. Pie: `AccentBar` corta y el texto "EPMAPS · Agua de Quito" en `text-xs text-content-subtle`.

### 8.4 Home (`src/app/(protected)/home.tsx`) — pantalla modelo, calcada de la referencia

Orden de bloques:

1. **Cabecera**: a la izquierda "HOLA, {employeeCode}" en estilo de título de pantalla; a la derecha un avatar circular `h-11 w-11 rounded-full border border-content-muted` con las dos primeras letras del código. Sobre la cabecera, `LogoPlate` pequeño (`h-9 w-20`).
2. **Tarjeta de jornada** (equivalente a la tarjeta "PRO" de la referencia): `Card` con `Badge` "Jornada activa", debajo `StatsRow` con tres cifras: Pendientes (`pendingCount`), Conexión ("En línea" o "Sin red", con `isConnected`) y Hoy (día y mes abreviados, ej. "29 oct", con `toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })`). Termina con `PrimaryButton`/`SecondaryButton` "Ver lecturas registradas" que ejecuta el mismo `router.push('/pending')` existente.
3. **Buscador**: `SectionTitle` "Consultar medidor", `TextInput` (`inputClassName`, mismo `Controller`, mismas reglas), mensaje de error de formato debajo (R2), y `PrimaryButton` "Consultar medidor". Mientras `isFetching`, una fila con `ActivityIndicator` (de `react-native`, color verde) y "Consultando..."; si `isError`, una fila `bg-danger-soft` con el mensaje.
4. **Tarjeta del medidor** (solo si `visibleMeter`; equivale a la tarjeta con foto "COGNITIVO 1"): contenedor `overflow-hidden rounded-3xl bg-surface`.
   - Parte superior tipo hero `bg-brand p-5`: código del medidor en grande (`text-3xl font-extrabold text-white`), el estado como `StatusChip` y, de decoración, dos círculos translúcidos hechos con `View` (`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-dark` y uno menor) que evocan gotas de agua. Sin imágenes.
   - Parte inferior `p-5` con los **siete datos obligatorios** en `KeyValueRow` (R3): Dirección, Sector, Número de cuenta, Estado, Última lectura, Fecha de la última lectura y Promedio mensual. No los ocultes ni los colapses.
   - `PrimaryButton` "Registrar lectura" con el `onPress` existente.
5. **Acciones** (equivale a "Nuevos trainings"): `SectionTitle` y un `ListRow` "Lecturas registradas" (subtítulo "Revisa, corrige y verifica envíos") si no duplicas el botón de la tarjeta de jornada; si lo duplicas, elige uno solo.
6. **Cerrar sesión**: `GhostButton` con `tone="danger"` al final, con el `handleSignOut` existente.

### 8.5 Registro de lectura (`src/app/(protected)/register.tsx`)

Cada bloque es una `Card` separada; todo el comportamiento permanece igual.

1. **Resumen del medidor**: hero compacto `bg-brand` con etiqueta "REGISTRO DE LECTURA", código y, en dos `StatTile`, "Lectura anterior" y "Promedio mensual".
2. **Estado del medidor**: tres botones en fila (`flex-row gap-2`, cada uno `flex-1 items-center rounded-2xl border py-3`). Seleccionado, con color por estado mediante un objeto de clases completas: Normal `border-action bg-success-soft`, Inaccesible `border-warning bg-warning-soft`, Dañado `border-danger bg-danger-soft`, texto `font-bold text-content`. No seleccionado: `border-line bg-field` y texto `text-content-muted`.
3. **Lectura actual** (si no es inaccesible): `TextInput` numérico grande (`h-16 text-3xl font-bold text-center`, `inputClassName` como base). Debajo, **Consumo calculado** como tarjeta destacada: etiqueta pequeña y cifra `text-5xl font-extrabold`, en `text-success` normalmente y en `text-warning` si `isAnomalous`.
4. **Consumo anómalo** (R6): tarjeta `bg-warning-soft` con borde `border-warning`, glifo "⚠", el mismo texto de advertencia y, debajo, la fila de confirmación que hoy es un `Pressable`: una casilla `h-6 w-6 rounded-md border-2` (con "✓" al marcarla) más el texto de confirmación actual. Mantén el `onPress` que alterna `anomalyConfirmed`.
5. **Motivo** (inaccesible) y **Descripción del daño** (dañado): `Field` con `TextInput` multilínea (`min-h-24 pt-3`, `textAlignVertical: 'top'`), con los mismos errores.
6. **Fotografía** (R7): `Card` con título "Fotografía del medidor" y una insignia a la derecha: "OBLIGATORIA" (`danger`) u "OPCIONAL" (`neutral`), según `photoRequired`. Si no hay foto, zona `border border-dashed border-line rounded-2xl p-5` con el texto de apoyo actual; si la hay, el `Image` de vista previa con `rounded-2xl h-48 w-full`. El botón `SecondaryButton` conserva el texto actual según haya o no foto. Los mensajes de verificación de la foto se muestran como filas de `StatusChip` o texto `text-sm` en `danger` o `muted`, con los mismos textos.
7. **Acciones**: `PrimaryButton` "Guardar lectura" (con el texto "Guardando..." mientras `isSubmitting`) y `GhostButton` "Cancelar".
8. Estado vacío ("No hay un medidor seleccionado"): `Card` centrada con `PrimaryButton` "Volver".

### 8.6 Lecturas registradas (`src/app/(protected)/pending.tsx`)

- Cabecera con eyebrow "CONTROL DE LECTURAS" y título "LECTURAS REGISTRADAS".
- Cada lectura es una `Card`: fila superior con el código en `text-lg font-bold` y, a la derecha, `StatusChip` de envío ("Pendiente de enviar" en `warning`, "Enviada" en `success`). Debajo, `KeyValueRow` para Período, Consumo (el valor actual o "Sin lectura") y Fecha. Una segunda fila con el `StatusChip` de verificación: pendiente → `info`, verificada → `success`, inconsistente → `danger`.
- Foto: el `StoredPhotoPreview` existente con `rounded-2xl`; los mensajes "Comprobando fotografía..." y "Fotografía no disponible..." como texto `text-sm text-content-muted`.
- "Corregir lectura" (solo si está pendiente de envío): `SecondaryButton`, mismo `onPress`.
- Vacío: `Card` centrada con glifo y "No hay lecturas registradas."
- Pie: `GhostButton` "Volver al inicio".

## 9. Contrato funcional que el rediseño no puede romper

| Requisito | Elemento de interfaz que debe seguir visible y funcional |
| --- | --- |
| R1 | Login con código y clave; botón "Cerrar sesión" accesible con scroll en Home. |
| R2 | Error "Usa el formato MED-123456" bajo el campo; no se consulta con un código incompleto. |
| R3 | Los siete datos del medidor. |
| R5 | Los tres estados y sus campos obligatorios. |
| R6 | Consumo calculado, advertencia de consumo anómalo y confirmación. |
| R7 | Etiqueta obligatoria/opcional de la foto, vista previa, y el aviso de permiso denegado (es un `Alert`, no se toca). |
| R9 | Banner de conexión y pendientes en todas las pantallas. |
| R10 | Botón "Corregir lectura" solo en pendientes. |

## 10. Accesibilidad y uso en campo

- Los técnicos trabajan al aire libre: contraste alto, texto nunca por debajo de `text-sm`, cifras clave en grande.
- Verifica que el texto secundario sobre `bg-surface` cumpla contraste 4.5:1 (`content-muted` lo cumple; `content-subtle` solo para placeholders).
- Todo `Pressable` lleva `accessibilityRole="button"`; las casillas, `accessibilityRole="checkbox"` con `accessibilityState={{ checked }}`.
- No transmitas un estado solo con color: acompaña siempre con texto o glifo.

## 11. Verificación y entrega

1. Ejecuta `npx tsc --noEmit`, `npx expo lint` y `npx expo-doctor`. Corrige lo que tu cambio haya provocado.
2. Ejecuta `git diff --stat` y confirma que no hay cambios en las carpetas prohibidas de la sección 1. Si aparece alguno, revierte.
3. Confirma con `grep -rn "StyleSheet" src/` que no queda ningún resultado (ni el import, ni `StyleSheet.create`, ni `styles.`), y que no hay valores hex fuera de `global.css` (excepto el `contentStyle` de la sección 8.1). Un solo `StyleSheet` restante significa que la migración está incompleta.
4. Arranca con `npx expo start -c` y revisa cada pantalla en el emulador o dispositivo. Menciona expresamente qué no pudiste verificar visualmente.
5. Entrega un resumen corto con: archivos creados y modificados, clases o variantes de Uniwind que hayas tenido que cambiar respecto a este documento y por qué, dependencias instaladas (solo `uniwind` y `tailwindcss`), y pendientes para el usuario (reconstruir el APK, completar "Uso de IA" del ADR-009, reemplazar el logo por una versión de mayor resolución).

## 12. Plan B (solo si el usuario dice "sin Uniwind")

Alternativa excluyente: o se migra a Uniwind (todo el skill) o se usa este plan, nunca ambos. Mismo diseño, cero dependencias: crea `src/theme/tokens.ts` con los colores de la sección 4 como constantes y escribe los componentes de la sección 7 con `StyleSheet.create` consumiendo esos tokens. No se instala nada y no hace falta el ADR-009 ni `metro.config.js`. Aplica igual la sección 8 y la sección 9.