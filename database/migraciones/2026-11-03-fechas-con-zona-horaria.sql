-- Migración: las columnas de fecha pasan de TIMESTAMP a TIMESTAMPTZ (ver docs/decisiones.md, D-27)
--
-- Solo hace falta en bases creadas ANTES de este cambio. Una base nueva ya nace con el
-- esquema correcto, porque schema.sql se actualizó.
--
-- Las fechas guardadas hasta ahora eran la hora UTC del servidor sin indicar la zona, por eso
-- se interpretan como UTC al convertirlas. Es seguro ejecutarla una sola vez; una segunda vez
-- fallaría al intentar convertir una columna que ya es TIMESTAMPTZ.
--
-- Uso con el contenedor de Docker del proyecto:
--   docker exec -i geopuntos-db psql -U geopuntos -d geopuntos < database/migraciones/2026-11-03-fechas-con-zona-horaria.sql

BEGIN;

ALTER TABLE usuarios
    ALTER COLUMN creado_en      TYPE TIMESTAMPTZ USING creado_en      AT TIME ZONE 'UTC',
    ALTER COLUMN actualizado_en TYPE TIMESTAMPTZ USING actualizado_en AT TIME ZONE 'UTC';

ALTER TABLE puntos
    ALTER COLUMN creado_en      TYPE TIMESTAMPTZ USING creado_en      AT TIME ZONE 'UTC',
    ALTER COLUMN actualizado_en TYPE TIMESTAMPTZ USING actualizado_en AT TIME ZONE 'UTC';

COMMIT;
