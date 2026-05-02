# 🚀 Backend API - Node.js, Express y MongoDB

Servidor backend con autenticación de usuarios, Google OAuth, JWT en cookies firmadas, sistema de roles y rutas protegidas. El proyecto está organizado en capas para facilitar la gestión de usuarios, permisos y autenticación.

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Cómo Ejecutar](#cómo-ejecutar)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Endpoints](#endpoints)
- [Sistema de Roles](#sistema-de-roles)
- [Script de admin](#script-de-admin)
- [Autenticación y Sesiones](#autenticación-y-sesiones)
- [Actualización del día](#actualización-del-día)
- [👨‍💻 Autor](#👨‍💻-autor)

---

## ✨ Características

✅ Autenticación con JWT y cookies firmadas
✅ Registro y login con bcrypt para contraseñas
✅ Google OAuth 2.0 con Passport
✅ Sistema de roles `user` / `admin`
✅ Ruta protegida `/dashboard`
✅ Endpoint admin para listar usuarios
✅ Script de creación de admin (`scripts/createAdmin.js`)
✅ Separación en controladores, rutas y middlewares

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Propósito |
|-----------|----------|
| Node.js | Runtime de JavaScript |
| Express | Framework web |
| MongoDB | Base de datos NoSQL |
| Mongoose | ODM para MongoDB |
| bcrypt | Hash de contraseñas |
| jsonwebtoken | JWT para autenticación |
| cookie-parser | Manejo de cookies firmadas |
| passport | Autenticación de terceros |
| passport-google-oauth20 | Google OAuth 2.0 |
| dotenv | Variables de entorno |

---

## 📦 Instalación

### Prerrequisitos
- Node.js v16 o superior
- npm o yarn
- MongoDB local o en la nube

### Pasos

1. Clona el repositorio
```bash
git clone https://github.com/tuusuario/nombre-repo.git
cd nombre-repo
```

2. Instala las dependencias
```bash
npm install
```

3. Configura las variables de entorno
```bash
cp .env.example .env
```

4. Inicia MongoDB
```bash
mongod
```

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con los siguientes valores:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/nombre_base_datos
JWT_SECRET=tu_jwt_secret
COOKIE_SECRET=tu_cookie_secret
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
```

---

## ▶️ Cómo Ejecutar

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

La aplicación se ejecuta en: **http://localhost:3000**

---

## 📁 Estructura del Proyecto

```
backend-2/
├── scripts/
│   └── createAdmin.js        # Script para crear usuario admin
├── src/
│   ├── app.js               # Entrada de la aplicación
│   ├── config/
│   │   ├── db.js            # Conexión a MongoDB
│   │   ├── passport.js      # Configuración de Google OAuth
│   │   └── sessionConfig.js # Configuración de sesiones (no usada en app actual)
│   ├── controllers/
│   │   └── usersController.js # Lógica de usuarios y auth
│   ├── middlewares/
│   │   └── auth.js          # Validación de JWT y permisos
│   ├── models/
│   │   └── User.js          # Modelo de usuario
│   └── routes/
│       ├── usersRoutes.js   # Rutas de auth, Google OAuth y usuarios
│       └── dashboardRoutes.js # Ruta protegida dashboard
├── .env.example             # Ejemplo de variables de entorno
├── .gitignore               # Archivos ignorados
├── package.json            # Dependencias y scripts
└── README.md               # Documentación
```

---

## 🔌 Endpoints

### Registro de usuario
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "juan_perez",
  "password": "micontraseña123"
}
```

**Respuesta 201**
```json
{
  "message": "Usuario creado con éxito",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "juan_perez",
    "email": "juan_perez@gmail.com",
    "role": "user"
  }
}
```

**Respuesta 400**
```json
{
  "message": "El usuario ya existe"
}
```

---

### Login de usuario
```http
POST /api/users/login
Content-Type: application/json

{
  "username": "juan_perez",
  "password": "micontraseña123"
}
```

**Respuesta 200**
```json
{
  "message": "Login exitoso",
  "token": "<jwt_token>"
}
```

El token se guarda en la cookie firmada `currentUser` y también se devuelve en el body.

---

### Logout
```http
POST /api/users/logout
```

**Respuesta 200**
```json
{
  "message": "Logout exitoso. Cookie eliminada."
}
```

---

### Usuario actual
```http
GET /api/users/current
Authorization: Bearer <jwt_token>
```

**Respuesta 200**
```json
{
  "message": "Usuario actual obtenido desde el token",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "juan_perez",
    "email": "juan_perez@gmail.com",
    "role": "user"
  }
}
```

---

### Listar usuarios (solo admin)
```http
GET /api/users
Authorization: Bearer <jwt_token>
```

**Respuesta 200**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "username": "juan_perez",
    "email": "juan_perez@gmail.com",
    "role": "user"
  }
]
```

---

### Google OAuth

#### Iniciar Google OAuth
```http
GET /api/users/auth/google
```

#### Callback de Google
```http
GET /api/users/auth/google/callback
```

Después del login con Google, se genera un JWT y se guarda en la cookie `currentUser`.

---

### Dashboard protegido
```http
GET /dashboard
Authorization: Bearer <jwt_token>
```

**Respuesta 200**
```text
Bienvenido juan_perez. Tu rol es user. Esta es tu dashboard.
```

---

## 🛡️ Sistema de Roles

- `user`: acceso a rutas básicas y dashboard protegido.
- `admin`: acceso a rutas administrativas como `GET /api/users`.
- La ruta `/api/users` está protegida con `isAuthenticated` + `isAdmin`.
- La ruta `/dashboard` está protegida con `isAuthenticated`.

---

## 🧑‍💼 Script de admin

Para crear un administrador ejecuta:

```bash
node scripts/createAdmin.js
```

El script crea un usuario con:
- `username`: `admin_general`
- `password`: `admin123`
- `role`: `admin`

---

## 🔐 Autenticación y Sesiones

- La app usa JWT y cookies firmadas en lugar de sesiones tradicionales.
- `isAuthenticated` valida el token JWT desde el header `Authorization` o desde la cookie `currentUser`.
- `isAdmin` permite solo usuarios con `role: admin`.
- El modelo `User` incluye `username`, `password`, `email`, `googleId` y `role`.
- Google OAuth usa Passport para crear o autenticar usuarios con Google.

---

## 📌 Actualización del día

Hoy se agregó y actualizó:
- Sistema de roles `user` / `admin`
- Script `scripts/createAdmin.js` para crear admin
- Middleware `isAuthenticated` para rutas protegidas
- Middleware `isAdmin` para rutas admin
- Endpoint `/api/users/current` para obtener el usuario autenticado
- Ruta admin `/api/users` para listar usuarios
- Ruta `/dashboard` protegida
- Google OAuth con Passport y JWT en cookie
- Autenticación de login/registro con bcrypt y JWT

---

## 👨‍💻 Autor

- Author: [Emanuel Montenegro](https://emanuelmontenegro.dev)
- Portfolio: [emanuelmontenegro.dev](https://emanuelmontenegro.dev)
- LinkedIn: [linkedin.com/in/emanuelmontenegro](https://www.linkedin.com/in/emanuelmontenegro)
- GitHub: [github.com/emanuelmontenegro](https://github.com/emanuelmontenegro)

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**.
EOF