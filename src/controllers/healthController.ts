import { Request, Response } from 'express';
import { config } from '../config';
import { HealthCheckResponse } from '../types';

export const healthCheck = (_req: Request, res: Response): void => {
  const response: HealthCheckResponse = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  };

  res.status(200).json(response);
};
