# Proyecto: App de Lecturas de Medidores (EPMAPS)

## Contexto del proyecto

Aplicación móvil desarrollada con Expo y React Native para técnicos encargados de registrar lecturas de medidores.

La aplicación debe funcionar correctamente con conexión limitada o inexistente, permitiendo almacenar y sincronizar información cuando la conectividad sea recuperada.

Todas las decisiones técnicas deben respetar los ADR definidos en `docs/adr`.

---

# Arquitectura aprobada

## Persistencia local

Utilizar exclusivamente:

- expo-sqlite

La base de datos SQLite es la fuente de verdad para:

- lecturas registradas
- lecturas pendientes de sincronización
- borradores de registros
- caché persistente de medidores

No utilizar:

- AsyncStorage
- MMKV
- Realm

---

## Gestión de sesión

Utilizar exclusivamente:

- expo-secure-store

SecureStore almacena únicamente la información necesaria para mantener la sesión activa.

No almacenar credenciales dentro de SQLite.

---

## Consultas remotas

Utilizar exclusivamente:

- @tanstack/react-query

Responsabilidades:

- consultas a MockAPI
- estados loading
- estados error
- reintentos
- invalidación de consultas
- reutilización de datos

No utilizar:

- SWR
- RTK Query

Axios solo podrá utilizarse si existe una necesidad específica no cubierta por fetch.

Por defecto utilizar fetch.

---

## Estado compartido

Utilizar:

- React Context

Responsabilidades:

- flujo de registro
- lectura actual
- estado del medidor
- fotografía
- observaciones
- paso actual del proceso

No utilizar:

- Redux
- Redux Toolkit
- Zustand
- MobX

---

## Formularios

Utilizar:

- react-hook-form

Todas las validaciones deben ejecutarse mediante:

- zod
- @hookform/resolvers

No realizar validaciones complejas directamente dentro de los componentes.

---

## Validaciones

Utilizar esquemas Zod para:

- formularios
- respuestas de MockAPI
- datos persistidos

El formato del código de medidor debe ser:

```text
MED-123456
```

mediante expresiones regulares y esquemas compartidos.

---

## Fotografías

Utilizar:

- expo-image-picker
- expo-file-system

Las fotografías deben copiarse desde la ubicación temporal de captura hacia un directorio persistente controlado por la aplicación.

SQLite únicamente almacena la ruta del archivo.

Nunca almacenar imágenes completas dentro de SQLite.

---

## Conectividad

Utilizar:

- @react-native-community/netinfo

Responsabilidades:

- detectar cambios de conectividad
- iniciar sincronización automática
- controlar funcionamiento offline

No realizar verificaciones mediante temporizadores periódicos.

---

## Navegación

Utilizar:

- expo-router

Seguir estructura basada en archivos.

Separar claramente:

- autenticación
- rutas protegidas
- flujo de registro

---

# Reglas de desarrollo

## TypeScript

Utilizar tipado estricto.

Evitar:

- any
- ts-ignore

Preferir:

- interfaces
- types
- esquemas Zod inferidos

---

## Componentes

Mantener componentes pequeños y reutilizables.

Evitar:

- componentes con más de una responsabilidad
- lógica de negocio dentro de la UI

Mover lógica a:

- hooks personalizados
- servicios
- repositorios

---

## Base de datos

Toda operación de SQLite debe centralizarse.

Evitar consultas SQL dispersas en pantallas.

Preferir:

```text
src/database/
src/repositories/
```

---

## Sincronización

Las lecturas pendientes deben:

1. guardarse localmente
2. marcarse como pendientes
3. sincronizarse automáticamente al recuperar conexión
4. marcarse como enviadas tras una respuesta exitosa

Nunca eliminar una lectura pendiente antes de confirmar el éxito del envío.

---

## Restricciones importantes

No introducir nuevas dependencias sin una justificación arquitectónica.

Antes de sugerir una nueva librería, verificar si la funcionalidad ya puede resolverse con:

- Expo SDK
- React
- TanStack Query
- SQLite
- React Hook Form
- Zod

Priorizar simplicidad, funcionamiento offline y compatibilidad con los ADR existentes.

## Requisitos de la prueba que deben cumplirse

- Consulta de medidores: leer primero `medidores_cache`; vigencia 12 horas; timeout de 10 segundos con AbortController; `gcTime` de 24 horas; conectar NetInfo con `onlineManager` de TanStack Query.
- Borrador (R8): tabla `borradores`, una fila por código de empleado, guardada en cada cambio de paso; al abrir la aplicación ofrecer continuar o descartar.
- Lectura registrada sin conexión (R4): marcarla como pendiente de verificar y compararla con la lectura anterior al recuperar la conexión.
- Envío (R9): antes de enviar, consultar si ya existe una lectura con el mismo identificador del cliente; indicador de conexión y número de pendientes en el layout raíz.
- Foto (R7): obligatoria solo con consumo mayor al triple del promedio o con medidor dañado. Si se niega el permiso de cámara, explicar el motivo y permitir continuar cuando la foto es opcional.
- Consumo anómalo (R6): mostrar advertencia y exigir confirmación del técnico.
- Una lectura enviada no se corrige; no se permite un segundo registro del mismo medidor en el mismo mes.
- Instalar siempre con `npx expo install` y consultar la documentación de la versión instalada de Expo.