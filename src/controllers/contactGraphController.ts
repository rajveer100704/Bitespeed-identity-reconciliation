import { Request, Response } from 'express';
import { z } from 'zod';
import { getContactGraph } from '../services/contactGraph.service';
import { asyncHandler, logger } from '../utils';

const idParamSchema = z.coerce.number().int().positive('Contact ID must be a positive integer');

/**
 * GET /contacts/:id/graph
 * Returns the contact graph (nodes + edges) for a given contact ID.
 */
export const contactGraph = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const correlationId = req.correlationId;

  const contactId = idParamSchema.parse(req.params.id);

  logger.info('Contact graph request', { correlationId, contactId });

  const graph = await getContactGraph(contactId);

  logger.info('Contact graph returned', {
    correlationId,
    contactId,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
  });

  res.status(200).json(graph);
});
