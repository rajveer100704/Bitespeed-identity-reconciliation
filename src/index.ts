import app from './app';
import { config } from './config';
import { logger } from './utils';

const start = (): void => {
  app.listen(config.port, () => {
    logger.info(`🚀 Server running on http://localhost:${config.port}`);
    logger.info(`📚 Swagger docs at http://localhost:${config.port}/docs`);
    logger.info(`🌍 Environment: ${config.nodeEnv}`);
  });
};

start();
