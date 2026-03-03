import { Contact, ContactLinkPrecedence } from '@prisma/client';

/**
 * Request payload for POST /identify
 */
export interface IdentifyRequest {
  email?: string | null;
  phoneNumber?: string | null;
}

/**
 * Consolidated contact response
 */
export interface ConsolidatedContact {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export interface IdentifyResponse {
  contact: ConsolidatedContact;
}

export type { Contact, ContactLinkPrecedence };
