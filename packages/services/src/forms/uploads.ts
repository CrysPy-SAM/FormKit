import fs from "node:fs";
import { db, sql, responseAnswers } from "@formkit/db";
import { PERMISSIONS } from "@formkit/config";
import { TRPCError } from "@trpc/server";
import { resolveUploadPath, uploadFileExists, UPLOAD_ROOT } from "@formkit/utils";

type StoredFileValue = { id?: string; filename?: string; mimeType?: string };

/**
 * Authorizes and resolves a response's uploaded file for download. This is
 * called from a plain Fastify route (not a tRPC procedure — file streaming
 * doesn't fit tRPC's JSON transport), so it replicates the same
 * org/team-membership + response:view permission check the tRPC
 * `hasPermission`/`getFormResponses` path already enforces, rather than
 * relying on router-level middleware that doesn't apply here.
 */
export async function getResponseFileForDownload(
    orgId: string,
    userId: string,
    formId: string,
    responseId: string,
    fieldId: string,
) {
    const membership = await db.query.memberships.findFirst({
        where: { userId, orgId },
        with: { role: { with: { rolePermissions: { with: { permission: true } } } } },
    });
    if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this org" });
    }
    if (!membership.role) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Membership missing role" });
    }

    const hasResponseView = membership.role.rolePermissions.some(
        (rp) => rp.permission?.key === PERMISSIONS.RESPONSE_VIEW,
    );
    if (!hasResponseView) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Missing permission: response:view" });
    }

    const form = await db.query.forms.findFirst({ where: { id: formId, orgId } });
    if (!form) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    const hasOrgWideAccess = membership.role.rolePermissions.some(
        (rp) => rp.permission?.key === PERMISSIONS.ORG_MANAGE_ALL_TEAMS,
    );
    if (!hasOrgWideAccess && form.teamId !== null) {
        const teamMembership = await db.query.memberships.findFirst({
            where: { userId, orgId, teamId: form.teamId },
        });
        if (!teamMembership) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You're not a member of this team" });
        }
    }

    const response = await db.query.responses.findFirst({ where: { id: responseId, formId } });
    if (!response) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Response not found" });
    }

    const answer = await db.query.responseAnswers.findFirst({ where: { responseId, fieldId } });
    const value = answer?.value as StoredFileValue | null | undefined;
    if (!value?.id || !uploadFileExists(value.id)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
    }

    return {
        path: resolveUploadPath(value.id),
        filename: value.filename ?? "download",
        mimeType: value.mimeType ?? "application/octet-stream",
    };
}

/**
 * Sweeps UPLOAD_ROOT on local disk and deletes unreferenced uploads older than maxAgeMs (default 24h).
 * Prevents storage exhaustion from abandoned file uploads.
 */
export async function cleanOrphanUploads(maxAgeMs = 24 * 60 * 60 * 1000) {
    if (!fs.existsSync(UPLOAD_ROOT)) return { deleted: 0 };

    const files = await fs.promises.readdir(UPLOAD_ROOT);
    const now = Date.now();
    let deleted = 0;

    for (const filename of files) {
        if (!/^[0-9a-f-]{36}$/i.test(filename)) continue;
        const filePath = resolveUploadPath(filename);
        try {
            const stat = await fs.promises.stat(filePath);
            if (now - stat.mtimeMs > maxAgeMs) {
                const [linked] = await db
                    .select({ id: responseAnswers.id })
                    .from(responseAnswers)
                    .where(sql`value->>'id' = ${filename}`)
                    .limit(1);
                if (!linked) {
                    await fs.promises.unlink(filePath).catch(() => undefined);
                    deleted++;
                }
            }
        } catch {
            // Ignore individual file errors
        }
    }

    return { deleted };
}
