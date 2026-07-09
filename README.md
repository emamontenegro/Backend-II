# Backend III — Sistema de autenticación híbrido

API REST en Node.js con **Passport Local**, **Google OAuth 2.0**, **JWT**, **cookies httpOnly**, **sesiones en MongoDB** (`express-session` + `connect-mongo`), **secretos gestionados con HashiCorp Vault** y **observabilidad** con Pino + Prometheus. Organizada por capas para el proyecto final de Backend.

---

## Presentación del proyecto

| Aspecto | Descripción |
|---------|-------------|
| **Objetivo** | Autenticación híbrida: credenciales locales + OAuth Google, con estado de sesión en servidor, API protegida por JWT y roles, y observabilidad con logs estructurados y métricas Prometheus. |
| **Stack** | Express 5, Mongoose, Passport, bcrypt, jsonwebtoken, express-session, connect-mongo, node-vault, pino, prom-client, compression |
| **Base de datos** | MongoDB (Atlas o local). Colecciones: `users`, `sessions` |
| **Secretos** | HashiCorp Vault (`secret/data/backend`) con fallback a `.env` |
| **Roles** | `user` (default), `admin` |
| **Prefijo API** | `/api/v1` |

### Estrategias implementadas

1. **Registro/login local** — `passport-local` + hash bcrypt + JWT `{ userId, role }`.
2. **Registro/login Google** — `passport-google-oauth20` con rutas separadas (`/google/register` y `/google/login`).
3. **Sesión servidor** — cookie `sid` + documento en MongoDB vía `connect-mongo`.
4. **Autorización** — middleware JWT (`Authorization` o cookie `authToken`) + `requireRole('admin')`.

---

## Estructura del proyecto

```
backend-2/
├── scripts/
│   └── createAdmin.js          # Crea/actualiza usuario admin de prueba
├── src/
│   ├── app.js                  # Entry: dotenv → Vault → import dinámico de server.js
│   ├── server.js               # http nativo + Express (mismo PORT)
│   ├── config/
│   │   ├── logger.js           # Pino: dev (pino-pretty) vs prod (JSON estructurado)
│   │   ├── metrics.js          # prom-client: métricas default + histograma HTTP
│   │   ├── vault.js            # node-vault: inyecta secretos en process.env
│   │   ├── db.js               # Conexión Mongoose
│   │   ├── passport.js         # Registro de estrategias + serialize/deserialize
│   │   ├── sessionConfig.js    # express-session + MongoStore
│   │   ├── googleOAuth.js      # Lectura/validación vars Google OAuth
│   │   └── processConfig.js    # GET/POST /config (process.env.CONFIG_LEVEL)
│   ├── strategies/
│   │   ├── localStrategy.js    # Passport Local (username/password)
│   │   └── googleStrategy.js   # Passport Google (register vs login)
│   ├── models/
│   │   └── User.js             # Usuario: password, googleSubjectId, role
│   ├── controllers/
│   │   ├── authController.js   # register, login response, logout, session
│   │   └── profileController.js # profile, admin panel
│   ├── middlewares/
│   │   └── auth.js             # isAuthenticated, requireRole (401/403)
│   ├── routes/
│   │   ├── index.js            # Agrupa /auth y rutas protegidas
│   │   ├── authRoutes.js       # auth, OAuth, callback
│   │   └── protectedRoutes.js  # /session, /profile, /admin
│   └── utils/
│       └── authToken.js        # JWT, cookie authToken, expiración
├── logs/                       # Generada en prod: error.log + combined.log (gitignored)
├── .env.example                # Solo bootstrap: PORT, NODE_ENV, VAULT_URL, VAULT_TOKEN
├── Dockerfile                  # node:20-alpine
├── Backend-2-API.postman_collection.json
├── package.json
└── README.md
```

### Escalabilidad — Cluster nativo

El punto de entrada usa el módulo `cluster` de Node.js para aprovechar todos los núcleos del procesador:

```
npm run dev
  ↓
app.js (Primary PID 1234)
  ├── dotenv + Vault  → process.env con todos los secretos
  ├── os.cpus().length = N
  ├── fork() × N workers → cada uno hereda process.env del primary
  └── cluster.on('exit') → levanta reemplazo automático si un worker muere

Worker 1 (PID 1235) → Express + MongoDB + puerto 3000 compartido
Worker 2 (PID 1236) → Express + MongoDB + puerto 3000 compartido
Worker N (PID 123N) → Express + MongoDB + puerto 3000 compartido
```

El SO distribuye los requests entrantes entre los workers de forma automática. Si un worker muere por un error, el Primary lo detecta y lanza uno nuevo sin interrumpir el servicio.

### Orden de arranque (Vault primero)

```
node src/app.js
  PRIMARY:
    1. dotenv    → carga .env (PORT, NODE_ENV, VAULT_URL, VAULT_TOKEN)
    2. vault.js  → inyecta secretos en process.env
    3. fork() × N workers (heredan process.env completo)
    4. escucha evento 'exit' → reemplaza workers caídos

  WORKER (× N):
    1. import('./server.js') → Express + Mongoose + Passport
       (process.env ya tiene todos los secretos del primary)
```

El `import()` dinámico en workers es clave: los módulos como `sessionConfig.js` leen `process.env` al cargarse, y en ese momento ya está todo inyectado por el primary.

### Capas

| Capa | Responsabilidad |
|------|-----------------|
| **config** | Vault, logger, variables de entorno, DB, sesión, registro Passport |
| **strategies** | Lógica de verificación OAuth/Local (sin HTTP) |
| **models** | Esquema y persistencia de usuarios |
| **controllers** | Reglas de negocio y respuestas JSON |
| **middlewares** | JWT, roles, códigos 401 / 403 |
| **routes** | Endpoints y enlace con Passport |
| **utils** | Firma JWT y opciones de cookies |

---

## Flujo de autenticación (resumen)

```mermaid
sequenceDiagram
  participant C as Cliente
  participant API as Express
  participant P as Passport
  participant G as Google
  participant DB as MongoDB

  Note over C,DB: Login local
  C->>API: POST /auth/login
  API->>P: LocalStrategy
  P->>DB: buscar user + bcrypt
  API->>DB: guardar sesión (sid)
  API->>C: JWT + cookie authToken

  Note over C,DB: Login Google
  C->>API: GET /auth/google/login
  API->>G: redirect OAuth
  G->>API: GET /auth/google/callback?code=
  API->>P: GoogleStrategy
  API->>C: JWT + cookie authToken

  Note over C,DB: Ruta protegida
  C->>API: GET /profile + Bearer JWT
  API->>C: 200 perfil

  Note over C,DB: Logout
  C->>API: POST /auth/logout + Bearer
  API->>DB: destroy session
  API->>C: clear cookie
```

---

## Instalación

### Requisitos

- Node.js ≥ 18
- Docker Desktop (para Vault local)
- MongoDB Atlas con IP permitida
- Cuenta Google Cloud (OAuth cliente tipo **Aplicación web**)

### Flujo de arranque (3 pasos)

```
docker compose up -d   →   npm run seed:vault   →   npm run dev
```

#### Paso 0 — Clonar e instalar

```bash
git clone <tu-repo>
cd backend-2
npm install
cp .env.example .env
# .env solo necesita: PORT=3000, NODE_ENV=development,
# VAULT_URL=http://127.0.0.1:8200, VAULT_TOKEN=<tu-vault-token>
```

#### Paso 1 — Levantar Vault con Docker Compose

```bash
docker compose up -d
```

Esto levanta HashiCorp Vault en `http://localhost:8200` con el token definido en `VAULT_TOKEN` de tu `.env`.
Verificar que esté corriendo: `docker compose ps`

> **Nota:** Vault en modo `-dev` guarda los secretos en **memoria**. El volumen está mapeado pero no persiste entre reinicios. Repetir el Paso 2 cada vez que se reinicia el contenedor.

#### Paso 2 — Inyectar secretos (seed)

```bash
npm run seed:vault
```

Este script se conecta a Vault y carga todas las variables en `secret/data/backend` de un solo golpe. Output esperado:

```
🔧 Conectando a Vault en http://127.0.0.1:8200 ...
✅ 11 secretos inyectados en secret/data/backend
```

#### Paso 3 — Arrancar la API

```bash
npm run dev
```

Logs esperados en orden (formato pino-pretty en desarrollo):

```
[14:30:01] INFO: Vault: 11 secretos inyectados desde secret/data/backend
[14:30:01] INFO: MongoDB conectado
[14:30:01] INFO: Servidor corriendo en el puerto 3000
[14:30:01] INFO: Métricas:  GET http://localhost:3000/metrics
[14:30:01] INFO: Config:    GET/POST http://localhost:3000/config
[14:30:01] INFO: Auth API:  http://localhost:3000/api/v1
[14:30:01] INFO: Google OAuth activo — callback: http://localhost:3000/api/v1/auth/google/callback
```

### Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia la API (dotenv → Vault → server). Logs en consola con colores. |
| `npm start` | Igual que dev |
| `npm run seed:vault` | Inyecta todos los secretos en Vault (correr después de compose up) |
| `npm run create-admin` | Usuario `admin_general` / `admin123` (carga Vault antes de conectar) |

---

## Docker

Imagen basada en `node:20-alpine`. El servidor usa **`http` nativo** + Express en el mismo puerto (`process.env.PORT`, default **8080** en contenedor).

### Build

```bash
docker build -t backend-2 .
```

### Run — solo `/config` (sin MongoDB)

```bash
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e CONFIG_LEVEL=high \
  backend-2
```

Probar:

```bash
curl http://localhost:8080/config
curl -X POST http://localhost:8080/config -H "Content-Type: application/json" -d "{\"level\":\"low\"}"
curl http://localhost:8080/config
```

### Run — API completa (auth + MongoDB Atlas)

```bash
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e CONFIG_LEVEL=high \
  -e MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/backend-ii" \
  -e JWT_SECRET="tu_secreto" \
  -e SESSION_SECRET="tu_sesion" \
  -e GOOGLE_CLIENT_ID="..." \
  -e GOOGLE_CLIENT_SECRET="..." \
  -e GOOGLE_CALLBACK_URL="http://localhost:8080/api/v1/auth/google/callback" \
  backend-2
```

> **Nota:** No se copia `.env` a la imagen (`.dockerignore`). Pasá secretos con `-e` o `--env-file .env` en desarrollo. Si no definís `VAULT_URL`/`VAULT_TOKEN` en el contenedor, la app saltea Vault y usa directamente esas variables (fallback).

---

## Variables de entorno

### En `.env` (bootstrap local — lo único que va en el archivo)

| Variable | Uso |
|----------|-----|
| `PORT` | Puerto (`8080` default sin .env; en local usá `3000`) |
| `NODE_ENV` | `development` \| `production` (afecta cookie `secure`) |
| `VAULT_URL` | Endpoint de Vault (ej. `http://localhost:8200`) |
| `VAULT_TOKEN` | Token de acceso a Vault |

### En Vault (`secret/data/backend`)

| Variable | Uso |
|----------|-----|
| `MONGO_URI` | Conexión MongoDB |
| `JWT_SECRET` | Firma del JWT |
| `JWT_EXPIRES_IN` | Ej. `1h` (consigna) o `24h` (pruebas locales) |
| `SESSION_SECRET` | Firma de sesión Express |
| `SESSION_TIMEOUT` | `maxAge` sesión y cookie JWT (ms) |
| `BCRYPT_ROUNDS` | Rondas bcrypt en registro |
| `GOOGLE_CLIENT_ID` | Cliente OAuth Web |
| `GOOGLE_CLIENT_SECRET` | Secreto del cliente |
| `GOOGLE_CALLBACK_URL` | Debe coincidir **exacto** con Google Cloud |
| `CONFIG_LEVEL` | Valor inicial para `GET /config` (`high`, `low` u otro) |
| `CLIENT_URL` | Origen CORS del frontend (opcional) |

> Sin Vault, estas variables pueden ir igual en el `.env` o pasarse con `-e` en Docker: la app las consume de `process.env` de la misma forma.

### Google Cloud

1. Pantalla de consentimiento → **Externo** → usuario de prueba (tu Gmail).
2. Credenciales → **OAuth 2.0 — Aplicación web**.
3. Origen JS: `http://localhost:3000`
4. Redirect URI: `http://localhost:3000/api/v1/auth/google/callback`

Diagnóstico: `GET /api/v1/auth/google/check` y `GET /api/v1/auth/google/debug-auth`

---

## Endpoints

### Config (process.env — módulo `http` nativo)

Mismo puerto que la API (`PORT`, default 3000). Emula comandos stdin `get` / `set`.

#### `GET /config`

- `Accept: text/plain` → mensaje según `CONFIG_LEVEL` (`high` / `low` / default).
- `Accept: application/json` → `{ "message", "level" }`.

#### `POST /config`

```json
{ "level": "low" }
```

Mutación en runtime: `process.env.CONFIG_LEVEL = level`. El siguiente GET refleja el cambio sin reiniciar.

```bash
curl http://localhost:3000/config
curl -X POST http://localhost:3000/config -H "Content-Type: application/json" -d "{\"level\":\"low\"}"
```

### Auth local

#### `POST /api/v1/auth/register`

```json
// Request
{ "username": "juan", "password": "clave123", "email": "juan@mail.com" }

// Response 201
{
  "message": "Usuario creado con éxito",
  "user": { "userId": "...", "username": "juan", "email": "...", "role": "user" }
}
```

#### `POST /api/v1/auth/login` (Passport Local)

```json
// Request
{ "username": "admin_general", "password": "admin123" }

// Response 200
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2026-05-19T12:00:00.000Z",
  "user": { "userId": "...", "username": "...", "role": "admin" }
}
```

Cookie: `authToken` (httpOnly, sameSite: lax, secure solo en producción).

### Google OAuth

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/api/v1/auth/google/register` | Primera vez — crea usuario |
| GET | `/api/v1/auth/google/login` | Si ya existe cuenta Google |
| GET | `/api/v1/auth/google/callback` | Callback (automático) |

Probar en **navegador**. Copiar el campo **`token`** del JSON (empieza con `eyJ...`), no el `code` de la URL.

### Sesión

#### `GET /api/v1/session`

Requiere sesión Passport activa (cookie `sid` tras login). Ejemplo:

```json
{
  "message": "Sesión activa",
  "session": { "sessionId": "...", "maxAge": 3600000 },
  "user": { "userId": "...", "username": "...", "role": "user" }
}
```

### Rutas protegidas (JWT)

Enviar header: `Authorization: Bearer <token>` o cookie `authToken`.

| Método | Ruta | Auth | Respuesta error |
|--------|------|------|-----------------|
| GET | `/api/v1/profile` | JWT | 401 sin token |
| GET | `/api/v1/admin` | JWT + rol `admin` | 403 si no es admin |

### Logout

#### `POST /api/v1/auth/logout`

- Header: `Authorization: Bearer <token>` (token **recién** obtenido del login).
- Destruye sesión en MongoDB y borra cookies `authToken` y `sid`.

```json
{ "message": "Logout exitoso. Sesión destruida y cookie eliminada." }
```

---

## Seguridad (resumen para documento final)

| Tema | Decisión |
|------|----------|
| **Secretos** | Centralizados en Vault (`secret/data/backend`); el `.env` solo tiene el bootstrap (`VAULT_URL`/`VAULT_TOKEN`) y no viaja al repo ni a la imagen Docker. |
| **Logging** | Pino con dos modos: `development` → pino-pretty (colores, timestamps legibles); `production` → JSON estructurado (compatible con Datadog, Loki, CloudWatch). Cada request HTTP se loguea con método, ruta, status y tiempo. |
| **Métricas** | prom-client expone métricas default de Node.js (CPU, memoria, event loop) + histograma y contador de requests HTTP en `GET /metrics` (formato Prometheus/OpenMetrics). |
| **Compresión** | Middleware `compression` (gzip/brotli) en todas las respuestas Express. |
| **Rol en JWT** | `{ userId, role }` firmado con `JWT_SECRET`. El rol no se confía desde el body del cliente. |
| **Registro público** | No acepta `role: admin` en el body; admin vía script o MongoDB. |
| **CSRF** | Cookies `httpOnly` + `sameSite: lax`; API stateless con Bearer en Postman. En producción: `secure: true`, CORS restringido a `CLIENT_URL`. |
| **Local vs producción** | `NODE_ENV=production` activa cookies `secure`. |
| **Cookie + JWT** | Híbrido: sesión para `GET /session`; JWT para `/profile` y `/admin`. |
| **Rol cambiado** | El JWT sigue con el rol viejo hasta expirar; hay que volver a loguearse. |

---

## Pruebas con Postman

Importar `Backend-2-API.postman_collection.json`. Carpetas: **Health**, **Auth**, **Google OAuth**, **Session & Protected**, **Config**.

Orden sugerido:

1. **Login Admin** → guarda `{{token}}` automáticamente (crear antes con `npm run create-admin`).
2. **GET Profile (JWT)** → 200.
3. **GET Admin (rol admin)** → 200.
4. **Login User** + **GET Admin** → 403 (evidencia de "No autorizado").
5. **GET Profile** sin token → 401 (evidencia de "No autenticado").
6. **GET Session** → con cookies activas tras login; 401 sin sesión.
7. **Logout** → 200 con el Bearer vigente.
8. **Google**: abrir `/google/register` o `/google/login` en el **navegador**, copiar el campo `token` del JSON (no el `code` de la URL) y usarlo como Bearer.
9. **Config**: GET → POST `{ "level": "low" }` → GET (refleja el cambio sin reiniciar).

---

## Observabilidad

### Logs (Pino)

El logger está en `src/config/logger.js` y se importa en todos los módulos del servidor.

| Entorno | Formato | Cómo se ve |
|---------|---------|------------|
| `development` | pino-pretty | `[14:30:01] INFO: MongoDB conectado` |
| `production` | JSON | `{"level":30,"time":1234567890,"msg":"MongoDB conectado"}` |

Niveles usados: `info` (arranque, requests 2xx/3xx), `warn` (requests 4xx, config faltante), `error` (requests 5xx, errores de DB/Vault).

### Métricas (prom-client + Prometheus + Grafana)

Endpoint: **`GET http://localhost:3000/metrics`**

Devuelve métricas en formato texto de Prometheus. Incluye:

- **Métricas default de Node.js**: CPU, memoria heap, event loop lag, GC, handles activos.
- **`http_request_duration_seconds`**: histograma de duración por `method`, `route` y `status_code`.
- **`http_requests_total`**: contador total de requests recibidos.

Para verlas en la terminal:

```bash
curl http://localhost:3000/metrics
```

#### Stack de observabilidad completo (opcional)

Con `docker compose up -d` también levantan **Prometheus** y **Grafana**:

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| Prometheus | `http://localhost:9090` | — |
| Grafana | `http://localhost:3001` | admin / `GF_ADMIN_PASSWORD` de tu `.env` |

Prometheus scrapeará `GET /metrics` cada 5 segundos automáticamente (`prometheus.yml`).

> **WSL2:** el target en `prometheus.yml` debe apuntar a la IP de la interfaz `eth0` de WSL2 (no `localhost` ni el gateway de Windows). Obtenerla con `hostname -I | awk '{print $1}'` y actualizar el archivo si cambia al reiniciar.

**Configurar Grafana (primera vez):**
1. Ir a `http://localhost:3001` → login con `admin` / el valor de `GF_ADMIN_PASSWORD` de tu `.env`
2. El Data Source de Prometheus ya está aprovisionado automáticamente (`grafana/provisioning/datasources/datasource.yml`) — no hace falta configurarlo a mano.
3. **Dashboards → New → Import** → pegar ID `1860` (Node.js dashboard comunitario) → Load → seleccionar **Prometheus** como fuente → **Import**

---

## Nomenclatura de commits

- `feat:` nueva funcionalidad (ej. `feat: agregar Google OAuth`)
- `fix:` corrección de bugs
- `chore:` configuración (ej. `chore: actualizar .env.example`)
- `docs:` documentación

Flujo Git sugerido: ramas `feature/...` → merge a `main`.

---

## Autor

Emanuel Montenegro — 
[GitHub](https://github.com/emamontenegro)
[LinkedIn](www.linkedin.com/in/emanuel-montenegro-dev)
[Portfolio](https://emanuelmontenegro.dev)

Licencia MIT.
