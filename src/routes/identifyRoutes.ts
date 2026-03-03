import { Router } from 'express';
import { identify } from '../controllers';

const router = Router();

/**
 * @swagger
 * /identify:
 *   post:
 *     tags:
 *       - Identity
 *     summary: Identify and reconcile a customer contact
 *     description: |
 *       Receives an email and/or phoneNumber and returns the consolidated contact information.
 *
 *       **Behavior:**
 *       - If no matching contact exists, a new **primary** contact is created.
 *       - If a match is found but the request contains new info (email or phone), a **secondary** contact is created and linked to the primary.
 *       - If the request links two separate primary contacts, the newer primary is **converted to secondary** (merged into the older primary's cluster).
 *       - Emails are normalized to lowercase. Phone numbers are coerced to strings.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IdentifyRequest'
 *           examples:
 *             newContact:
 *               summary: New customer (creates primary)
 *               value:
 *                 email: "lorraine@hillvalley.edu"
 *                 phoneNumber: "123456"
 *             secondaryCreation:
 *               summary: Returning customer with new email (creates secondary)
 *               value:
 *                 email: "mcfly@hillvalley.edu"
 *                 phoneNumber: "123456"
 *             mergeTrigger:
 *               summary: Links two existing primaries (triggers merge)
 *               value:
 *                 email: "george@hillvalley.edu"
 *                 phoneNumber: "717171"
 *             emailOnly:
 *               summary: Lookup by email only
 *               value:
 *                 email: "lorraine@hillvalley.edu"
 *             phoneOnly:
 *               summary: Lookup by phone only
 *               value:
 *                 phoneNumber: "123456"
 *     responses:
 *       200:
 *         description: Consolidated contact returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IdentifyResponse'
 *             examples:
 *               newContact:
 *                 summary: New primary contact created
 *                 value:
 *                   contact:
 *                     primaryContactId: 1
 *                     emails: ["lorraine@hillvalley.edu"]
 *                     phoneNumbers: ["123456"]
 *                     secondaryContactIds: []
 *               withSecondary:
 *                 summary: Contact with secondary linked
 *                 value:
 *                   contact:
 *                     primaryContactId: 1
 *                     emails: ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"]
 *                     phoneNumbers: ["123456"]
 *                     secondaryContactIds: [23]
 *               merged:
 *                 summary: After merging two primaries
 *                 value:
 *                   contact:
 *                     primaryContactId: 11
 *                     emails: ["george@hillvalley.edu", "biffsucks@hillvalley.edu"]
 *                     phoneNumbers: ["919191", "717171"]
 *                     secondaryContactIds: [27]
 *       400:
 *         description: Validation error — at least one of email or phoneNumber is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "Validation failed"
 *                 code: 400
 *                 details:
 *                   - field: ""
 *                     message: "At least one of email or phoneNumber is required"
 *                 correlationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "Internal Server Error"
 *                 code: 500
 *                 correlationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 */
router.post('/identify', identify);

export default router;
