-- Reinicia la base de datos: elimina lo que crea schema.sql y lo vuelve a crear con los datos de ejemplo.
--
-- ADVERTENCIA: borra TODOS los datos (usuarios, categorías y puntos).
--
-- Se ejecuta con psql desde la RAÍZ del repositorio, porque los \i usan rutas relativas:
--   psql "CADENA_DE_CONEXION" -f database/reiniciar.sql
--
-- Para la base local en Docker es más simple recrear el contenedor:
--   docker compose down -v && docker compose up -d

\set ON_ERROR_STOP on

DROP TABLE IF EXISTS puntos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP FUNCTION IF EXISTS set_actualizado_en() CASCADE;

\i database/schema.sql
\i database/seed.sql
