import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';

// Mock the createApp function
const mockFastify = {
  listen: vi.fn(),
  log: {
    info: vi.fn(),
  },
} as unknown as FastifyInstance;

const mockCreateApp = vi.fn().mockResolvedValue(mockFastify);

// Mock the config
const mockConfig = {
  port: 3000,
  host: 'localhost',
};

// Mock the modules before importing
vi.mock('../../src/app.js', () => ({
  createApp: mockCreateApp,
}));

vi.mock('../../src/config/index.js', () => ({
  appConfig: mockConfig,
}));

describe('Server', () => {
  let originalProcessExit: typeof process.exit;
  let originalConsoleError: typeof console.error;
  let originalConsoleLog: typeof console.log;
  let processExitSpy: any;
  let consoleErrorSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock process.exit and console methods
    originalProcessExit = process.exit;
    originalConsoleError = console.error;
    originalConsoleLog = console.log;

    processExitSpy = vi.fn();
    consoleErrorSpy = vi.fn();
    consoleLogSpy = vi.fn();

    process.exit = processExitSpy as any;
    console.error = consoleErrorSpy;
    console.log = consoleLogSpy;
  });

  afterEach(() => {
    // Restore original functions
    process.exit = originalProcessExit;
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  test('should start server successfully', async () => {
    mockFastify.listen = vi.fn().mockResolvedValue(undefined);

    // Import and run the server
    await import('../../src/server.js');

    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockCreateApp).toHaveBeenCalledTimes(1);
    expect(mockFastify.listen).toHaveBeenCalledWith({
      port: 3000,
      host: 'localhost',
    });
    expect(mockFastify.log.info).toHaveBeenCalledWith('Server running at http://localhost:3000');
    expect(mockFastify.log.info).toHaveBeenCalledWith(
      'API documentation available at http://localhost:3000/docs',
    );
  });

  test('should handle server start error', async () => {
    const error = new Error('Failed to start server');
    mockCreateApp.mockRejectedValueOnce(error);

    // Clear the module cache to get fresh imports
    vi.resetModules();

    // Re-mock after clearing
    vi.doMock('../../src/app.js', () => ({
      createApp: mockCreateApp,
    }));

    vi.doMock('../../src/config/index.js', () => ({
      appConfig: mockConfig,
    }));

    // Import server which should trigger the error handling
    await import('../../src/server.js');

    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error starting server:', error);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('should handle listen error', async () => {
    const error = new Error('Failed to listen');
    mockFastify.listen = vi.fn().mockRejectedValue(error);
    mockCreateApp.mockResolvedValueOnce(mockFastify);

    // Clear the module cache to get fresh imports
    vi.resetModules();

    // Re-mock after clearing
    vi.doMock('../../src/app.js', () => ({
      createApp: mockCreateApp,
    }));

    vi.doMock('../../src/config/index.js', () => ({
      appConfig: mockConfig,
    }));

    // Import server which should trigger the error handling
    await import('../../src/server.js');

    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error starting server:', error);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('should handle SIGINT signal', async () => {
    // Import server first
    await import('../../src/server.js');

    // Emit SIGINT signal
    process.emit('SIGINT', 'SIGINT');

    // Wait a bit for the signal handler to be processed
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(consoleLogSpy).toHaveBeenCalledWith('Received SIGINT, shutting down gracefully');
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  test('should handle SIGTERM signal', async () => {
    // Import server first
    await import('../../src/server.js');

    // Emit SIGTERM signal
    process.emit('SIGTERM', 'SIGTERM');

    // Wait a bit for the signal handler to be processed
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(consoleLogSpy).toHaveBeenCalledWith('Received SIGTERM, shutting down gracefully');
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });
});
