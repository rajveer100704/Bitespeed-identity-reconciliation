import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils';

/**
 * Logs incoming HTTP requests with correlationId, method, path.
 * Logs response completion with duration on finish.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  logger.info('Request started', {
    correlationId: req.correlationId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });

  res.on('finish', () => {
    const durationMs = Date.now() - req.startTime;
    logger.info('Request completed', {
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
};
