// Standalone server starter with crash handlers
process.on('uncaughtException', (e) => {
  console.error('[CRASH] uncaughtException:', e.message);
});
process.on('unhandledRejection', (e) => {
  console.error('[CRASH] unhandledRejection:', e);
});

// Load server
require('./.next/standalone/server.js');
