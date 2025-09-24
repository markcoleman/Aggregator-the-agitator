import { createApp } from './app.js';
import { appConfig } from './config/index.js';

async function start(): Promise<void> {
  try {
    const fastify = await createApp();

    await fastify.listen({
      port: appConfig.port,
      host: appConfig.host,
    });

    fastify.log.info(`Server running at http://${appConfig.host}:${appConfig.port}`);
    fastify.log.info(
      `API documentation available at http://${appConfig.host}:${appConfig.port}/docs`,
    );
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

start();
