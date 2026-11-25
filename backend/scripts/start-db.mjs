import { createServer } from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import EmbeddedPostgres from 'embedded-postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = 5432;
const user = 'pms';
const password = 'pms_password';
const database = 'patient_management';

function portInUse(checkPort) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(checkPort, '127.0.0.1');
  });
}

const busy = await portInUse(port);
if (busy) {
  console.log(`PostgreSQL is already accepting connections on port ${port}.`);
  console.log('Leave that server running and continue with prisma db push.');
  process.exit(0);
}

const databaseDir = path.join(__dirname, '..', 'data', 'pg');
const pg = new EmbeddedPostgres({
  databaseDir,
  user,
  password,
  port,
  persistent: true,
  onLog: () => {},
  onError: (message) => console.error(message),
});

console.log('Starting local PostgreSQL...');
if (!fs.existsSync(path.join(databaseDir, 'PG_VERSION'))) {
  await pg.initialise();
}
await pg.start();

try {
  await pg.createDatabase(database);
  console.log(`Created database ${database}.`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/already exists/i.test(message)) {
    throw error;
  }
  console.log(`Database ${database} already exists.`);
}

console.log(`PostgreSQL ready at postgresql://${user}:${password}@localhost:${port}/${database}`);
console.log('Keep this terminal open while you use the app. Press Ctrl+C to stop.');

const shutdown = async () => {
  await pg.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
