import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { RouterOutputs } from "@formkit/trpc/client";
import { formatDateTime } from "./format";
import { downloadBlob } from "./download-blob";

type FormResponses = RouterOutputs["forms"]["responses"];
type ResponseAnswer = FormResponses["responses"][number]["answers"][number];

/** Column order follows first-seen answer order across all responses, so it
 * naturally adapts to optional/conditionally-hidden fields without needing
 * the full field list the Responses query doesn't expose. */
function buildColumns(data: FormResponses): { fieldId: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const response of data.responses) {
    for (const answer of response.answers) {
      if (!seen.has(answer.fieldId)) seen.set(answer.fieldId, answer.label);
    }
  }
  return Array.from(seen.entries()).map(([fieldId, label]) => ({ fieldId, label }));
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.join(", ");
  // file_upload answers are {id, filename, size, mimeType} — export the
  // filename (downloading the file itself needs the authenticated app, not
  // a static export). Same shape check the Responses page uses.
  if (typeof value === "object" && "filename" in value && typeof value.filename === "string") {
    return value.filename;
  }
  return String(value);
}

function buildRows(data: FormResponses, columns: { fieldId: string; label: string }[]): string[][] {
  return data.responses.map((response) => {
    const byField = new Map<string, unknown>(response.answers.map((a: ResponseAnswer) => [a.fieldId, a.value]));
    return [
      response.completedAt ? formatDateTime(response.completedAt) : "In progress",
      response.respondentEmail ?? "",
      ...columns.map((c) => formatValue(byField.get(c.fieldId))),
    ];
  });
}

function safeFilename(title: string): string {
  const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "form";
}

function csvEscape(value: string): string {
  // Neutralize CSV Formula Injection (CWE-1236) by quoting leading formula triggers
  let sanitized = value;
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = `'${sanitized}`;
  }
  return /[",\n\r]/.test(sanitized) ? `"${sanitized.replace(/"/g, '""')}"` : sanitized;
}

export function exportResponsesAsCsv(data: FormResponses) {
  const columns = buildColumns(data);
  const header = ["Submitted", "Respondent email", ...columns.map((c) => c.label)];
  const rows = buildRows(data, columns);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  // Leading BOM so Excel opens UTF-8 content (accented names, emoji answers, etc.) correctly.
  downloadBlob("﻿" + csv, "text/csv;charset=utf-8", `${safeFilename(data.formTitle)}-responses.csv`);
}

export function exportResponsesAsPdf(data: FormResponses) {
  const columns = buildColumns(data);
  const head = [["Submitted", "Respondent email", ...columns.map((c) => c.label)]];
  const body = buildRows(data, columns);

  const doc = new jsPDF({ orientation: columns.length > 3 ? "landscape" : "portrait", unit: "pt" });

  doc.setFontSize(16);
  doc.text(data.formTitle, 40, 40);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    `${data.total} ${data.total === 1 ? "response" : "responses"} · exported ${formatDateTime(new Date().toISOString())}`,
    40,
    58,
  );

  autoTable(doc, {
    head,
    body,
    startY: 75,
    styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak" },
    headStyles: { fillColor: [67, 56, 202] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${safeFilename(data.formTitle)}-responses.pdf`);
}
