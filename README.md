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
| [Frontend](docs/frontend.md) | Estructura de Angular, rutas, guards y flujo de la sesión |
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

Si tu base ya existía antes de la corrección de fechas con zona horaria, conviértela una sola vez con la migración (conserva los datos). Los pasos están en [Base de datos](docs/base-de-datos.md#bases-creadas-antes-del-cambio).

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

## Frontend

Requiere la API corriendo en el puerto 3001.

```bash
cd frontend
npm install
npm start
```

La aplicación queda en `http://localhost:4200`. Más detalle en [frontend](docs/frontend.md).

## Despliegue

| Pieza | Servicio | Carpeta |
|---|---|---|
| Base de datos | Neon (PostgreSQL) | `database/` |
| API | Render | `backend` |
| Frontend | Vercel | `frontend` |

La base se crea ejecutando `schema.sql` y luego `seed.sql`. La API se compila con `npm install --include=dev && npm run build` y arranca con `npm start`; su estado se comprueba en `/api/salud`.

Variables de la API en Render (los valores van en el panel del servicio, nunca en el repositorio): `NODE_VERSION`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`, `JWT_SECRET`, `JWT_EXPIRES_IN` y `CORS_ORIGIN` (la dirección del frontend, sin barra final).

El frontend no usa variables de entorno: la dirección de la API está en `frontend/src/environments/environment.ts` y se compila con él. `frontend/vercel.json` hace que las rutas como `/mapa` funcionen al recargar.

La API gratuita de Render se duerme tras 15 minutos sin tráfico; la primera petición después tarda cerca de un minuto.

## Flujo de trabajo

`main` solo recibe el pull request final. El trabajo se integra en `desarrollo` mediante ramas `feature/...`, cada una con su pull request. El detalle está en [decisiones](docs/decisiones.md).

## Estado

En desarrollo. Las instrucciones de instalación y los usuarios de prueba se agregan conforme avanza cada módulo.
