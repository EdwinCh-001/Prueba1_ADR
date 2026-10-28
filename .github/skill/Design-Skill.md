# Objetivo

Realizar exclusivamente mejoras visuales y de experiencia de usuario para la aplicación móvil EPMAPS.

NO modificar lógica de negocio.

NO modificar arquitectura.

NO crear nuevas dependencias.

NO cambiar ADRs.

NO alterar SQLite, TanStack Query, NetInfo, Expo Router, SecureStore, React Hook Form, Zod ni ningún flujo funcional existente.

El objetivo es únicamente elevar la calidad visual y la percepción profesional de la aplicación.

---

# Contexto visual

La aplicación pertenece a EPMAPS (Agua de Quito).

Se dispone únicamente de:

- Logo.jpg

No utilizar imágenes de fondo, fotografías, ilustraciones ni recursos visuales adicionales.

La aplicación debe transmitir una identidad institucional moderna mediante tipografía, colores, espaciados y componentes visuales.

Inspiración:

- aplicaciones institucionales
- servicios públicos
- sistemas de gestión operativa
- herramientas de campo para técnicos

Evitar apariencia de plantilla genérica de React Native.

---

# Estilo general

Diseño minimalista.

Priorizar:

- fondos blancos
- espacios amplios
- tarjetas limpias
- pocos colores
- jerarquía visual clara

La interfaz debe sentirse ligera y profesional.

No saturar las pantallas.

---

# Identidad visual

Utilizar el logo institucional como elemento principal de marca.

El logo debe aparecer principalmente en:

- Login
- Home
- Pantallas principales cuando sea apropiado

No repetir el logo excesivamente.

Debe verse elegante y profesional.

---

# Paleta de colores

Color principal:

- Azul institucional (#004B87) derivado del logo

Colores secundarios:

- Blanco (#FFFFFF)
- Grises suaves (#F8FAFC, #64748B)
- Gris claro para superficies

Utilizar la línea multicolor del logo únicamente como detalle visual.

Ejemplos:

- divisores decorativos
- indicadores de progreso
- pequeños acentos visuales
- elementos secundarios de branding

No utilizar la franja multicolor de forma dominante.

---

# Botones

Los botones principales deben usar tonos verdes modernos (#059669 / #10B981).

Características:

- apariencia limpia
- bordes redondeados
- alto contraste
- aspecto corporativo

El verde debe representar acciones positivas:

- Consultar
- Guardar
- Iniciar jornada
- Confirmar

Botones secundarios:

- outline
- colores suaves
- menos protagonismo

---

# Inputs y formularios

Mejorar visualmente:

- campos de entrada
- mensajes de error
- estados activos

Objetivo:

hacer que los formularios se sientan modernos y fáciles de usar.

Mantener excelente legibilidad en exteriores.

---

# Pantalla de Login

Objetivo:

Generar una primera impresión profesional.

Implementar:

- logo institucional en la parte superior
- bienvenida clara con el subtítulo: *"Aplicación oficial para técnicos de EPMAPS"*
- formulario contenido dentro de una tarjeta elegante con fondo blanco y sombra sutil
- diseño limpio y centrado

---

# Home

Objetivo:

Parecer un panel operativo.

Implementar:

- saludo más visual y ordenado
- mejor jerarquía para la búsqueda de medidor
- tarjeta para información del medidor
- mejor organización del contenido

El usuario debe identificar rápidamente:

- estado de la jornada
- conectividad
- pendientes
- búsqueda de medidores

---

# Registro de lectura

Objetivo:

Facilitar el trabajo en campo.

Implementar:

- secciones claramente separadas mediante tarjetas limpias
- mejor visualización del estado del medidor
- consumo calculado destacado con tipografía grande y alto contraste
- advertencias elegantes para consumo anómalo
- mejor presentación de la fotografía del medidor

Toda la funcionalidad debe permanecer exactamente igual.

---

# Banner de conectividad

Mantener funcionalidad actual.

Solo rediseñar visualmente.

Debe sentirse parte de la identidad visual de la aplicación.

Mostrar claramente:

- conectado (verde)
- sin conexión (rojo/alerta)
- cantidad de pendientes (contador destacado)

---

# Consistencia visual

Unificar:

- radios de borde (8px - 12px)
- colores
- tarjetas
- botones
- inputs
- espaciados (16px / 24px)
- tamaños de texto

Toda la aplicación debe parecer diseñada como un único producto.

---

# Restricciones

NO tocar:

- lógica de negocio
- sincronización
- NetInfo
- TanStack Query
- SQLite
- repositorios
- providers
- hooks
- validaciones

Solo modificar:

- estilos
- componentes visuales
- branding
- experiencia de usuario
- organización visual

---

# Resultado esperado

La aplicación debe sentirse como una herramienta institucional real utilizada por técnicos de EPMAPS en campo.

Diseño moderno, limpio, claro y minimalista.

Mantener fondos claros, logo institucional, botones verdes corporativos y pequeños acentos derivados de la franja multicolor del logo.

La funcionalidad debe permanecer intacta.