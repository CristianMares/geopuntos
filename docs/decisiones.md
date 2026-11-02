# Decisiones de diseño

Aquí se anotan los cambios respecto a lo recomendado en el enunciado y las decisiones que no son obvias. Cada entrada dice qué se decidió, por qué y qué otra opción había.

## D-01. Flujo de ramas y pull requests

**Fecha:** 2026-11-02

**Decisión:** `main` solo recibe el pull request final. `desarrollo` es la rama de integración. Cada bloque de trabajo sale de `desarrollo` en una rama corta (`feature/...`) y vuelve con su propio pull request.

```mermaid
gitGraph
    commit id: "Estructura inicial"
    branch desarrollo
    checkout desarrollo
    branch feature/documentacion
    checkout feature/documentacion
    commit id: "Docs"
    checkout desarrollo
    merge feature/documentacion
    branch feature/base-de-datos
    checkout feature/base-de-datos
    commit id: "Esquema y semilla"
    checkout desarrollo
    merge feature/base-de-datos
    checkout main
    merge desarrollo tag: "Entrega"
```

**Por qué:** cada pull request se revisa por separado, el historial queda ordenado y `main` siempre tiene código que funciona.

**Alternativa descartada:** trabajar todo en `desarrollo` y hacer un solo pull request al final. Es más rápido, pero el cambio final sería enorme y difícil de revisar.

## D-02. Al eliminar un usuario se eliminan sus puntos

**Fecha:** 2026-11-02

**Decisión:** `puntos.usuario_id` usa `ON DELETE CASCADE`. Cuando se elimina un usuario, desaparecen también todos los puntos que registró.

**Por qué:** `usuario_id` es obligatorio, así que un punto no puede quedar sin dueño. Se eligió que los datos de un usuario eliminado se vayan con él.

**Alternativas descartadas:**
- `ON DELETE RESTRICT`: obliga a borrar o reasignar los puntos antes de eliminar al usuario. Es más seguro, pero más incómodo.
- `ON DELETE SET NULL`: conserva los puntos, pero exige que `usuario_id` acepte nulos y se pierde quién los registró.

**Consecuencias:**
- La acción es destructiva e irreversible, por eso la confirmación debe avisar cuántos puntos se van a eliminar.
- Para no perder información, la alternativa es desactivar al usuario (`activo = false`) en lugar de eliminarlo.

## D-03. Restricciones en la base de datos

**Fecha:** 2026-11-02

**Decisión:** además de validar en la API y en los formularios, se agregan `CHECK` en la base de datos:
- `usuarios.rol` solo acepta `ADMIN` o `USUARIO`.
- `puntos.latitud` entre -90 y 90, y `puntos.longitud` entre -180 y 180.
- `categorias.color` con formato `#RRGGBB`.

**Por qué:** el enunciado solo las menciona como notas. Si se validan solo en la API, un dato incorrecto puede entrar por un script o por una consulta directa. Con `CHECK` la base se protege sola.

## D-04. Correo único sin distinguir mayúsculas

**Fecha:** 2026-11-02

**Decisión:** índice único sobre `LOWER(correo)` en lugar de `UNIQUE` sobre la columna. La API también normaliza el correo a minúsculas antes de guardar o buscar.

**Por qué:** con un `UNIQUE` simple, `Ana@empresa.com` y `ana@empresa.com` serían dos usuarios distintos, lo que confunde al iniciar sesión.

## D-05. Columna `actualizado_en`

**Fecha:** 2026-11-02

**Decisión:** `usuarios` y `puntos` incluyen `actualizado_en`, que se actualiza en cada edición.

**Por qué:** permite saber cuándo se modificó un registro por última vez. El costo es una columna más por tabla.

## D-06. Índices de apoyo

**Fecha:** 2026-11-02

**Decisión:** índices sobre `puntos.categoria_id`, `puntos.usuario_id` y `LOWER(puntos.nombre)`.

**Por qué:** PostgreSQL no crea índices automáticamente en las llaves foráneas. Estas columnas se usan en los filtros y en los `JOIN`. Con pocos datos no se nota, pero es una buena práctica.

## D-07. Una categoría con puntos no se puede eliminar

**Fecha:** 2026-11-02

**Decisión:** `puntos.categoria_id` usa `ON DELETE RESTRICT`.

**Por qué:** las categorías definen el color de los puntos en el mapa. Si se pudieran borrar con puntos asociados, esos puntos quedarían sin categoría o se perderían por accidente.

## D-08. Despliegue

**Fecha:** 2026-11-02

**Decisión:** el desarrollo se hace en local con PostgreSQL en Docker. Para publicarlo se propone Neon (base de datos), Render (API) y Vercel o Netlify (frontend).

**Por qué:** los tres tienen plan gratuito y despliegan solos desde GitHub. Para que funcione hay que:
- Configurar las variables de entorno en cada servicio.
- Permitir en el CORS de la API la URL del frontend publicado.
- Activar SSL en la conexión a Neon.

**Estado:** pendiente. Se hace al final y solo cuenta como punto extra.

## D-09. bcryptjs en lugar de bcrypt

**Fecha:** 2026-11-02

**Decisión:** las contraseñas se cifran con `bcryptjs`, la implementación de bcrypt escrita en JavaScript.

**Por qué:** el paquete `bcrypt` incluye código nativo que a veces falla al instalar según el sistema o la versión de Node, y también al desplegar. `bcryptjs` produce el mismo formato de hash, así que un hash generado con uno lo verifica el otro. Es algo más lento, algo que aquí no importa.

**Alternativa descartada:** `bcrypt` nativo. Es más rápido, pero añade el riesgo de que el proyecto no instale en otra máquina.

## D-10. La autenticación consulta al usuario en cada petición

**Fecha:** 2026-11-02

**Decisión:** además de verificar la firma del token, el middleware `autenticar` busca al usuario en la base. El rol que se usa es el de la base de datos, no el que viaja dentro del token.

**Por qué:** un JWT es válido hasta que vence. Sin esta consulta, un usuario desactivado o eliminado seguiría entrando hasta 8 horas, y uno al que le quitan el rol de administrador conservaría sus permisos. Con la consulta, el cambio aplica en la siguiente petición.

**Costo:** una consulta por llave primaria en cada petición. Para este volumen es despreciable.

**Alternativa descartada:** confiar solo en el token. Es más rápido, pero deja esos huecos de seguridad.

## D-11. Mensajes del login que no revelan información

**Fecha:** 2026-11-02

**Decisión:**
- Correo inexistente y contraseña incorrecta dan el mismo mensaje y el mismo código (401).
- El aviso de cuenta inactiva solo aparece si la contraseña es correcta.
- Si el correo no existe, igualmente se compara la contraseña contra un hash de relleno.

**Por qué:** los mensajes distintos y las diferencias de tiempo permiten averiguar qué correos están registrados y cuáles cuentas están inactivas. El enunciado pide un mensaje para un usuario inactivo, y así se cumple sin filtrar datos a quien no conoce la contraseña.

## D-12. Puertos locales: API en 3001 y base en 5433

**Fecha:** 2026-11-02

**Decisión:** la API usa el puerto 3001 y el contenedor de PostgreSQL se publica en el 5433. Ambos se cambian en `.env`.

**Por qué:** en el entorno de desarrollo el 3000 ya lo usaba otra aplicación y el 5432 lo ocupaba un PostgreSQL instalado en Windows. En ese caso la API se conectaba al servidor equivocado y fallaba con un error de contraseña, difícil de diagnosticar. Dentro del contenedor la base sigue en el 5432; solo cambia el puerto publicado.

## D-13. Validación con zod y variables de entorno comprobadas al arrancar

**Fecha:** 2026-11-02

**Decisión:** los cuerpos de las peticiones y las variables de `.env` se validan con `zod`. Si falta o es inválida una variable, la API no arranca y dice cuál.

**Por qué:** un esquema declarativo evita repetir `if` a mano y deja los tipos de TypeScript inferidos de la misma definición, sin `any`. Fallar al arrancar es mejor que descubrir una llave del JWT vacía cuando alguien intenta entrar.
