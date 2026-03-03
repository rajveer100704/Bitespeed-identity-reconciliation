import { prisma } from '../config/prisma';
import { NotFoundError } from '../utils';
import logger from '../utils/logger';
import { ContactGraphResponse, GraphNode, GraphEdge } from '../types/graph.types';

/**
 * Fetches the full contact graph for a given contact ID.
 * Works whether the given ID is a primary or secondary contact.
 */
export async function getContactGraph(contactId: number): Promise<ContactGraphResponse> {
  // --- 1. Find the requested contact ---
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, deletedAt: null },
  });

  if (!contact) {
    throw new NotFoundError(`Contact with id ${contactId} not found`);
  }

  // --- 2. Resolve the primary contact ID ---
  const primaryId = contact.linkPrecedence === 'PRIMARY' ? contact.id : contact.linkedId!;

  // --- 3. Fetch the full cluster in a single query ---
  const cluster = await prisma.contact.findMany({
    where: {
      OR: [{ id: primaryId }, { linkedId: primaryId }],
      deletedAt: null,
    },
    orderBy: { createdAt: 'asc' },
  });

  logger.info(`Contact graph fetched for id=${contactId}, cluster size=${cluster.length}`);

  // --- 4. Build nodes ---
  const nodes: GraphNode[] = cluster.map((c) => ({
    id: c.id,
    email: c.email,
    phoneNumber: c.phoneNumber,
    type: c.linkPrecedence as 'PRIMARY' | 'SECONDARY',
  }));

  // --- 5. Build edges (secondary → primary) ---
  const edges: GraphEdge[] = cluster
    .filter((c) => c.linkPrecedence === 'SECONDARY' && c.linkedId !== null)
    .map((c) => ({
      source: c.id,
      target: c.linkedId!,
    }));

  return { nodes, edges };
}
