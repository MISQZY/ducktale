import { withDb } from './src/lib/db';
import { Prisma } from '@prisma/client';

async function run() {
  const rows = await withDb('default', (db) =>
    db.$queryRaw(Prisma.sql`SELECT HEX(server) as server, type, valid FROM fp_moderation WHERE type = 'maintenance' AND valid = 1`)
  );
  console.log(rows);
  process.exit(0);
}
run();