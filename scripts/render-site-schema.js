#!/usr/bin/env node
// Renders src/prisma/site/schema.prisma from schema.prisma.template,
// substituting {{PREFIX}} with SITE_DB_TABLE_PREFIX. Prisma's @@map can't
// reference an env var directly, so this is the only way to make the
// table prefix configurable without hand-editing the schema.
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const templatePath = path.join(__dirname, "..", "src/prisma/site/schema.prisma.template");
const outputPath = path.join(__dirname, "..", "src/prisma/site/schema.prisma");

const prefix = process.env.SITE_DB_TABLE_PREFIX ?? "";
const template = fs.readFileSync(templatePath, "utf8");
const rendered = template.split("{{PREFIX}}").join(prefix);

fs.writeFileSync(outputPath, rendered);
console.log(`[render-site-schema] wrote ${outputPath} (prefix: "${prefix}")`);
