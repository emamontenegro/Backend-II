/**
 * Lógica de CONFIG_LEVEL (process.env).
 * process.env es mutable en memoria: POST /config actualiza el valor
 * y el próximo GET lo refleja sin reiniciar el proceso.
 */

export const resolveConfigMessage = () => {
  const level = process.env.CONFIG_LEVEL?.trim();

  if (level === 'high') return 'Configuración alta activada';
  if (level === 'low') return 'Configuración baja activada';
  return 'Configuración por defecto activada';
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
    });

    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('JSON inválido'));
      }
    });

    req.on('error', reject);
  });

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

/** GET /config — emula comando "get" */
export const handleGetConfig = (req, res) => {
  const message = resolveConfigMessage();
  const wantsJson = req.headers.accept?.includes('application/json');

  if (wantsJson) {
    return sendJson(res, 200, {
      message,
      level: process.env.CONFIG_LEVEL?.trim() || null
    });
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
};

/** POST /config — emula comando "set <valor>" */
export const handlePostConfig = async (req, res) => {
  try {
    const body = await readJsonBody(req);
    const level = body.level?.trim();

    if (!level) {
      return sendJson(res, 400, {
        error: 'Body requerido: { "level": "high" | "low" | "..." }'
      });
    }

    process.env.CONFIG_LEVEL = level;

    return sendJson(res, 200, {
      message: 'Configuración actualizada',
      level: process.env.CONFIG_LEVEL
    });
  } catch {
    return sendJson(res, 400, { error: 'JSON inválido' });
  }
};

/** Enrutador nativo http para /config (resto va a Express) */
export const isConfigRoute = (method, url) => {
  const path = url?.split('?')[0];
  return path === '/config' || path === '/config/';
};

export const dispatchConfigRoute = async (req, res) => {
  if (req.method === 'GET') return handleGetConfig(req, res);
  if (req.method === 'POST') return handlePostConfig(req, res);

  sendJson(res, 405, { error: 'Método no permitido. Usá GET o POST.' });
};
