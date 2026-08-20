/**
 * @file index.js
 * @description Application entrypoint delegating to modular server.js bootstrap.
 */

const { app, server } = require('./server');

const PORT = Number(process.env.PORT || 5000);

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`OSINT backend running on port ${PORT}`);
    console.log(`Gateway WebSocket relay active at ws://0.0.0.0:${PORT}/ws/gateway`);
    console.log('Auto-ingest stores breach metadata only; raw threat data is never persisted to disk.');
  });
}

module.exports = { app, server };

