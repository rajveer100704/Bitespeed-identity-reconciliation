import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { Contact, IdentifyResponse } from '../types/contact.types';
import { BadRequestError } from '../utils';
import logger from '../utils/logger';

/**
 * Core identity reconciliation service.
 * Pure business logic — no Express dependencies.
 */
export async function identifyContact(
  email?: string | null,
  phoneNumber?: string | null,
): Promise<IdentifyResponse> {
  // --- 1. Input validation ---
  const cleanEmail = email?.trim() || null;
  const cleanPhone = phoneNumber?.toString().trim() || null;

  if (!cleanEmail && !cleanPhone) {
    throw new BadRequestError('At least one of email or phoneNumber is required');
  }

  // --- 2. Run all logic inside a transaction for consistency ---
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // --- 3. Find all contacts matching email OR phoneNumber ---
    const matchingContacts = await findMatchingContacts(tx, cleanEmail, cleanPhone);

    // --- 4. No matches → create new PRIMARY contact ---
    if (matchingContacts.length === 0) {
      logger.info('No existing contacts found. Creating new primary contact.');
      const newContact = await tx.contact.create({
        data: {
          email: cleanEmail,
          phoneNumber: cleanPhone,
          linkPrecedence: 'PRIMARY',
        },
      });
      return buildResponse(newContact, []);
    }

    // --- 5. Fetch the full connected cluster ---
    const cluster = await fetchFullCluster(tx, matchingContacts);

    // --- 6. Identify the oldest primary and handle merges ---
    const { primary, secondaries } = await resolveCluster(tx, cluster);

    // --- 7. Create secondary if incoming data has new info ---
    const updatedSecondaries = await createSecondaryIfNeeded(
      tx,
      primary,
      secondaries,
      cleanEmail,
      cleanPhone,
    );

    // --- 8. Build and return response ---
    return buildResponse(primary, updatedSecondaries);
  });
}

// =============================================================================
// Helper Functions
// =============================================================================

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Find all contacts where email OR phoneNumber matches the input.
 */
async function findMatchingContacts(
  tx: TransactionClient,
  email: string | null,
  phoneNumber: string | null,
): Promise<Contact[]> {
  const orConditions: object[] = [];
  if (email) orConditions.push({ email });
  if (phoneNumber) orConditions.push({ phoneNumber });

  return tx.contact.findMany({
    where: {
      OR: orConditions,
      deletedAt: null,
    },
  });
}

/**
 * Given initial matches, expand to the full connected cluster.
 * Fetches all contacts whose id or linkedId connects them to the matched set.
 */
async function fetchFullCluster(
  tx: TransactionClient,
  initialMatches: Contact[],
): Promise<Contact[]> {
  // Collect all primary IDs in the cluster
  const primaryIds = new Set<number>();

  for (const contact of initialMatches) {
    if (contact.linkPrecedence === 'PRIMARY') {
      primaryIds.add(contact.id);
    } else if (contact.linkedId !== null) {
      primaryIds.add(contact.linkedId);
    }
  }

  // Fetch all contacts that belong to any of these primary chains
  const fullCluster = await tx.contact.findMany({
    where: {
      OR: [{ id: { in: Array.from(primaryIds) } }, { linkedId: { in: Array.from(primaryIds) } }],
      deletedAt: null,
    },
    orderBy: { createdAt: 'asc' },
  });

  return fullCluster;
}

/**
 * Resolve the cluster: ensure there's exactly one primary (the oldest),
 * and convert any newer primaries to secondaries.
 */
async function resolveCluster(
  tx: TransactionClient,
  cluster: Contact[],
): Promise<{ primary: Contact; secondaries: Contact[] }> {
  // Separate primaries and secondaries
  const primaries = cluster.filter((c: Contact) => c.linkPrecedence === 'PRIMARY');
  const secondaries = cluster.filter((c: Contact) => c.linkPrecedence === 'SECONDARY');

  // The oldest primary (first by createdAt, already sorted)
  const primary = primaries[0];

  // If multiple primaries exist, convert the newer ones to secondaries
  if (primaries.length > 1) {
    const newerPrimaries = primaries.slice(1);
    const newerPrimaryIds = newerPrimaries.map((c) => c.id);

    logger.info(`Merging ${newerPrimaries.length} newer primary(ies) into primary #${primary.id}`);

    // Convert newer primaries to secondary
    await tx.contact.updateMany({
      where: { id: { in: newerPrimaryIds } },
      data: {
        linkPrecedence: 'SECONDARY',
        linkedId: primary.id,
        updatedAt: new Date(),
      },
    });

    // Re-link any secondaries that pointed to the newer primaries
    await tx.contact.updateMany({
      where: { linkedId: { in: newerPrimaryIds } },
      data: {
        linkedId: primary.id,
        updatedAt: new Date(),
      },
    });

    // Refresh the full cluster after merge
    const updatedCluster = await tx.contact.findMany({
      where: {
        OR: [{ id: primary.id }, { linkedId: primary.id }],
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      primary: updatedCluster.find((c: Contact) => c.id === primary.id)!,
      secondaries: updatedCluster.filter((c: Contact) => c.id !== primary.id),
    };
  }

  return { primary, secondaries };
}

/**
 * If the incoming request contains email/phone not already in the cluster,
 * create a new secondary contact.
 */
async function createSecondaryIfNeeded(
  tx: TransactionClient,
  primary: Contact,
  secondaries: Contact[],
  email: string | null,
  phoneNumber: string | null,
): Promise<Contact[]> {
  const allContacts = [primary, ...secondaries];

  const existingEmails = new Set(allContacts.map((c: Contact) => c.email).filter(Boolean));
  const existingPhones = new Set(allContacts.map((c: Contact) => c.phoneNumber).filter(Boolean));

  const hasNewEmail = email && !existingEmails.has(email);
  const hasNewPhone = phoneNumber && !existingPhones.has(phoneNumber);

  // Only create if there's genuinely new information
  if (hasNewEmail || hasNewPhone) {
    logger.info(`New info detected. Creating secondary contact linked to primary #${primary.id}`);

    const newSecondary = await tx.contact.create({
      data: {
        email,
        phoneNumber,
        linkedId: primary.id,
        linkPrecedence: 'SECONDARY',
      },
    });

    return [...secondaries, newSecondary];
  }

  return secondaries;
}

/**
 * Build the consolidated response object.
 * Primary's email/phone always come first in the arrays.
 */
function buildResponse(primary: Contact, secondaries: Contact[]): IdentifyResponse {
  const allContacts = [primary, ...secondaries];

  // Deduplicated emails — primary's email first
  const emails: string[] = [];
  const seenEmails = new Set<string>();
  for (const contact of allContacts) {
    if (contact.email && !seenEmails.has(contact.email)) {
      seenEmails.add(contact.email);
      emails.push(contact.email);
    }
  }

  // Deduplicated phoneNumbers — primary's phone first
  const phoneNumbers: string[] = [];
  const seenPhones = new Set<string>();
  for (const contact of allContacts) {
    if (contact.phoneNumber && !seenPhones.has(contact.phoneNumber)) {
      seenPhones.add(contact.phoneNumber);
      phoneNumbers.push(contact.phoneNumber);
    }
  }

  return {
    contact: {
      primaryContactId: primary.id,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaries.map((c: Contact) => c.id).sort((a, b) => a - b),
    },
  };
}
