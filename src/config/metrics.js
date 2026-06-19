import { Registry, collectDefaultMetrics, Histogram, Counter } from 'prom-client';

// Registro dedicado para no mezclar con métricas globales de otras librerías
export const register = new Registry();

register.setDefaultLabels({ app: 'backend-ii' });

// Métricas por defecto de Node.js: CPU, memoria, event loop, GC, handles activos, etc.
collectDefaultMetrics({ register });

/**
 * Histograma: duración de requests HTTP en segundos.
 * Etiquetas: method (GET/POST), route (/api/v1/auth/login), status_code (200/401/500).
 * Los buckets representan los umbrales en segundos que Prometheus usa para calcular percentiles.
 */
export const httpDuration = new Histogram({
  name:       'http_request_duration_seconds',
  help:       'Duración de los requests HTTP en segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets:    [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers:  [register]
});

/**
 * Contador: total de requests HTTP recibidos.
 * Útil para calcular throughput y tasa de errores.
 */
export const httpRequests = new Counter({
  name:       'http_requests_total',
  help:       'Total de requests HTTP recibidos',
  labelNames: ['method', 'route', 'status_code'],
  registers:  [register]
});

/**
 * Middleware Express: mide duración y cuenta cada request.
 * Debe registrarse ANTES de las rutas en server.js.
 */
export const metricsMiddleware = (req, res, next) => {
  const end = httpDuration.startTimer();

  res.on('finish', () => {
    const labels = {
      method:      req.method,
      route:       req.route?.path ?? req.path,
      status_code: res.statusCode
    };
    end(labels);
    httpRequests.inc(labels);
  });

  next();
};
