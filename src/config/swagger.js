import swaggerJsdoc from 'swagger-jsdoc';
import { dump as toYaml } from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';
import cluster from 'node:cluster';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterBody:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: Giulio Montenegro
 *         email:
 *           type: string
 *           format: email
 *           example: giulio@example.com
 *         password:
 *           type: string
 *           minLength: 6
 *           example: "mi_password_segura"
 *     LoginBody:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: giulio@example.com
 *         password:
 *           type: string
 *           example: "mi_password_segura"
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 664abc123def456
 *         name:
 *           type: string
 *           example: Giulio Montenegro
 *         email:
 *           type: string
 *           format: email
 *           example: giulio@example.com
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: user
 *         provider:
 *           type: string
 *           enum: [local, google]
 *           example: local
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Login exitoso
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           $ref: '#/components/schemas/User'
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Credenciales inválidas
 */

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Backend 3 Course API',
      version: '1.0.0',
      description:
        'API de Autenticación del curso Backend III — soporta login local y Google OAuth 2.0, sesiones con JWT y roles de usuario.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Pegá el token JWT que recibís al hacer login. Formato: Bearer <token>',
        },
      },
    },
  },
  // swagger-jsdoc escanea los @openapi de las rutas Y de este mismo archivo
  apis: [
    join(__dirname, '../routes/*.js'),
    join(__dirname, './swagger.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

// Solo el worker 1 (o el proceso primario) escribe el archivo, evitando duplicados en cluster
if (!cluster.worker || cluster.worker.id === 1) {
  writeFileSync(join(__dirname, '../../swagger.yaml'), toYaml(swaggerSpec, { lineWidth: -1 }), 'utf-8');
}

export default swaggerSpec;
