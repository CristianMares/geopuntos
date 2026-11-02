# Frontend

Aplicación Angular 21 con componentes standalone, signals y el control de flujo `@if` / `@for`. TypeScript en modo `strict`, sin `any`.

## Estructura

```
frontend/src/
├── environments/        apiUrl por ambiente (desarrollo y producción)
└── app/
    ├── models/          interfaces: Usuario, Punto, Categoria y los datos de login
    ├── services/        AuthService (sesión) y, más adelante, los servicios de datos
    ├── interceptors/    authInterceptor: agrega el token a cada petición
    ├── guards/          authGuard, sinSesionGuard y adminGuard
    ├── pages/           una carpeta por pantalla (login, mapa, ...)
    ├── components/      piezas reutilizables entre pantallas
    └── utils/           utilidades, como convertir errores de la API en texto
```

## Rutas y guards

| Ruta | Guard | Qué pasa |
|---|---|---|
| `/login` | `sinSesionGuard` | Si ya hay sesión, redirige a `/mapa` |
| `/mapa` | `authGuard` | Sin sesión, redirige a `/login` |
| `/` y cualquier ruta desconocida | | Van a `/mapa`; si no hay sesión, el guard las manda a `/login` |

Las pantallas se cargan de forma diferida (`loadComponent`), así que el código de cada una se descarga solo cuando se visita.

`adminGuard` queda listo para la ruta `/usuarios`: un usuario normal que la escriba es enviado a `/mapa`.

## Flujo de la sesión

```mermaid
sequenceDiagram
    actor U as Usuario
    participant L as Pantalla de login
    participant A as AuthService
    participant API as API

    U->>L: Correo y contraseña
    L->>A: login()
    A->>API: POST /api/auth/login
    alt Credenciales correctas
        API-->>A: token y datos del usuario
        A->>A: Guarda token y usuario (signals + localStorage)
        A-->>L: Navega a /mapa
    else Incorrectas o cuenta inactiva
        API-->>L: 401 con el mensaje
        L-->>U: Muestra el error en rojo
    end
```

## Qué pasa al abrir o recargar la app

```mermaid
flowchart TD
    A[Se abre la app] --> B{¿Hay token guardado?}
    B -- No --> L[/login/]
    B -- Sí --> C[GET /api/auth/perfil]
    C --> D{Respuesta}
    D -- "200" --> E[Actualiza usuario y rol<br/>y muestra la pantalla]
    D -- "401" --> F[El interceptor cierra la sesión]
    F --> L
    D -- "Sin conexión" --> G[Conserva la sesión]
```

El interceptor aplica a cada petición:
1. Agrega `Authorization: Bearer <token>` solo si la URL es de la API, nunca a terceros.
2. Si la API responde 401 (token vencido, usuario desactivado o eliminado) y no es el propio login, cierra la sesión y manda a `/login`.

## Pantalla de login

- Formulario reactivo con correo y contraseña. El correo debe ser válido y ambos son obligatorios.
- Los errores salen debajo de cada campo y el botón queda desactivado mientras haya errores.
- Botón para mostrar u ocultar la contraseña.
- Si la API rechaza las credenciales, o la cuenta está inactiva, se muestra el mensaje en rojo.
- Panel de marca a la izquierda con un mapa decorativo hecho solo con CSS. En pantallas estrechas se apila sobre el formulario.

## Cómo correrlo

```bash
cd frontend
npm install
npm start
```

Queda en `http://localhost:4200`. Necesita la API en el puerto 3001. Para cambiar la dirección de la API se edita `src/environments/environment.development.ts`.
