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
| [API](docs/api.md) | Endpoints, códigos HTTP y ejemplos |
| [Decisiones](docs/decisiones.md) | Cambios respecto al enunciado y el motivo de cada uno |

## Flujo de trabajo

`main` solo recibe el pull request final. El trabajo se integra en `desarrollo` mediante ramas `feature/...`, cada una con su pull request. El detalle está en [decisiones](docs/decisiones.md).

## Estado

En desarrollo. Las instrucciones de instalación y los usuarios de prueba se agregan conforme avanza cada módulo.
