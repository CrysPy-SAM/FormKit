import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// Same env bootstrap as find-forms.ts: apps/web/.env is the source of truth for
// DATABASE_URL, and it has to run *before* the dynamic import below because
// packages/database/src/env.ts validates process.env at import time.
for (const line of readFileSync(resolve(here, "../apps/web/.env"), "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
}

// Imported by relative path rather than "@formkit/db": the workspace package is
// not linked into the root node_modules.
const { db, forms, formFields, eq, sql } = await import("../packages/database/src/index.js");

// No status filter and no deletedAt filter — this is meant to show every row in
// the table. Soft-deleted forms are flagged instead of hidden so a form that
// "disappeared" from the app can still be identified here.
const rows = await db
    .select({
        id: forms.id,
        slug: forms.slug,
        title: forms.title,
        status: forms.status,
        settings: forms.settings,
        publishedSnapshot: forms.publishedSnapshot,
        deletedAt: forms.deletedAt,
        fieldCount: sql<number>`count(${formFields.id})::int`,
    })
    .from(forms)
    .leftJoin(formFields, eq(formFields.formId, forms.id))
    // forms.id is the primary key, so Postgres resolves the rest of the selected
    // forms.* columns as functionally dependent on it.
    .groupBy(forms.id)
    .orderBy(forms.slug);

console.log(`${rows.length} form(s)\n`);

for (const form of rows) {
    const settings = form.settings ?? {};

    console.log(`id:                  ${form.id}`);
    console.log(`slug:                ${form.slug}`);
    console.log(`title:               ${form.title}`);
    console.log(`status:              ${form.status}`);
    console.log(`publishedSnapshot:   ${form.publishedSnapshot === null ? "no" : "yes"}`);
    console.log(`closeAt:             ${settings.closeAt ?? "(not set)"}`);
    console.log(`closeAfterResponses: ${settings.closeAfterResponses ?? "(not set)"}`);
    console.log(`settings:            ${JSON.stringify(settings)}`);
    console.log(`fieldCount:          ${form.fieldCount}`);
    if (form.deletedAt !== null) console.log(`deletedAt:           ${form.deletedAt}`);
    console.log("");
}

process.exit(0);