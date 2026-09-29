const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = env.PORT || 5000;

let server;

const startServer = async () => {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`[Server] Healthcare API Server running on port ${PORT} [env: ${env.NODE_ENV}]`);
  });
};

const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] Closed HTTP server connections.');
      await disconnectDB();
      console.log('[Server] Disconnected database. Shutdown complete.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { startServer };
