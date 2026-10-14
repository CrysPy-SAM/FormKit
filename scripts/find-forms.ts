import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// apps/web/.env is the source of truth for DATABASE_URL. The db package's
// env.ts validates process.env at import time, so this has to run *before* the
// dynamic import below (dotenv never overrides an already-set variable, and
// `import "dotenv/config"` in packages/database/src/index.ts would otherwise
// load the root .env instead).
for (const line of readFileSync(resolve(here, "../apps/web/.env"), "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
}

// Imported by relative path rather than "@formkit/db": the workspace package is
// not linked into the root node_modules.
const { db, forms, eq, and, isNull } = await import("../packages/database/src/index.js");

const published = await db
    .select({ slug: forms.slug, title: forms.title })
    .from(forms)
    .where(and(eq(forms.status, "published"), isNull(forms.deletedAt)))
    .orderBy(forms.slug);

for (const form of published) {
    console.log(`${form.slug}\t${form.title}`);
}

process.exit(0);
