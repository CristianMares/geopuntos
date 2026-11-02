# Datos semilla

El archivo `database/seed.sql` carga los datos de ejemplo con los que se puede probar el sistema desde el primer arranque. Se ejecuta justo después de `schema.sql`, la primera vez que se crea la base.

## Resumen

| Tabla | Registros |
|---|---|
| usuarios | 3 (1 administrador y 2 usuarios) |
| categorias | 4 |
| puntos | 8 |

## Usuarios

| id | Nombre | Correo | Contraseña | Rol | Activo |
|---|---|---|---|---|:---:|
| 1 | Ana López | `admin@geopuntos.com` | `Admin12345` | ADMIN | Sí |
| 2 | Carlos Ruiz | `usuario1@geopuntos.com` | `Usuario12345` | USUARIO | Sí |
| 3 | María Torres | `usuario2@geopuntos.com` | `Usuario12345` | USUARIO | Sí |

Estas contraseñas son solo para pruebas. En la base se guardan cifradas con bcrypt (costo 10), nunca en texto plano. Por eso el mismo texto genera hashes distintos: bcrypt agrega una sal aleatoria a cada uno.

Para probar el caso de un usuario inactivo, un administrador puede desactivar a cualquiera de los dos usuarios desde el módulo Usuarios.

## Categorías

| id | Nombre | Color |
|---|---|---|
| 1 | Oficina | `#1565A6` |
| 2 | Almacén | `#17845A` |
| 3 | Cliente | `#0B3954` |
| 4 | Punto de interés | `#D97706` |

Los colores son los de la paleta del enunciado y son los que usa el mapa para pintar cada punto y su leyenda.

## Puntos

Todos están en la Ciudad de México, para que se vean juntos al abrir el mapa.

| id | Nombre | Categoría | Latitud | Longitud | Registrado por |
|---|---|---|---|---|---|
| 1 | Oficina Centro | Oficina | 19.432608 | -99.133209 | Ana López |
| 2 | Oficina Polanco | Oficina | 19.433833 | -99.195330 | Ana López |
| 3 | Almacén Norte | Almacén | 19.512400 | -99.140100 | Carlos Ruiz |
| 4 | Almacén Iztapalapa | Almacén | 19.355000 | -99.062000 | Carlos Ruiz |
| 5 | Cliente Reforma | Cliente | 19.427000 | -99.167700 | María Torres |
| 6 | Cliente Coyoacán | Cliente | 19.349800 | -99.161700 | María Torres |
| 7 | Ángel de la Independencia | Punto de interés | 19.427025 | -99.167665 | Ana López |
| 8 | Bosque de Chapultepec | Punto de interés | 19.420400 | -99.181800 | María Torres |

### Por qué estos datos

- **Dos puntos por categoría:** así el filtro por categoría y la leyenda del mapa se pueden probar con todos los colores.
- **Tres usuarios dueños de puntos:** la columna "quién lo registró" muestra valores distintos y se puede comprobar el borrado en cascada. Si se elimina a María Torres, desaparecen los puntos 5, 6 y 8.
- **Coordenadas reales y cercanas:** todos caben en una vista inicial del mapa, centrada en el Centro de la ciudad.

## Cómo cargar o reiniciar los datos

Los scripts solo se ejecutan cuando el volumen de la base está vacío, es decir, la primera vez. Para volver al estado inicial hay que borrar el volumen:

```bash
docker compose down -v
docker compose up -d
```

`down -v` detiene el contenedor y elimina el volumen con todos los datos. Con `up -d` se crea de nuevo y se vuelven a cargar `schema.sql` y `seed.sql`. Se pierde cualquier cambio hecho desde la aplicación.

## Cómo comprobar que cargaron

```bash
docker exec geopuntos-db psql -U geopuntos -d geopuntos -c "SELECT COUNT(*) FROM puntos"
```

Debe devolver 8. Para ver el listado completo con su categoría y quién lo registró, se puede usar la consulta con `JOIN` de [base-de-datos.md](base-de-datos.md).

## Verificaciones realizadas

Al probar los scripts en un contenedor nuevo se confirmó que:

- Las tres tablas se crean y los tres `INSERT` cargan 3, 4 y 8 registros.
- Una latitud fuera de rango, un rol inválido y un color mal escrito son rechazados por la base.
- Un correo repetido con otras mayúsculas (`ADMIN@GEOPUNTOS.COM`) es rechazado.
- Una categoría con puntos no se puede eliminar.
- Al eliminar un usuario se eliminan sus puntos.
- `actualizado_en` cambia solo al editar un registro.
