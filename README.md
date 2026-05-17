# Backend — Autenticación híbrida (JWT + sesión + OAuth)

API con registro, **Passport Local**, **Google OAuth**, **express-session** + **connect-mongo**, JWT en cookie `authToken` y rutas protegidas por rol.

## Requisitos

Node.js ≥ 18, MongoDB (Atlas o local).

## Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

En Google Cloud, callback autorizado: `http://localhost:3000/api/v1/auth/google/callback`

## Endpoints (consigna proyecto final)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Registro (bcrypt) |
| POST | `/api/v1/auth/login` | Login Passport Local → JWT + sesión |
| POST | `/api/v1/auth/logout` | Destruye sesión y borra cookie `authToken` |
| GET | `/api/v1/auth/google` | Inicia OAuth Google |
| GET | `/api/v1/auth/google/callback` | Callback OAuth |
| GET | `/api/v1/session` | Estado de sesión en servidor |
| GET | `/api/v1/profile` | Perfil (JWT) |
| GET | `/api/v1/admin` | Solo rol `admin` |

## Estructura

```
src/
  app.js
  config/       db, passport, session
  strategies/   localStrategy, googleStrategy
  models/
  controllers/  authController, profileController
  middlewares/  auth.js
  routes/
  utils/        authToken.js
scripts/createAdmin.js
```

## Commits sugeridos

`feat: agregar passport local y rutas auth` · `feat: sesiones con connect-mongo` · `chore: actualizar env example`

## Autor

Emanuel Montenegro — MIT
