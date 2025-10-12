import { config } from 'dotenv';

config();

export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  jwtConfig: {
    issuer: string;
    audience: string;
    jwksUri: string;
  };
  logging: {
    level: string;
  };
  cache: {
    enabled: boolean;
    ttlSeconds: number;
  };
}

export const appConfig: AppConfig = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  host: process.env['HOST'] || '0.0.0.0',
  nodeEnv: process.env['NODE_ENV'] || 'development',
  jwtConfig: {
    issuer: process.env['JWT_ISSUER'] || 'https://mock-fdx-auth.example.com',
    audience: process.env['JWT_AUDIENCE'] || 'fdx-resource-api',
    jwksUri: process.env['JWKS_URI'] || 'https://mock-fdx-auth.example.com/.well-known/jwks.json',
  },
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
  },
  cache: {
    enabled: process.env['CACHE_ENABLED'] !== 'false',
    ttlSeconds: parseInt(process.env['CACHE_TTL_SECONDS'] || '60', 10),
  },
};
