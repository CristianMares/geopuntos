-- GeoPuntos: datos de ejemplo
-- Contraseñas de prueba (cifradas con bcrypt):
--   admin@geopuntos.com     -> Admin12345
--   usuario1@geopuntos.com  -> Usuario12345
--   usuario2@geopuntos.com  -> Usuario12345

INSERT INTO usuarios (nombre, correo, password_hash, rol, activo) VALUES
    ('Ana López',    'admin@geopuntos.com',    '$2a$10$BuSzzdskIlj2vDmOBZuLyulK.oHPEEakY5MQN1.VT859DWN5TGGHO', 'ADMIN',   TRUE),
    ('Carlos Ruiz',  'usuario1@geopuntos.com', '$2a$10$iJXI27RceFTNf2S/f5CUEeFB6MapE9bxoTSW3TXKAPORLtZxCfVXG', 'USUARIO', TRUE),
    ('María Torres', 'usuario2@geopuntos.com', '$2a$10$iJXI27RceFTNf2S/f5CUEeFB6MapE9bxoTSW3TXKAPORLtZxCfVXG', 'USUARIO', TRUE);

INSERT INTO categorias (nombre, color) VALUES
    ('Oficina',           '#1565A6'),
    ('Almacén',           '#17845A'),
    ('Cliente',           '#0B3954'),
    ('Punto de interés',  '#D97706');

-- categoria_id: 1 Oficina, 2 Almacén, 3 Cliente, 4 Punto de interés
-- usuario_id:   1 Ana, 2 Carlos, 3 María
INSERT INTO puntos (nombre, descripcion, latitud, longitud, categoria_id, usuario_id) VALUES
    ('Oficina Centro',          'Oficina principal en el centro de la ciudad',  19.432608, -99.133209, 1, 1),
    ('Oficina Polanco',         'Sucursal de atención a corporativos',          19.433833, -99.195330, 1, 1),
    ('Almacén Norte',           'Bodega de distribución zona norte',            19.512400, -99.140100, 2, 2),
    ('Almacén Iztapalapa',      'Centro de acopio y despacho',                  19.355000, -99.062000, 2, 2),
    ('Cliente Reforma',         'Cliente corporativo sobre Paseo de la Reforma', 19.427000, -99.167700, 3, 3),
    ('Cliente Coyoacán',        'Cliente con servicio mensual',                 19.349800, -99.161700, 3, 3),
    ('Ángel de la Independencia', 'Monumento y punto de referencia',            19.427025, -99.167665, 4, 1),
    ('Bosque de Chapultepec',   'Parque y punto de reunión para eventos',       19.420400, -99.181800, 4, 3);
