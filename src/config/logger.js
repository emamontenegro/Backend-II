import { createLogger, format, transports } from 'winston';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logsDir   = join(__dirname, '../../logs');

const isDev = process.env.NODE_ENV !== 'production';

// En producción crear la carpeta de logs si no existe
if (!isDev) {
  try { mkdirSync(logsDir, { recursive: true }); } catch { /* ya existe */ }
}

// Formato desarrollo: timestamp + colores + texto legible
const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ level, message, timestamp, ...meta }) => {
    const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} [${level}] ${message}${extra}`;
  })
);

// Formato producción: JSON estructurado para sistemas externos (Datadog, CloudWatch)
const prodFormat = format.combine(
  format.errors({ stack: true }),
  format.timestamp(),
  format.json()
);

const logger = createLogger({
  level: isDev ? 'debug' : 'warn',
  format: isDev ? devFormat : prodFormat,
  transports: isDev
    ? [new transports.Console()]
    : [
        new transports.Console(),
        new transports.File({ filename: join(logsDir, 'error.log'),    level: 'error' }),
        new transports.File({ filename: join(logsDir, 'combined.log') })
      ]
});

export default logger;
