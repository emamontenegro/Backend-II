/**
 * Entry point — Vault PRIMERO, después todo lo demás.
 *
 * En ES Modules los imports estáticos se evalúan antes que cualquier línea
 * de este archivo, y módulos como sessionConfig.js o googleStrategy.js leen
 * process.env al cargarse. Por eso server.js se importa de forma DINÁMICA
 * (import()) recién cuando los secretos ya están inyectados en memoria.
 */
import 'dotenv/config';
import { cargarSecretosDesdeVault } from './config/vault.js';

const cargarSecretosYArrancar = async () => {
  // 1. Override dinámico: Vault → process.env (lo primero que ocurre)
  await cargarSecretosDesdeVault();

  // 2. Recién ahora se evalúan Express, Passport, session y Mongoose
  await import('./server.js');
};

cargarSecretosYArrancar().catch((error) => {
  // logger no está disponible aquí porque aún no cargó server.js
  console.error('No se pudo arrancar la aplicación:', error.message);
  process.exit(1);
});
