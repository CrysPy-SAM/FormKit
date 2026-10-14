import fs from "node:fs";
import path from "node:path";
import { env } from "../env.js";

/**
 * Local-disk storage for response file uploads — no cloud storage account
 * exists for this project, so files are written under UPLOAD_DIR (resolved
 * against the API process's cwd) named only by their generated id (no
 * extension, so lookups never need to glob-match). The original filename and
 * mime type travel alongside as plain metadata in `response_answers.value`
 * (jsonb) — reusing that existing column rather than adding a files table.
 */
export const UPLOAD_ROOT = path.resolve(env.UPLOAD_DIR);

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
]);

export function ensureUploadDir() {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

export function resolveUploadPath(id: string): string {
    return path.join(UPLOAD_ROOT, id);
}

export function uploadFileExists(id: string): boolean {
    // Guard against path traversal — id must be exactly what the app itself
    // generates (crypto.randomUUID()), never a path segment from the client.
    if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
    return fs.existsSync(resolveUploadPath(id));
}
