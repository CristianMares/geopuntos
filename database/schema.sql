-- GeoPuntos: creación de tablas
-- Las decisiones de diseño están en docs/decisiones.md

CREATE TABLE usuarios (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    correo          VARCHAR(120) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    rol             VARCHAR(20)  NOT NULL CHECK (rol IN ('ADMIN', 'USUARIO')),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Correo único sin distinguir mayúsculas (D-04)
CREATE UNIQUE INDEX ux_usuarios_correo ON usuarios (LOWER(correo));

CREATE TABLE categorias (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(50) NOT NULL UNIQUE,
    color   VARCHAR(7)  NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE puntos (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100)  NOT NULL,
    descripcion     TEXT,
    latitud         NUMERIC(9, 6) NOT NULL CHECK (latitud BETWEEN -90 AND 90),
    longitud        NUMERIC(9, 6) NOT NULL CHECK (longitud BETWEEN -180 AND 180),
    categoria_id    INT           NOT NULL REFERENCES categorias (id) ON DELETE RESTRICT,
    usuario_id      INT           NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    creado_en       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índices de apoyo para filtros y JOIN (D-06)
CREATE INDEX ix_puntos_categoria ON puntos (categoria_id);
CREATE INDEX ix_puntos_usuario   ON puntos (usuario_id);
CREATE INDEX ix_puntos_nombre    ON puntos (LOWER(nombre));

-- Mantiene actualizado_en en cada edición (D-05)
CREATE FUNCTION set_actualizado_en() RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_usuarios_actualizado
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

CREATE TRIGGER tr_puntos_actualizado
    BEFORE UPDATE ON puntos
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();
