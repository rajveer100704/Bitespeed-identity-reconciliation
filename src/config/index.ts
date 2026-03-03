import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  externalUrl: process.env.EXTERNAL_URL || `http://localhost:${process.env.PORT || '3000'}`,
} as const;

export type AppConfig = typeof config;
