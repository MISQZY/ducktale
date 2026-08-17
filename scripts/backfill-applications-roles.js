#!/usr/bin/env node
// One-off backfill for the "super-admin" built-in Role after RESOURCE_ROLES
// grew new entries for the applications feature (applications-view/-edit/
// -delete — see src/config/resource-roles.ts). seedBuiltinRoles()
// (src/lib/roles.ts) never overwrites an existing Role row, so the DB's
// existing "super-admin" row won't pick these up on its own — same
// situation documented for every past RESOURCE_ROLES growth (see
// PERMISSIONS_BADGES.md §4.2, and scripts/backfill-events-reports-roles.js
// for the precedent this mirrors).
//
// Idempotent: RoleResourceRole has a @@unique([roleId, resourceRole])
// constraint, so createMany + skipDuplicates is a no-op on re-run.
//
// Usage: node scripts/backfill-applications-roles.js

require("dotenv").config();
const { PrismaClient } = require(".prisma/site-client");

const BACKFILLS = {
  "super-admin": ["applications-view", "applications-edit", "applications-delete"],
};

const db = new PrismaClient();

async function main() {
  for (const [key, resourceRoles] of Object.entries(BACKFILLS)) {
    const role = await db.role.findUnique({ where: { key } });
    if (!role) {
      console.warn(`[backfill] no Role with key "${key}" found — skipping (has seedBuiltinRoles() run at least once?)`);
      continue;
    }

    const result = await db.roleResourceRole.createMany({
      data: resourceRoles.map((resourceRole) => ({ roleId: role.id, resourceRole })),
      skipDuplicates: true,
    });

    console.log(`[backfill] "${key}": granted ${result.count} new resource-role(s), ${resourceRoles.length - result.count} already present.`);
  }
}

main()
  .catch((err) => {
    console.error("[backfill] FAILED:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
