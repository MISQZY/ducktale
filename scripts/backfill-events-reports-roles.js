#!/usr/bin/env node
// One-off backfill for two built-in Roles after RESOURCE_ROLES grew new
// entries for the events/reports features (events-view/-edit/-delete,
// events-page-view, reports-view/-edit/-delete — see
// src/config/resource-roles.ts). seedBuiltinRoles() (src/lib/roles.ts) never
// overwrites an existing Role row, so the DB's existing "super-admin" and
// "guest" rows won't pick these up on their own — same situation documented
// for every past RESOURCE_ROLES growth (see PERMISSIONS_BADGES.md §4.2).
// This script grants exactly the new resource-roles to those two rows,
// matching BUILTIN_ROLE_DEFINITIONS (src/config/roles.ts).
//
// Idempotent: RoleResourceRole has a @@unique([roleId, resourceRole])
// constraint, so createMany + skipDuplicates is a no-op on re-run (including
// against resource-roles a previous run of this same script already granted).
//
// Usage: node scripts/backfill-events-reports-roles.js

require("dotenv").config();
const { PrismaClient } = require(".prisma/site-client");

const BACKFILLS = {
  "super-admin": ["events-view", "events-edit", "events-delete", "events-page-view", "reports-view", "reports-edit", "reports-delete"],
  guest: ["events-page-view"],
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
