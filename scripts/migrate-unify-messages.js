#!/usr/bin/env node
// One-off data migration for the TicketMessage/ThreadMessage/TicketAttachment
// -> Message/MessageAttachment schema unification (see the Message model's
// doc comment in src/prisma/site/schema.prisma.template).
//
// Run this BEFORE `npm run site-db:push` / `prisma db push` picks up the new
// schema — db push would otherwise see {prefix}ticket_message/
// {prefix}thread_message/{prefix}ticket_attachment as orphaned tables (no
// longer represented by any model) and refuse (or, with
// --accept-data-loss, actually drop them) instead of preserving the
// existing ticket/thread history.
//
// Idempotent: current state (which tables/columns already exist) is read
// ONCE up front, before any statement runs, and every subsequent step is
// gated on that snapshot — so re-running after a partial failure just
// re-checks real state fresh and skips whatever already landed. MySQL DDL
// auto-commits per statement (no multi-statement DDL transaction), which is
// exactly why steps are individually guarded rather than relying on one
// rollback-able transaction.
//
// Usage: node scripts/migrate-unify-messages.js [--dry-run]

require("dotenv").config();
const { PrismaClient } = require(".prisma/site-client");

const prefix = process.env.SITE_DB_TABLE_PREFIX ?? "";
const dryRun = process.argv.includes("--dry-run");

const T = {
  ticketMessage: `\`${prefix}ticket_message\``,
  threadMessage: `\`${prefix}thread_message\``,
  ticketAttachment: `\`${prefix}ticket_attachment\``,
  message: `\`${prefix}message\``,
  messageAttachment: `\`${prefix}message_attachment\``,
  thread: `\`${prefix}thread\``,
};

const db = new PrismaClient();

async function tableExists(name) {
  const rows = await db.$queryRawUnsafe(
    `SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
    name
  );
  return Number(rows[0].cnt) > 0;
}

async function columnInfo(table, column) {
  const rows = await db.$queryRawUnsafe(
    `SELECT is_nullable AS nullable FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    table,
    column
  );
  return rows[0] ?? null;
}

async function rowCount(tableIdent) {
  const rows = await db.$queryRawUnsafe(`SELECT COUNT(*) AS cnt FROM ${tableIdent}`);
  return Number(rows[0].cnt);
}

async function run(label, sql) {
  console.log(`[migrate] ${label}${dryRun ? " (dry-run, not executed)" : ""}`);
  console.log(`  ${sql}`);
  if (!dryRun) await db.$executeRawUnsafe(sql);
}

async function main() {
  console.log(`[migrate] table prefix: "${prefix}"${dryRun ? " — DRY RUN, no statements will be executed" : ""}`);

  const ticketMessageTable = `${prefix}ticket_message`;
  const messageTable = `${prefix}message`;
  const ticketAttachmentTable = `${prefix}ticket_attachment`;
  const messageAttachmentTable = `${prefix}message_attachment`;
  const threadMessageTable = `${prefix}thread_message`;

  // Snapshot real current state up front — every step below branches on
  // this, not on live re-queries mid-script, so dry-run output reflects one
  // consistent "before" picture instead of querying tables earlier steps
  // (which didn't actually run) were supposed to have created.
  const state = {
    messageExists: await tableExists(messageTable),
    ticketMessageExists: await tableExists(ticketMessageTable),
    messageAttachmentExists: await tableExists(messageAttachmentTable),
    ticketAttachmentExists: await tableExists(ticketAttachmentTable),
    threadMessageExists: await tableExists(threadMessageTable),
  };
  if (state.messageExists) {
    state.threadIdColExists = !!(await columnInfo(messageTable, "threadId"));
    state.typeColExists = !!(await columnInfo(messageTable, "type"));
    const ticketIdCol = await columnInfo(messageTable, "ticketId");
    state.ticketIdNullable = ticketIdCol?.nullable === "YES";
    state.threadOriginatedRows = state.threadIdColExists
      ? await db.$queryRawUnsafe(`SELECT COUNT(*) AS cnt FROM ${T.message} WHERE threadId IS NOT NULL`).then((r) => Number(r[0].cnt))
      : 0;
  }
  if (state.messageAttachmentExists) {
    state.messageIdColExists = !!(await columnInfo(messageAttachmentTable, "messageId"));
  }

  // Step 1: rename ticket_message -> message. A pure rename (no data
  // touched), so this is the safest possible first step.
  if (!state.messageExists && state.ticketMessageExists) {
    await run("renaming ticket_message -> message", `RENAME TABLE ${T.ticketMessage} TO ${T.message}`);
  } else if (state.messageExists) {
    console.log("[migrate] message table already exists — skipping rename");
  } else {
    throw new Error(`Neither ${ticketMessageTable} nor ${messageTable} exists — nothing to migrate from`);
  }

  // Step 2: add threadId (nullable — only set for rows migrated from
  // thread_message below) + its FK + index.
  if (!state.messageExists || !state.threadIdColExists) {
    await run("adding message.threadId", `ALTER TABLE ${T.message} ADD COLUMN threadId VARCHAR(191) NULL AFTER ticketId`);
    await run(
      "adding message.threadId foreign key",
      `ALTER TABLE ${T.message} ADD CONSTRAINT \`${prefix}message_threadId_fkey\` FOREIGN KEY (threadId) REFERENCES ${T.thread}(id) ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await run("adding message.threadId index", `ALTER TABLE ${T.message} ADD INDEX \`${prefix}message_threadId_idx\` (threadId)`);
  } else {
    console.log("[migrate] message.threadId already exists — skipping");
  }

  // Step 3: add type (MESSAGE default — existing ticket-message rows have no
  // prior concept of an event marker, so MESSAGE is correct for all of them).
  if (!state.messageExists || !state.typeColExists) {
    await run(
      "adding message.type",
      `ALTER TABLE ${T.message} ADD COLUMN type ENUM('MESSAGE','CLOSED','REOPENED') NOT NULL DEFAULT 'MESSAGE' AFTER authorId`
    );
  } else {
    console.log("[migrate] message.type already exists — skipping");
  }

  // Step 4: ticketId must become nullable (thread-originated rows have it
  // NULL).
  if (!state.messageExists || !state.ticketIdNullable) {
    await run("making message.ticketId nullable", `ALTER TABLE ${T.message} MODIFY COLUMN ticketId VARCHAR(191) NULL`);
  } else {
    console.log("[migrate] message.ticketId already nullable — skipping");
  }

  // Step 5: rename ticket_attachment -> message_attachment, then its FK
  // column. CHANGE COLUMN (not the MySQL-8.0.3+-only RENAME COLUMN) for
  // broad MySQL/MariaDB version compatibility — VARCHAR(191) matches
  // Prisma's default mapping for a plain (non-@db.VarChar-annotated) String
  // field, same as every other id/FK column in this schema.
  if (!state.messageAttachmentExists && state.ticketAttachmentExists) {
    await run("renaming ticket_attachment -> message_attachment", `RENAME TABLE ${T.ticketAttachment} TO ${T.messageAttachment}`);
  } else if (state.messageAttachmentExists) {
    console.log("[migrate] message_attachment table already exists — skipping rename");
  } else {
    throw new Error(`Neither ${ticketAttachmentTable} nor ${messageAttachmentTable} exists — nothing to migrate from`);
  }
  if (!state.messageAttachmentExists || !state.messageIdColExists) {
    await run(
      "renaming message_attachment.ticketMessageId -> messageId",
      `ALTER TABLE ${T.messageAttachment} CHANGE COLUMN ticketMessageId messageId VARCHAR(191) NOT NULL`
    );
  } else {
    console.log("[migrate] message_attachment.messageId already exists — skipping");
  }

  // Step 6: copy thread_message rows into the unified table, then drop the
  // now-redundant source table.
  if (state.threadMessageExists) {
    const sourceCount = await rowCount(T.threadMessage);
    if ((state.threadOriginatedRows ?? 0) === 0 && sourceCount > 0) {
      await run(
        `copying ${sourceCount} thread_message row(s) into message`,
        `INSERT INTO ${T.message} (id, ticketId, threadId, authorId, type, isAdminReply, body, createdAt)
         SELECT id, NULL, threadId, authorId, type, 0, body, createdAt FROM ${T.threadMessage}`
      );
    } else if ((state.threadOriginatedRows ?? 0) > 0) {
      console.log(`[migrate] message already has ${state.threadOriginatedRows} thread-originated row(s) — skipping copy`);
    } else {
      console.log("[migrate] thread_message is empty — nothing to copy");
    }
    await run("dropping thread_message (data now in message)", `DROP TABLE ${T.threadMessage}`);
  } else {
    console.log("[migrate] thread_message already gone — skipping copy/drop");
  }

  console.log("[migrate] done. Next: run `npm run site-db:push` to let Prisma reconcile any naming-convention-only");
  console.log("[migrate] differences (constraint/index names) against the new schema — should be a no-op for data.");
}

main()
  .catch((err) => {
    console.error("[migrate] FAILED:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
