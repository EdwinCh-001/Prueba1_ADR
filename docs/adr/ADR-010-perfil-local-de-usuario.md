# ADR-010: Guardar el perfil del técnico localmente

## Estado

Aceptado.

## Contexto

El técnico necesita editar su nombre visible, teléfono de contacto y foto de perfil, y ver su correo y código de empleado. El nombre editable no debe sustituir el código de empleado usado para identificar los borradores y las lecturas.

## Decisión

- Firebase Authentication conserva la identidad, el correo verificado y el código de empleado.
- SQLite guarda `nombre_visible`, `telefono_contacto` y la ruta local del avatar en `perfiles`, usando el UID de Firebase Auth como clave.
- El nombre visible se solicita durante el registro y se valida con el mismo esquema usado al editar el perfil; el código de empleado permanece separado.
- El teléfono es opcional; si se registra, debe corresponder a un número ecuatoriano móvil o fijo válido.
- La fotografía se copia al directorio persistente de la aplicación; SQLite almacena solo la ruta y nunca los bytes de la imagen.
- Las lecturas, los borradores y la caché de medidores siguen en SQLite; la sesión sigue persistida con SecureStore.
- TanStack Query administra las consultas y mutaciones locales para mantener el estado de la interfaz.
- Las imágenes admitidas son JPG, PNG o WebP y deben pesar menos de 5 MB.
- El teléfono es un dato de contacto y no se presenta como verificado ni como factor de autenticación. El correo y el código de empleado son de solo lectura en la pantalla de perfil.

## Consecuencias

- El perfil editable funciona sin conexión y no requiere Firestore, Firebase Storage ni un plan Blaze.
- El perfil no se sincroniza entre dispositivos y se pierde al desinstalar o borrar los datos de la aplicación.
- El nombre visible no cambia el código de empleado usado para identificar borradores y lecturas.
- La fotografía puede ocupar espacio en el almacenamiento del dispositivo; SQLite solo conserva su ruta.
