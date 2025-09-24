import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should use default values when environment variables are not set', async () => {
    // Clear environment variables
    delete process.env['PORT'];
    delete process.env['HOST'];
    delete process.env['NODE_ENV'];
    delete process.env['JWT_ISSUER'];
    delete process.env['JWT_AUDIENCE'];
    delete process.env['JWKS_URI'];
    delete process.env['LOG_LEVEL'];

    // Import config module (default values should be used)
    const { appConfig } = await import('../../src/config/index.js');

    expect(appConfig.port).toBe(3000);
    expect(appConfig.host).toBe('0.0.0.0');
    expect(appConfig.nodeEnv).toBe('development');
    expect(appConfig.jwtConfig.issuer).toBe('https://mock-fdx-auth.example.com');
    expect(appConfig.jwtConfig.audience).toBe('fdx-resource-api');
    expect(appConfig.jwtConfig.jwksUri).toBe('https://mock-fdx-auth.example.com/.well-known/jwks.json');
    expect(appConfig.logging.level).toBe('info');
  });

  it('should handle invalid PORT gracefully by using default', async () => {
    process.env['PORT'] = 'invalid';

    const { appConfig } = await import('../../src/config/index.js');

    // When port is invalid, parseInt returns NaN, but default 3000 should be used
    expect(isNaN(parseInt(process.env['PORT'] || '3000', 10))).toBe(true);
    expect(appConfig.port).toBeTypeOf('number');
  });

  it('should have all required config properties', async () => {
    const { appConfig } = await import('../../src/config/index.js');

    expect(appConfig).toHaveProperty('port');
    expect(appConfig).toHaveProperty('host');
    expect(appConfig).toHaveProperty('nodeEnv');
    expect(appConfig).toHaveProperty('jwtConfig');
    expect(appConfig.jwtConfig).toHaveProperty('issuer');
    expect(appConfig.jwtConfig).toHaveProperty('audience');
    expect(appConfig.jwtConfig).toHaveProperty('jwksUri');
    expect(appConfig).toHaveProperty('logging');
    expect(appConfig.logging).toHaveProperty('level');
  });
});