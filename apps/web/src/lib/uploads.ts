import { getApiOrigin } from "./api-url";
import { getActiveOrgIdClient } from "./org-cookie";
import { downloadBlob } from "./download-blob";

export type UploadedFile = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
};

// Mirrors packages/utils/src/helpers/uploads.ts — kept in sync manually
// since the web app doesn't depend on that package. Used only for a fast
// client-side check; the server re-validates independently and is the
// actual source of truth.
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_UPLOAD_EXTENSIONS =
  ".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.zip";

export async function uploadResponseFile(slug: string, file: File): Promise<UploadedFile> {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("File is too large (10MB max).");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${getApiOrigin()}/public/forms/${slug}/uploads`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? "Couldn't upload the file");
  }

  return res.json();
}

export async function downloadResponseFile(formId: string, responseId: string, fieldId: string) {
  const orgId = getActiveOrgIdClient();
  const headers = new Headers();
  if (orgId) headers.set("x-org-id", orgId);

  const res = await fetch(`${getApiOrigin()}/forms/${formId}/responses/${responseId}/files/${fieldId}`, {
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? "Couldn't download the file");
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match ? decodeURIComponent(match[1]!) : "download";

  downloadBlob(blob, blob.type, filename);
}
