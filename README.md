# Backend API (Express + MongoDB)

API con registro/login (bcrypt + JWT), Google OAuth (Passport), cookies firmadas y roles `user` / `admin`.

## Requisitos

Node.js ≥ 16, npm y MongoDB en ejecución.

## Arranque

```bash
npm install
cp .env.example .env
npm run dev
```

Servidor por defecto: `http://localhost:3000`. Prefijo de API: `/api/v1`.

## Variables de entorno

Ver `.env.example`. Importante para Google OAuth:

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: credenciales de la app en Google Cloud (OAuth client).
- En la base de datos, el usuario guarda **`googleSubjectId`**: es el ID de cuenta de Google (`profile.id` / claim `sub`), **no** el client id del `.env`.

Configurá en Google la URL de callback, por ejemplo:  
`http://localhost:3000/api/v1/users/auth/google/callback`

## Scripts

| Comando | Uso |
|--------|-----|
| `npm run dev` / `npm start` | Servidor (`import 'dotenv/config'` solo en `src/app.js`) |
| `npm run create-admin` | Crea usuario admin de prueba (usa `--import=dotenv/config`) |

## Estructura principal

```
src/app.js              # entrada; carga dotenv aquí únicamente
src/config/passport.js  # Google OAuth
src/middlewares/auth.js # isAuthenticated, requireRole, isAdmin
src/routes/usersRoutes.js
src/routes/dashboardRoutes.js
scripts/createAdmin.js
```

## Endpoints útiles

| Método | Ruta | Notas |
|--------|------|--------|
| POST | `/api/v1/users/register` | |
| POST | `/api/v1/users/login` | JWT en body y cookie `currentUser` |
| POST | `/api/v1/users/logout` | Requiere auth |
| GET | `/api/v1/users/current` | Requiere auth |
| GET | `/api/v1/users` | Solo admin (`requireRole('admin')`) |
| GET | `/api/v1/users/auth/google` | Inicia OAuth |
| GET | `/api/v1/dashboard` | Requiere auth |

Colección Postman: `Backend-2-API.postman_collection.json`.

## Nomenclatura de commits (sugerida)

- `feat:` nueva funcionalidad (ej. `feat: agregar Google OAuth`)
- `fix:` corrección de errores
- `chore:` tareas auxiliares (ej. `chore: actualizar variables de entorno`)
- `docs:` solo documentación

## Flujo de trabajo con Git

Trabajar en ramas cortas (`feature/...`, `fix/...`) y fusionar a `main` con PR o merge cuando esté estable, como en un entorno real.

## Autor

Emanuel Montenegro — [Portfolio](https://emanuelmontenegro.dev) · [GitHub](https://github.com/emanuelmontenegro)

Licencia MIT.
