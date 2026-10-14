/** Triggers a browser save for in-memory content (a client-generated CSV/PDF,
 * or a fetched Blob) via a throwaway object URL + synthetic click — the
 * standard way to force a download without navigating the page. */
export function downloadBlob(content: BlobPart | Blob, mimeType: string, filename: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
