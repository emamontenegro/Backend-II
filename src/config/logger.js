import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Logger centralizado con Pino.
 * - development: pino-pretty → texto con colores y timestamps legibles en consola.
 * - production:  JSON estructurado → compatible con Datadog, CloudWatch, Loki, etc.
 *
 * Niveles disponibles (de menor a mayor criticidad):
 *   trace · debug · info · warn · error · fatal
 *
 * Sintaxis para logs estructurados (DIFERENTE a Winston):
 *   logger.info('mensaje simple')
 *   logger.error({ error: err.message }, 'descripción del error')  ← objeto PRIMERO
 */
const logger = pino({
  level: isDev ? 'debug' : 'warn',
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize:      true,
        translateTime: 'HH:MM:ss',
        ignore:        'hostname',
        singleLine:    true
      }
    }
  })
});

export default logger;
