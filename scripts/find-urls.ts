/**
 * Standalone probe: find published forms whose stored settings contain any
 * theme/image URL (logoUrl, backgroundImage, ...).
 *
 * Run:
 *   packages\database\node_modules\.bin\tsx.CMD find-urls.ts
 *
 * Notes on how it is wired:
 *  - The connection string is read from apps/web/.env (DATABASE_URL) rather than
 *    the process env, so it works from a bare shell.
 *  - This file lives at the monorepo root, and pnpm's isolated node_modules
 *    means `pg` is NOT resolvable from here — it only exists under
 *    packages/database/node_modules. So `pg` is pulled in with createRequire
 *    anchored at the database package instead of a static import.
 *  - The URL search is done with a recursive jsonb walk in SQL rather than a
 *    jsonpath/regex match on the raw text, so a URL nested at any depth is
 *    found and the JSON path of each hit is reported.
 */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DB_PACKAGE = join(REPO_ROOT, "packages", "database");

const require_ = createRequire(join(DB_PACKAGE, "package.json"));
const { Pool } = require_("pg") as typeof import("pg");

function readEnvFile(path: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        out[key] = value;
    }
    return out;
}

/**
 * Pulls every non-object/non-array leaf out of the live `settings` blob and the
 * `published_snapshot.settings` copy, tagged with which one it came from and the
 * full JSON path to it.
 */
const URLS_SQL = `
WITH RECURSIVE walk AS (
    SELECT
        f.id::text  AS form_id,
        f.slug,
        f.title,
        f.published_at,
        'live'::text AS source,
        '$'::text    AS path,
        NULL::text   AS key,
        COALESCE(f.settings, '{}'::jsonb) AS node
    FROM forms f
    WHERE f.status = 'published' AND f.deleted_at IS NULL

    UNION ALL

    SELECT
        f.id::text  AS form_id,
        f.slug,
        f.title,
        f.published_at,
        'snapshot'::text AS source,
        '$.published_snapshot.settings'::text AS path,
        NULL::text   AS key,
        COALESCE(f.published_snapshot -> 'settings', '{}'::jsonb) AS node
    FROM forms f
    WHERE f.status = 'published' AND f.deleted_at IS NULL

    UNION ALL

    SELECT
        w.form_id,
        w.slug,
        w.title,
        w.published_at,
        w.source,
        w.path || '.' || c.child_key,
        c.child_key,
        c.child_val
    FROM walk w
    CROSS JOIN LATERAL (
        SELECT e.key AS child_key, e.value AS child_val
        FROM jsonb_each(
            CASE WHEN jsonb_typeof(w.node) = 'object' THEN w.node ELSE '{}'::jsonb END
        ) AS e(key, value)
        UNION ALL
        SELECT a.ord::text, a.elem
        FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(w.node) = 'array' THEN w.node ELSE '[]'::jsonb END
        ) WITH ORDINALITY AS a(elem, ord)
    ) c
)
SELECT
    form_id,
    slug,
    title,
    published_at,
    source,
    path,
    key,
    CASE WHEN jsonb_typeof(node) = 'string' THEN node #>> '{}' ELSE node::text END AS value
FROM walk
WHERE node IS NOT NULL
  AND jsonb_typeof(node) NOT IN ('object', 'array')
  AND node <> 'null'::jsonb
`;

// A key that names an image/asset/url slot, or a value that is plainly a URL.
// `font` is only matched as fontSrc/fontFile/fontFace — a bare `font` also
// hits the legitimate `fontFamily: "sans"` theme value, which is not a URL.
const URLISH_KEY =
    /(url|uri|image|img|logo|icon|banner|cover|avatar|photo|thumbnail|media|asset|font(_|-)?(src|file|face))/i;
const URLISH_VALUE = /^(https?:\/\/|\/\/|data:image\/|\.\/|\/)/i;

type Row = {
    form_id: string;
    slug: string;
    title: string;
    published_at: Date | null;
    source: string;
    path: string;
    key: string | null;
    value: string;
};

async function main() {
    const envPath = resolve(REPO_ROOT, "apps", "web", ".env");
    const connectionString =
        process.env.DATABASE_URL || readEnvFile(envPath).DATABASE_URL;
    if (!connectionString) throw new Error(`No DATABASE_URL in ${envPath}`);

    const pool = new Pool({ connectionString });
    try {
        const { rows } = await pool.query<Row>(URLS_SQL);

        const byForm = new Map<string, { slug: string; title: string; hits: Row[] }>();
        for (const row of rows) {
            if (row.value === "") continue;
            const keyish = row.key ? URLISH_KEY.test(row.key) : false;
            const valueish = URLISH_VALUE.test(row.value);
            if (!keyish && !valueish) continue;

            if (!byForm.has(row.form_id)) {
                byForm.set(row.form_id, { slug: row.slug, title: row.title, hits: [] });
            }
            byForm.get(row.form_id)!.hits.push(row);
        }

        const results = [...byForm.values()];
        console.log(JSON.stringify(results, null, 2));
        console.error(`\n${results.length} of the published forms carry URL settings.`);
    } finally {
        await pool.end();
    }
}

main().catch((err) => {
    console.error("find-urls failed:", err);
    process.exit(1);
});
