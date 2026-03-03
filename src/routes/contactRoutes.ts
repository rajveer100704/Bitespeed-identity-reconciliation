import { Router } from 'express';
import { contactGraph } from '../controllers';

const router = Router();

/**
 * @swagger
 * /contacts/{id}/graph:
 *   get:
 *     tags:
 *       - Contacts
 *     summary: Get the contact graph for a given contact
 *     description: |
 *       Returns the full contact cluster as a graph (nodes + edges) for a given contact ID.
 *       If the given ID is a secondary contact, the response still returns the full cluster
 *       anchored at the primary.
 *
 *       - **Nodes** represent individual contacts with `type` indicating PRIMARY or SECONDARY.
 *       - **Edges** represent the secondary → primary relationship (`source` → `target`).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact ID (can be primary or secondary)
 *         example: 1
 *     responses:
 *       200:
 *         description: Contact graph returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nodes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       email:
 *                         type: string
 *                         nullable: true
 *                         example: "lorraine@hillvalley.edu"
 *                       phoneNumber:
 *                         type: string
 *                         nullable: true
 *                         example: "123456"
 *                       type:
 *                         type: string
 *                         enum: [PRIMARY, SECONDARY]
 *                         example: "PRIMARY"
 *                 edges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       source:
 *                         type: integer
 *                         description: Secondary contact ID
 *                         example: 23
 *                       target:
 *                         type: integer
 *                         description: Primary contact ID
 *                         example: 1
 *             examples:
 *               withSecondary:
 *                 summary: Primary with one secondary
 *                 value:
 *                   nodes:
 *                     - id: 1
 *                       email: "lorraine@hillvalley.edu"
 *                       phoneNumber: "123456"
 *                       type: "PRIMARY"
 *                     - id: 23
 *                       email: "mcfly@hillvalley.edu"
 *                       phoneNumber: "123456"
 *                       type: "SECONDARY"
 *                   edges:
 *                     - source: 23
 *                       target: 1
 *               primaryOnly:
 *                 summary: Primary contact only (no secondaries)
 *                 value:
 *                   nodes:
 *                     - id: 1
 *                       email: "lorraine@hillvalley.edu"
 *                       phoneNumber: "123456"
 *                       type: "PRIMARY"
 *                   edges: []
 *       404:
 *         description: Contact not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "Contact with id 999 not found"
 *                 code: 404
 *                 correlationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/contacts/:id/graph', contactGraph);

export default router;
