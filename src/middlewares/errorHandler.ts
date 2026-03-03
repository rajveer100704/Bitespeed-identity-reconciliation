import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, logger } from '../utils';

/**
 * Structured error response format.
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: number;
    details?: unknown;
    correlationId?: string;
  };
}

/**
 * Centralized error-handling middleware.
 * Handles AppError, ZodError, and unexpected errors with structured JSON.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const correlationId = req.correlationId;

  // --- Zod validation errors → 400 ---
  if (err instanceof ZodError) {
    logger.warn('Validation error', {
      correlationId,
      errors: err.errors,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        message: 'Validation failed',
        code: 400,
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
        correlationId,
      },
    };

    res.status(400).json(response);
    return;
  }

  // --- Known operational errors → respective status code ---
  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message}`, {
      correlationId,
      statusCode: err.statusCode,
      stack: err.stack,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.statusCode,
        correlationId,
      },
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // --- Unexpected / programmer errors → 500 ---
  logger.error(`Unexpected error: ${err.message}`, {
    correlationId,
    stack: err.stack,
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      message: 'Internal Server Error',
      code: 500,
      correlationId,
    },
  };

  res.status(500).json(response);
};
