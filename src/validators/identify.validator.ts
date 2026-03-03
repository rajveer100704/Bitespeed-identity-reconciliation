import { z } from 'zod';

/**
 * Zod schema for POST /identify request body.
 * - Both fields optional, but at least one required.
 * - email normalized to lowercase.
 * - phoneNumber coerced to string.
 */
export const identifySchema = z
  .object({
    email: z
      .string()
      .email('Invalid email format')
      .transform((val) => val.toLowerCase().trim())
      .nullish(),
    phoneNumber: z
      .union([z.string(), z.number()])
      .transform((val) => (val !== null && val !== undefined ? String(val).trim() : null))
      .nullish(),
  })
  .refine((data) => data.email || data.phoneNumber, {
    message: 'At least one of email or phoneNumber is required',
  });

export type IdentifyInput = z.infer<typeof identifySchema>;
