import { config } from 'dotenv';

config();

export type AggregatorProvider = 'mock' | 'yodlee';

export interface YodleeConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

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
  aggregator: {
    provider: AggregatorProvider;
    yodlee?: YodleeConfig;
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
  aggregator: {
    provider: (process.env['AGGREGATOR_PROVIDER'] as AggregatorProvider) || 'mock',
    ...(process.env['AGGREGATOR_PROVIDER'] === 'yodlee' && {
      yodlee: {
        baseUrl: process.env['YODLEE_BASE_URL'] || 'https://sandbox.api.yodlee.com',
        clientId: process.env['YODLEE_CLIENT_ID'] || '',
        clientSecret: process.env['YODLEE_CLIENT_SECRET'] || '',
      },
    }),
  },
};
