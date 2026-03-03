import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      correlationId: string;
      startTime: number;
    }
  }
}

/**
 * Attaches a unique correlationId and start timestamp to every request.
 * Downstream loggers and error handlers can reference req.correlationId.
 */
export const correlationId = (req: Request, _res: Response, next: NextFunction): void => {
  req.correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  req.startTime = Date.now();
  next();
};
