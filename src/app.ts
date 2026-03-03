import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import routes from './routes';
import { errorHandler, requestLogger, correlationId } from './middlewares';
import { swaggerSpec } from './config/swagger';

const app = express();

// --- Global Middleware ---
app.use(cors());
app.use(express.json());
app.use(correlationId);
app.use(requestLogger);

// --- Swagger Docs at /docs ---
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Routes ---
app.use(routes);

// --- Root Route ---
app.get('/', (req, res) => {
    res.json({
        message: 'Bitespeed Identity Reconciliation Service',
        status: 'Running',
        docs: '/docs',
        health: '/health',
    });
});

// --- 404 Handler ---
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Cannot ${req.method} ${req.path}`,
            code: 404,
            correlationId: (req as any).correlationId || 'unknown',
        },
    });
});

// --- Centralized Error Handler (must be last) ---
app.use(errorHandler);

export default app;
