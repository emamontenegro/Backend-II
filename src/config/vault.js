import nodeVault from 'node-vault';
import logger from './logger.js';

// KV v2: la API lee en secret/data/<nombre> (el CLI escribe con "vault kv put secret/<nombre>")
const VAULT_SECRET_PATH = 'secret/data/backend';

/**
 * Lee los secretos desde Vault y los inyecta en process.env (override dinámico).
 * Debe ejecutarse ANTES de importar cualquier módulo que lea process.env.
 */
export const cargarSecretosDesdeVault = async () => {
  const endpoint = process.env.VAULT_URL?.trim();
  const token    = process.env.VAULT_TOKEN?.trim();

  if (!endpoint || !token) {
    logger.warn('VAULT_URL / VAULT_TOKEN no definidos — se usan solo las variables del .env');
    return;
  }

  const vault = nodeVault({ apiVersion: 'v1', endpoint, token });

  try {
    const respuesta = await vault.read(VAULT_SECRET_PATH);
    const secretos  = respuesta?.data?.data ?? {};

    for (const [clave, valor] of Object.entries(secretos)) {
      process.env[clave] = String(valor).trim();
    }

    logger.info(`Vault: ${Object.keys(secretos).length} secretos inyectados desde ${VAULT_SECRET_PATH}`);
  } catch (error) {
    logger.error(
      { error: error.message, hint: 'Corré "npm run seed:vault" después de "docker compose up"' },
      'Error al leer secretos de Vault'
    );
    process.exit(1);
  }
};
