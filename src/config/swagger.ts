import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const serverUrl =
  process.env.EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bitespeed Identity Reconciliation Service',
      version: '1.0.0',
      description: 'API for contact identity reconciliation',
    },
    servers: [
      {
        url: serverUrl,
      },
    ],
    tags: [
      {
        name: 'Identity',
        description: 'Contact identification and reconciliation endpoints',
      },
      {
        name: 'Contacts',
        description: 'Contact graph and lookup endpoints',
      },
      {
        name: 'System',
        description: 'Health check and operational endpoints',
      },
    ],
    components: {
      schemas: {
        IdentifyRequest: {
          type: 'object',
          description: 'At least one of email or phoneNumber is required.',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Customer email address. Normalized to lowercase.',
              example: 'lorraine@hillvalley.edu',
            },
            phoneNumber: {
              type: 'string',
              description: 'Customer phone number. Coerced to string if sent as number.',
              example: '123456',
            },
          },
        },
        ConsolidatedContact: {
          type: 'object',
          properties: {
            primaryContactId: {
              type: 'integer',
              description: 'ID of the primary contact in the cluster',
              example: 1,
            },
            emails: {
              type: 'array',
              items: { type: 'string' },
              description: "All emails in the cluster. Primary contact's email first.",
              example: ['lorraine@hillvalley.edu', 'mcfly@hillvalley.edu'],
            },
            phoneNumbers: {
              type: 'array',
              items: { type: 'string' },
              description: "All phone numbers in the cluster. Primary contact's phone first.",
              example: ['123456'],
            },
            secondaryContactIds: {
              type: 'array',
              items: { type: 'integer' },
              description: 'IDs of all secondary contacts, sorted ascending.',
              example: [23],
            },
          },
          required: ['primaryContactId', 'emails', 'phoneNumbers', 'secondaryContactIds'],
        },
        IdentifyResponse: {
          type: 'object',
          properties: {
            contact: {
              $ref: '#/components/schemas/ConsolidatedContact',
            },
          },
          required: ['contact'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                code: {
                  type: 'integer',
                  example: 400,
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                  description: 'Present only for validation errors',
                },
                correlationId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                },
              },
              required: ['message', 'code', 'correlationId'],
            },
          },
          required: ['success', 'error'],
        },
        ContactGraph: {
          type: 'object',
          description: 'Full contact graph for a given contact ID (placeholder).',
          properties: {
            primaryContact: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                email: { type: 'string', nullable: true },
                phoneNumber: { type: 'string', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
            secondaryContacts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  email: { type: 'string', nullable: true },
                  phoneNumber: { type: 'string', nullable: true },
                  linkedId: { type: 'integer' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            totalContacts: {
              type: 'integer',
              example: 3,
            },
          },
        },
        HealthCheckResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'OK' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number', example: 123.45 },
            environment: { type: 'string', example: 'development' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
