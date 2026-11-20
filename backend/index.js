/**
 * @file index.js
 * @description Application entrypoint delegating to modular server.js bootstrap.
 */

const { app, server, startServer } = require('./server');

const PORT = Number(process.env.PORT || 5000);

if (require.main === module) {
  startServer(PORT).catch((err) => {
    console.error('[STARTUP] Fatal error during backend bootstrap:', err);
    process.exit(1);
  });
}

module.exports = { app, server, startServer };

