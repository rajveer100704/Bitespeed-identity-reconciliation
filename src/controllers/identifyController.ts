import { Request, Response } from 'express';
import { identifyContact } from '../services/identity.service';
import { identifySchema } from '../validators';
import { asyncHandler, logger } from '../utils';

/**
 * POST /identify
 * Validates input via Zod, delegates to service, returns consolidated contact.
 */
export const identify = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const correlationId = req.correlationId;

  // --- Zod validation + normalization ---
  const parsed = identifySchema.parse(req.body);

  logger.info('Identify request received', {
    correlationId,
    email: parsed.email || null,
    phoneNumber: parsed.phoneNumber || null,
  });

  const result = await identifyContact(parsed.email, parsed.phoneNumber);

  logger.info('Identify request completed', {
    correlationId,
    primaryContactId: result.contact.primaryContactId,
    secondaryCount: result.contact.secondaryContactIds.length,
  });

  res.status(200).json(result);
});
