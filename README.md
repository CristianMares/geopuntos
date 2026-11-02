# GeoPuntos

Sistema web para administrar usuarios y puntos geográficos con sus coordenadas, y mostrarlos en un mapa. Prueba técnica de ITSMARTS GEO.

## Estructura

| Carpeta | Contenido |
|---|---|
| `frontend/` | Aplicación Angular con OpenLayers |
| `backend/` | API REST con Node.js, Express y TypeScript |
| `database/` | Scripts de PostgreSQL (`schema.sql`, `seed.sql`) |
| `docs/` | Documentación del proyecto |

## Tecnologías

TypeScript, Angular, OpenLayers, Node.js con Express, PostgreSQL y Docker.

## Documentación

| Documento | Contenido |
|---|---|
| [Requerimientos](docs/requerimientos.md) | Alcance, módulos, requerimientos, roles y flujos |
| [Base de datos](docs/base-de-datos.md) | Diagrama entidad-relación, tablas, reglas e índices |
| [Datos semilla](docs/datos-semilla.md) | Usuarios, categorías y puntos de ejemplo |
| [API](docs/api.md) | Endpoints, códigos HTTP y ejemplos |
| [Decisiones](docs/decisiones.md) | Cambios respecto al enunciado y el motivo de cada uno |

## Base de datos

Requiere Docker Desktop abierto.

1. Copia la plantilla de variables y ajusta la contraseña:

   ```bash
   cp .env.example .env
   ```

2. Levanta PostgreSQL. La primera vez carga `schema.sql` y `seed.sql` solo:

   ```bash
   docker compose up -d
   ```

3. Para volver al estado inicial (borra los datos):

   ```bash
   docker compose down -v
   docker compose up -d
   ```

La base se publica en el puerto **5433** de tu máquina (dentro del contenedor sigue siendo el 5432). Así no choca con un PostgreSQL instalado localmente. Se cambia con `DB_PORT` en `.env`.

### Usuarios de prueba

| Correo | Contraseña | Rol |
|---|---|---|
| `admin@geopuntos.com` | `Admin12345` | Administrador |
| `usuario1@geopuntos.com` | `Usuario12345` | Usuario |
| `usuario2@geopuntos.com` | `Usuario12345` | Usuario |

## API

Requiere Node.js 22 o superior y la base de datos corriendo.

```bash
cd backend
npm install
npm run dev
```

La API queda en `http://localhost:3001/api`. Las variables salen del `.env` de la raíz del repositorio.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca la API y la reinicia al guardar cambios |
| `npm run typecheck` | Revisa los tipos sin generar archivos |
| `npm run build` | Compila a `dist/` |
| `npm start` | Ejecuta la versión compilada |

Para comprobar que responde:

```bash
curl http://localhost:3001/api/salud
```

```bash
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"correo":"admin@geopuntos.com","password":"Admin12345"}'
```

## Flujo de trabajo

`main` solo recibe el pull request final. El trabajo se integra en `desarrollo` mediante ramas `feature/...`, cada una con su pull request. El detalle está en [decisiones](docs/decisiones.md).

## Estado

En desarrollo. Las instrucciones de instalación y los usuarios de prueba se agregan conforme avanza cada módulo.
