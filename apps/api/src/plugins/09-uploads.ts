import fp from "fastify-plugin";
import multipart from "@fastify/multipart";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { db } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import type { AccessPayload } from "@formkit/types";
import {
    ensureUploadDir,
    resolveUploadPath,
    MAX_UPLOAD_SIZE_BYTES,
    ALLOWED_UPLOAD_MIME_TYPES,
} from "@formkit/utils";
import { getResponseFileForDownload } from "@formkit/services";

const TRPC_ERROR_STATUS: Record<string, number> = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    PAYLOAD_TOO_LARGE: 413,
    UNSUPPORTED_MEDIA_TYPE: 415,
    INTERNAL_SERVER_ERROR: 500,
};

/**
 * Response file uploads: plain REST routes rather than tRPC procedures,
 * since file streaming (both directions) doesn't fit tRPC's JSON transport.
 * Files are stored on local disk (see @formkit/utils/helpers/uploads) — no
 * cloud storage account exists for this project, so this keeps the feature
 * fully self-contained rather than requiring new external infrastructure.
 */
export default fp(async (app: FastifyInstance) => {
    ensureUploadDir();

    await app.register(multipart, {
        limits: { fileSize: MAX_UPLOAD_SIZE_BYTES, files: 1 },
    });

    // Public — scoped to a real published form so this can't be used as an
    // open, unaccountable file-drop endpoint.
    app.post<{ Params: { slug: string } }>("/public/forms/:slug/uploads", async (request, reply) => {
        const { slug } = request.params;

        const form = await db.query.forms.findFirst({
            where: { slug, status: "published" },
            columns: { id: true },
        });
        if (!form) {
            return reply.status(404).send({ message: "This form isn't available." });
        }

        const file = await request.file();
        if (!file) {
            return reply.status(400).send({ message: "No file was uploaded." });
        }

        if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
            // Drain the stream so the connection can close cleanly.
            await file.toBuffer().catch(() => undefined);
            return reply.status(415).send({ message: `Files of type "${file.mimetype}" aren't supported.` });
        }

        const id = crypto.randomUUID();
        try {
            await pipeline(file.file, fs.createWriteStream(resolveUploadPath(id)));
        } catch {
            return reply.status(500).send({ message: "Couldn't save the uploaded file." });
        }

        if (file.file.truncated) {
            await fs.promises.unlink(resolveUploadPath(id)).catch(() => undefined);
            return reply.status(413).send({ message: "File is too large (10MB max)." });
        }

        return reply.send({
            id,
            filename: file.filename,
            mimeType: file.mimetype,
            size: file.file.bytesRead,
        });
    });

    // Authenticated — same org/team/response:view authorization the
    // Responses page itself uses (see getResponseFileForDownload).
    app.get<{ Params: { formId: string; responseId: string; fieldId: string } }>(
        "/forms/:formId/responses/:responseId/files/:fieldId",
        { preHandler: [app.authenticate] },
        async (request, reply) => {
            const orgId = request.headers["x-org-id"] as string | undefined;
            if (!orgId) {
                return reply.status(400).send({ message: "Missing org context" });
            }

            const { formId, responseId, fieldId } = request.params;
            const user = request.user as unknown as AccessPayload;

            try {
                const file = await getResponseFileForDownload(orgId, user.sub, formId, responseId, fieldId);
                reply.header("Content-Disposition", `attachment; filename="${encodeURIComponent(file.filename)}"`);
                reply.type(file.mimeType);
                return reply.send(fs.createReadStream(file.path));
            } catch (err) {
                if (err instanceof TRPCError) {
                    return reply.status(TRPC_ERROR_STATUS[err.code] ?? 500).send({ message: err.message });
                }
                throw err;
            }
        },
    );
});
