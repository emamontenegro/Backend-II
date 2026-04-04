# 🚀 Backend API - Node.js & Express

Una aplicación backend robusta y segura desarrollada con Node.js, Express y MongoDB. Implementa autenticación de usuarios con sesiones seguras, manejo de contraseñas encriptadas y una arquitectura modular lista para producción.

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Cómo Ejecutar](#cómo-ejecutar)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Endpoints](#endpoints)
- [Autenticación y Sesiones](#autenticación-y-sesiones)
- [Mejoras Futuras](#mejoras-futuras)

---

## ✨ Características

✅ **Autenticación segura** - Sistema de login/registro con sesiones  
✅ **Cifrado de contraseñas** - Implementado con bcrypt  
✅ **Base de datos NoSQL** - MongoDB con Mongoose ODM  
✅ **Manejo de sesiones** - express-session con persistencia  
✅ **Gestión de cookies** - cookie-parser para cookies seguras  
✅ **Variables de entorno** - Configuración segura con dotenv  
✅ **Estructura modular** - Separación de responsabilidades (MVC)  
✅ **Rutas protegidas** - Middlewares de autenticación  

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **Node.js** | 16+ | Runtime de JavaScript |
| **Express** | ^4.18.0 | Framework web |
| **MongoDB** | 5+ | Base de datos |
| **Mongoose** | ^7.0.0 | ODM para MongoDB |
| **bcrypt** | ^5.0.0 | Hashing de contraseñas |
| **express-session** | ^1.17.0 | Gestión de sesiones |
| **cookie-parser** | ^1.4.6 | Manejo de cookies |
| **dotenv** | ^16.0.0 | Variables de entorno |

---

## 📦 Instalación

### Prerrequisitos
- **Node.js** v16 o superior
- **npm** o **yarn**
- **MongoDB** corriendo localmente o en la nube (MongoDB Atlas)

### Pasos

1. **Clona el repositorio**
```bash
git clone https://github.com/tuusuario/nombre-repo.git
cd nombre-repo
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**
```bash
# Copia el archivo ejemplo
cp .env.example .env

# Edita el archivo .env con tus valores
nano .env
```

4. **Verifica la conexión a MongoDB**
```bash
# Asegúrate de que MongoDB está corriendo
mongod
```

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura:

```env
# ========== SERVIDOR ==========
PORT=3000
NODE_ENV=development

# ========== BASE DE DATOS ==========
MONGODB_URI=mongodb://localhost:27017/nombre_base_datos
# O para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/nombre_db

# ========== SESIONES ==========
SESSION_SECRET=tu_clave_secreta_muy_segura_aqui
SESSION_TIMEOUT=3600000

# ========== SEGURIDAD ==========
BCRYPT_ROUNDS=10
```

**Nota:** Mantén el `.env` en `.gitignore` para proteger tus credenciales.

---

## ▶️ Cómo Ejecutar

### Modo Desarrollo
```bash
npm run dev
```
*(Requiere nodemon instalado)*

### Modo Producción
```bash
npm start
```

### Con nodemon (desarrollo automático)
```bash
npm install --save-dev nodemon
npx nodemon src/app.js
```

La aplicación estará disponible en: **http://localhost:3000**

---

## 📁 Estructura del Proyecto

```
backend-2/
├── src/
│   ├── app.js                 # Archivo principal de Express
│   ├── config/
│   │   ├── db.js             # Conexión a MongoDB
│   │   └── sessionConfig.js   # Configuración de sesiones
│   ├── controllers/
│   │   └── usersController.js # Lógica de usuarios
│   ├── middlewares/
│   │   └── auth.js           # Middleware de autenticación
│   ├── models/
│   │   └── User.js           # Modelo de usuario (Mongoose)
│   └── routes/
│       ├── usersRoutes.js    # Rutas de autenticación
│       └── dashboardRoutes.js # Rutas protegidas
├── .env.example              # Plantilla de variables
├── .gitignore               # Archivos ignorados por Git
├── package.json             # Dependencias del proyecto
└── README.md               # Este archivo
```

---

## 🔌 Endpoints

### **Autenticación de Usuarios**

#### 📝 Registrar Usuario
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "juan_perez",
  "email": "juan@example.com",
  "password": "micontraseña123"
}
```

**Respuesta Exitosa (201)**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "juan_perez",
    "email": "juan@example.com"
  }
}
```

**Respuesta Error (400)**
```json
{
  "success": false,
  "message": "El usuario ya existe"
}
```

---

#### 🔓 Iniciar Sesión
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "micontraseña123"
}
```

**Respuesta Exitosa (200)**
```json
{
  "success": true,
  "message": "Sesión iniciada correctamente",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "juan_perez",
    "email": "juan@example.com"
  }
}
```

**Respuesta Error (401)**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

---

#### ✌️ Cerrar Sesión
```http
POST /api/users/logout
Authorization: Session Cookie
```

**Respuesta Exitosa (200)**
```json
{
  "success": true,
  "message": "Sesión cerrada correctamente"
}
```

---

#### 🛡️ Dashboard (Ruta Protegida)
```http
GET /dashboard
Authorization: Session Cookie
```

**Respuesta Exitosa (200)**
```json
{
  "success": true,
  "message": "Bienvenido al dashboard",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "juan_perez",
    "email": "juan@example.com"
  }
}
```

**Respuesta Error - No Autenticado (401)**
```json
{
  "success": false,
  "message": "Debes iniciar sesión para acceder a esta ruta"
}
```

---

## 🔐 Autenticación y Sesiones

### ¿Cómo Funciona?

1. **Registro (Register)**
   - El usuario envía email, username y contraseña
   - La contraseña se **cifra con bcrypt** antes de guardarse en la BD
   - Se crea un documento en la colección de usuarios

2. **Login**
   - El usuario envía email y contraseña
   - Se busca el usuario en la BD
   - Se **compara** la contraseña ingresada con el hash almacenado
   - Si es válida, **express-session crea una sesión**
   - La sesión se almacena en la memoria (o base de datos en producción)
   - Se envía un **cookie de sesión** al cliente

3. **Acceso a Rutas Protegidas**
   - El middleware `auth.js` **verifica la sesión** en cada petición
   - Si existe una sesión válida, permite acceder
   - Si no, retorna un error 401

4. **Logout**
   - Se **destruye la sesión** en el servidor
   - Se **elimina el cookie** del cliente
   - El usuario debe hacer login nuevamente

### Flujo de Autenticación
```
┌─────────────────────────────────────────────────────┐
│ 1. Usuario envía credenciales (POST /api/users/login)
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 2. Servidor verifica contraseña con bcrypt.compare()
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 3. express-session crea sesión (req.session)
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 4. Se envía cookie al cliente (Set-Cookie header)
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 5. Cliente envía cookie en próximas peticiones
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 6. auth.js valida sesión (middleware)
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 7. Acceso a ruta protegida o error 401
└─────────────────────────────────────────────────────┘
```

### Seguridad

🔒 **Contraseñas**
- Se cifran con **bcrypt** (10 rounds por defecto)
- Nunca se almacenan en texto plano
- Se comparan con `bcrypt.compare()` en cada login

🗝️ **Sesiones**
- El secret se configura en `.env`
- Los cookies son HTTP-only (no accesibles desde JavaScript)
- Las sesiones expiran después de `SESSION_TIMEOUT` ms

---

## 🚀 Mejoras Futuras

### Seguridad Avanzada
- [ ] Implementar **JWT (JSON Web Tokens)** como alternativa a sesiones
- [ ] Agregar **CORS** con configuración estricta
- [ ] Validación de entrada con **express-validator**
- [ ] Limitar intentos de login con **express-rate-limit**
- [ ] Implementar **HTTPS** en producción

### Funcionalidades
- [ ] Recuperación de contraseña por email
- [ ] Autenticación con Google/GitHub (OAuth 2.0)
- [ ] Sistema de roles y permisos
- [ ] Administración de usuarios (CRUD completo)
- [ ] Logs de auditoría

### Base de Datos
- [ ] Índices en campos frecuentemente consultados
- [ ] Migración a base de datos en producción (MongoDB Atlas)
- [ ] Backups automáticos

### DevOps & Deployment
- [ ] Dockerizar la aplicación
- [ ] CI/CD con GitHub Actions
- [ ] Deploy en **Heroku**, **Vercel** o **Railway**
- [ ] Monitoreo con **Sentry** o **LogRocket**
- [ ] Testing unitario con **Jest**

---

## 📚 Recursos Útiles

- [Documentación de Express](https://expressjs.com/)
- [Documentación de Mongoose](https://mongoosejs.com/)
- [bcrypt npm](https://www.npmjs.com/package/bcrypt)
- [express-session npm](https://www.npmjs.com/package/express-session)
- [OWASP Web Security](https://owasp.org/)

---

## 👨‍💻 Autor

Desarrollado por **[Emanuel Montenegro]**

- 📁 Portfolio: [link](https://emanuelmontenegro.dev)
- 🐙 GitHub: [@tunombre](https://github.com/emamontenegro)
- 💼 LinkedIn: [tunombre](https://linkedin.com/in/emanuel-montenegro-dev)

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Ver archivo `LICENSE` para más detalles.

---

## 🤝 Contribuciones

¿Encontraste un bug o tienes una idea? ¡Las contribuciones son bienvenidas!

1. Haz un fork del proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commits de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!**
