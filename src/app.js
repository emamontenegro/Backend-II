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

const NUM_WORKERS = os.cpus().length;

if (cluster.isPrimary) {

  // Vault y logger se importan dinámicamente para que no los evalúen los workers
  const { cargarSecretosDesdeVault } = await import('./config/vault.js');
  const logger = (await import('./config/logger.js')).default;

  try {
    await cargarSecretosDesdeVault();
  } catch (error) {
    console.error('No se pudo cargar Vault:', error.message);
    process.exit(1);
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
