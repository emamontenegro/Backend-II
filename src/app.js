/**
 * Entry point con soporte de Cluster.
 *
 * Flujo del proceso PRIMARY:
 *   1. dotenv          → carga .env (PORT, NODE_ENV, VAULT_URL, VAULT_TOKEN)
 *   2. Vault           → inyecta secretos en process.env
 *   3. cluster.fork()  → lanza N workers (uno por CPU lógica)
 *
 * Flujo de cada WORKER:
 *   - Hereda process.env del primary al momento del fork (secretos ya incluidos)
 *   - Importa server.js directamente (sin pasar por Vault de nuevo)
 *   - Cada worker tiene su propia conexión a MongoDB y su instancia de Express
 *
 * Nota prom-client: cada worker expone sus propias métricas en /metrics.
 * Prometheus recibe las del worker que atiende el scrape (comportamiento normal en dev).
 */
import 'dotenv/config';
import cluster from 'node:cluster';
import os     from 'node:os';

// En contenedores os.cpus() devuelve los CPUs del HOST, no del límite del contenedor.
// Caps en 2 para evitar OOMKilled en Minikube/Docker.
// WEB_CONCURRENCY permite sobreescribir desde el entorno (ej. Heroku, K8s).
const NUM_WORKERS = process.env.WEB_CONCURRENCY
  ? parseInt(process.env.WEB_CONCURRENCY, 10)
  : Math.min(os.cpus().length, 2);

if (cluster.isPrimary) {

  const logger = (await import('./config/logger.js')).default;

  // Si MONGO_URI ya está en el entorno (K8s Secret, .env directo, etc.)
  // salteamos Vault — los secretos ya están disponibles.
  // En desarrollo local, Vault los inyecta. En Kubernetes, los inyecta el Secret.
  if (process.env.MONGO_URI) {
    logger.info('Secretos detectados en process.env — salteando Vault');
  } else {
    const { cargarSecretosDesdeVault } = await import('./config/vault.js');
    try {
      await cargarSecretosDesdeVault();
    } catch (error) {
      console.error('No se pudo cargar Vault:', error.message);
      process.exit(1);
    }
  }

  logger.info(`Master PID ${process.pid} — detectados ${NUM_WORKERS} CPUs lógicas`);

  // Levantar un worker por CPU
  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }

  // Log cuando un worker queda online
  cluster.on('online', (worker) => {
    logger.info({ pid: worker.process.pid }, `Worker ${worker.id} online`);
  });

  // Si un worker muere, loguearlo y levantar un reemplazo automáticamente
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(
      { pid: worker.process.pid, code: code ?? null, signal: signal ?? null },
      `Worker ${worker.id} murió — levantando reemplazo`
    );
    cluster.fork();
  });

} else {
  // Worker: process.env ya contiene los secretos heredados del primary
  await import('./server.js');
}
