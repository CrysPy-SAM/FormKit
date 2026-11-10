import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, "../FormKit_Interview_Guide.pdf");

// Create document with margins
const doc = new PDFDocument({
  size: "A4",
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true,
  autoFirstPage: true,
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Colors
const PRIMARY = "#4F46E5"; // Indigo 600
const PRIMARY_DARK = "#3730A3"; // Indigo 800
const SECONDARY = "#0F172A"; // Slate 900
const MUTED = "#64748B"; // Slate 500
const TEXT = "#1E293B"; // Slate 800
const BG_CARD = "#F8FAFC"; // Slate 50
const BORDER_CARD = "#E2E8F0"; // Slate 200
const ACCENT_GREEN = "#059669"; // Emerald 600
const ACCENT_AMBER = "#D97706"; // Amber 600

const pageWidth = 595.28;
const pageHeight = 841.89;
const contentWidth = pageWidth - 100; // 495.28 pt

// Helper: Check space and add page if needed
function ensureSpace(neededHeight) {
  if (doc.y + neededHeight > pageHeight - 60) {
    doc.addPage();
    drawHeader();
  }
}

function drawHeader() {
  doc.save();
  doc.fontSize(8).fillColor(MUTED).font("Helvetica");
  doc.text("FormKit — Project Architecture & Interview Master Guide", 50, 25, {
    width: contentWidth,
    align: "right",
  });
  doc.strokeColor(BORDER_CARD).lineWidth(0.5).moveTo(50, 38).lineTo(545, 38).stroke();
  doc.restore();
  doc.y = 50;
}

// Helper: Section Title
function addSectionHeader(title, subtitle) {
  ensureSpace(subtitle ? 55 : 40);
  doc.moveDown(0.8);
  const startY = doc.y;

  // Accent bar
  doc.rect(50, startY + 2, 4, 18).fill(PRIMARY);

  doc
    .fontSize(15)
    .fillColor(SECONDARY)
    .font("Helvetica-Bold")
    .text(title, 62, startY);

  if (subtitle) {
    doc
      .fontSize(9)
      .fillColor(MUTED)
      .font("Helvetica-Oblique")
      .text(subtitle, 62, doc.y + 2);
  }

  doc.moveDown(0.6);
}

// Helper: Subsection Title
function addSubHeader(title) {
  ensureSpace(30);
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor(PRIMARY_DARK).font("Helvetica-Bold").text(title, 50, doc.y);
  doc.moveDown(0.3);
}

// Helper: Paragraph Text
function addParagraph(text, options = {}) {
  ensureSpace(25);
  doc
    .fontSize(9.5)
    .fillColor(TEXT)
    .font(options.bold ? "Helvetica-Bold" : options.italic ? "Helvetica-Oblique" : "Helvetica")
    .text(text, {
      width: contentWidth,
      lineGap: 3,
      align: options.align || "left",
      ...options,
    });
  doc.moveDown(0.4);
}

// Helper: Bullet point
function addBullet(title, description) {
  ensureSpace(28);
  const bulletX = 55;
  const textX = 70;
  const currentY = doc.y;

  doc.fontSize(9.5).fillColor(PRIMARY).font("Helvetica-Bold").text("•", bulletX, currentY);

  doc.fontSize(9.5).fillColor(SECONDARY).font("Helvetica-Bold").text(`${title}: `, textX, currentY, {
    continued: true,
    width: contentWidth - 20,
    lineGap: 2.5,
  });

  doc.fontSize(9.5).fillColor(TEXT).font("Helvetica").text(description, {
    lineGap: 2.5,
  });

  doc.moveDown(0.3);
}

// Helper: Info / Architecture Card
function addCard(title, items, accentColor = PRIMARY) {
  const estimatedHeight = 35 + items.length * 20;
  ensureSpace(estimatedHeight);

  const startY = doc.y;
  const startX = 50;

  // Draw card background
  doc
    .roundedRect(startX, startY, contentWidth, estimatedHeight, 6)
    .fillAndStroke(BG_CARD, BORDER_CARD);

  // Left accent line
  doc.roundedRect(startX, startY, 4, estimatedHeight, 2).fill(accentColor);

  // Title
  doc
    .fontSize(10.5)
    .fillColor(SECONDARY)
    .font("Helvetica-Bold")
    .text(title, startX + 16, startY + 10);

  let itemY = startY + 28;
  items.forEach((item) => {
    doc.fontSize(9).fillColor(accentColor).font("Helvetica-Bold").text("▸", startX + 16, itemY);
    doc
      .fontSize(9)
      .fillColor(SECONDARY)
      .font("Helvetica-Bold")
      .text(`${item.label}: `, startX + 28, itemY, { continued: true });
    doc.fontSize(9).fillColor(TEXT).font("Helvetica").text(item.value);
    itemY += 18;
  });

  doc.y = startY + estimatedHeight + 10;
}

// Helper: Q&A Block for Interview
function addQA(number, question, concept, answerBlocks) {
  ensureSpace(90);

  const startY = doc.y;
  doc
    .roundedRect(50, startY, contentWidth, 24, 4)
    .fillAndStroke(PRIMARY, PRIMARY);

  doc
    .fontSize(9.5)
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .text(`Q${number}: ${question}`, 58, startY + 6, { width: contentWidth - 16 });

  doc.y = startY + 30;

  // Concept tag
  doc
    .fontSize(8.5)
    .fillColor(PRIMARY_DARK)
    .font("Helvetica-Bold")
    .text(`Key Concepts: `, 50, doc.y, { continued: true });
  doc.fillColor(MUTED).font("Helvetica-Oblique").text(concept);
  doc.moveDown(0.4);

  // Answer sections (STAR or breakdown)
  answerBlocks.forEach((block) => {
    ensureSpace(35);
    if (block.label) {
      doc
        .fontSize(9)
        .fillColor(SECONDARY)
        .font("Helvetica-Bold")
        .text(`[${block.label}] `, 50, doc.y, { continued: true });
      doc.fillColor(TEXT).font("Helvetica").text(block.text, { lineGap: 2.5 });
    } else {
      doc.fontSize(9).fillColor(TEXT).font("Helvetica").text(block.text, { lineGap: 2.5 });
    }
    doc.moveDown(0.3);
  });

  doc.moveDown(0.5);
}

// ==========================================
// DOCUMENT GENERATION STARTS HERE
// ==========================================

// --- COVER HEADER ---
doc.rect(50, 45, contentWidth, 90).fill(PRIMARY_DARK);

doc
  .fontSize(22)
  .fillColor("#FFFFFF")
  .font("Helvetica-Bold")
  .text("FORMKIT", 65, 60, { characterSpacing: 1.5 });

doc
  .fontSize(12)
  .fillColor("#E0E7FF")
  .font("Helvetica")
  .text("Enterprise-Grade Full-Stack Conversational Form SaaS Platform", 65, 88);

doc
  .fontSize(9)
  .fillColor("#C7D2FE")
  .font("Helvetica-Oblique")
  .text("Comprehensive Architectural Blueprint, Technical Highlights & Interview Master Guide", 65, 106);

doc.y = 150;

// Metadata pills
doc
  .fontSize(8.5)
  .fillColor(MUTED)
  .font("Helvetica-Bold")
  .text("ARCHITECTURE: ", 50, doc.y, { continued: true })
  .fillColor(PRIMARY)
  .text("Turborepo Monorepo | Fastify | tRPC | Next.js 16 | PostgreSQL | BullMQ | Valkey/Redis", { continued: true })
  .fillColor(MUTED)
  .text("   •   UPDATED: 2026");

doc.moveDown(0.8);

// --- 1. ELEVATOR PITCH ---
addSectionHeader("1. Executive Summary & 30-Second Elevator Pitch", "How to introduce the project cleanly in the first 2 minutes of an interview");

addParagraph(
  "\"FormKit is an enterprise-grade, full-stack conversational form-building SaaS platform designed as a high-performance alternative to Typeform and Tally. It allows individuals and teams to visually build dynamic, logic-driven forms, publish them with immutable frozen snapshots, and collect structured responses with real-time analytics.\"",
  { bold: true, lineGap: 3.5 }
);

addParagraph(
  "Architecturally, it is engineered as a Turborepo + pnpm monorepo consisting of a Next.js 16 (React 19) frontend, an ultrafast Fastify 5 + tRPC v11 backend with automated OpenAPI REST spec generation, and an asynchronous BullMQ worker process backed by Redis/Valkey. It strictly implements the Transactional Outbox Pattern to guarantee 100% reliable email notifications and webhook dispatches without distributed dual-write failures, alongside a multi-tenant RBAC system with fine-grained role permissions."
);

addCard("Core Value Proposition Matrix", [
  { label: "Target Problem", value: "Traditional form builders suffer from accidental breaking changes when editing published forms, lack conversational UX, or fail under heavy submission spikes." },
  { label: "FormKit Solution", value: "Frozen Published Snapshots, Step-by-Step UX engine, Outbox Pattern with BullMQ worker, and dual tRPC + REST interfaces." },
  { label: "Engineering Grade", value: "Strict TypeScript end-to-end type safety, distributed rate-limiting, CSV injection defense, and DB-level pagination." },
]);

// --- 2. TECH STACK & MONOREPO STRUCTURE ---
addSectionHeader("2. Monorepo Blueprint & Technology Stack", "Turborepo structure enabling rapid code sharing and strict boundary enforcement");

addBullet("apps/web (Frontend)", "Next.js 16 (App Router), React 19, Tailwind CSS v4, @dnd-kit (drag & drop reordering), Radix UI primitives, Motion animations, TanStack Query v5, and @trpc/react-query.");
addBullet("apps/api (Backend API)", "Fastify 5 (high-throughput low-overhead HTTP engine), tRPC v11 router, trpc-to-openapi (Scalar UI documentation at /doc), @fastify/jwt (token versioning), and Redis distributed rate limiter.");
addBullet("apps/worker (Async Job Engine)", "BullMQ queue processors for background tasks (email dispatch, verification, password resets), 60-second Outbox Reconcile Sweeper, and Dead Letter Queue (DLQ).");
addBullet("packages/database", "PostgreSQL 16 managed via Drizzle ORM (type-safe queries, relational schemas, automated migrations, seed scripts).");
addBullet("packages/redis", "Valkey / Redis client with connection pooling, automatic retry strategies, and namespace caching utilities.");
addBullet("packages/services", "Domain business logic (Auth, Form Builder, Public Submissions, Workspace Teams, Response Exporting, Analytics).");
addBullet("packages/queue", "Outbox event dispatcher, BullMQ queue definitions, and job payload Zod contracts.");
addBullet("packages/config & types", "Centralized RBAC permissions enum (FORM_CREATE, RESPONSE_VIEW, etc.) and shared TypeScript types.");

// --- 3. ARCHITECTURAL HIGHLIGHTS ---
addSectionHeader("3. Deep-Dive Architectural Highlights (Interview Goldmines)", "These are the key systems engineering decisions you should proactively discuss");

addSubHeader("A. Transactional Outbox Pattern (Guaranteed At-Least-Once Delivery)");
addParagraph(
  "Problem: In standard architectures, when a form is published or a response is submitted, developers typically write to the database and then immediately trigger an email or queue job. If the Redis server is momentarily down or the network drops between DB commit and queue push, the event is permanently lost (Dual-Write Hazard)."
);
addParagraph(
  "Solution: FormKit writes the state change AND an event row into an outbox_events table within the same atomic PostgreSQL transaction. An asynchronous BullMQ worker and a 60-second reconcile polling sweep pick up pending events, dispatch them via Resend API, and mark them as published. If a worker crashes, the event remains pending in Postgres and is recovered on the next sweep without data loss."
);

addSubHeader("B. Published Snapshot Pattern (Zero-Downtime Form Immutability)");
addParagraph(
  "Problem: In typical CRUD apps, forms and questions are edited live in the database. If an owner modifies or reorders questions while respondents are actively filling out a form, submissions crash due to validation schema mismatches."
);
addParagraph(
  "Solution: When a form is published, FormKit captures a frozen JSON snapshot (publishedSnapshot) of all field configs, validation rules, ordering, and themes. Unauthenticated public visitors read exclusively from this immutable snapshot. Form owners can safely continue editing their draft fields without affecting active respondents. The public submission endpoint validates strictly against the frozen snapshot."
);

addSubHeader("C. Dual-API Surface: tRPC v11 + Scalar OpenAPI REST Documentation");
addParagraph(
  "FormKit defines its routers using tRPC, giving the Next.js frontend instantaneous compile-time type safety and autocomplete without code generation. Simultaneously, it attaches OpenAPI metadata to procedures using trpc-to-openapi, generating a live OpenAPI 3.0 specification served at /openapi.json and an interactive Scalar API reference at /doc for external consumers."
);

addSubHeader("D. Step-by-Step Conversational Form Engine & Visual Logic Map");
addParagraph(
  "The respondent interface renders questions one at a time with smooth directional motion transitions, keyboard shortcuts (Enter to advance, numbers for multi-choice), and automatic advance on single-select. A dedicated SVG directed node graph (form-logic-map.tsx) dynamically parses conditional skip logic rules (equals / not_equals) and renders a visual workflow of the respondent flow in real time."
);

// --- 4. SECURITY & DEFENSIVE PRACTICES ---
addSectionHeader("4. Security Engineering & Defensive Code Practices", "Concrete security vulnerabilities analyzed and patched in the codebase");

addBullet("CSV Formula Injection Neutralization (CWE-1236)", "In apps/web/src/lib/export-responses.ts, response answers exported to CSV are checked for dangerous leading formula trigger characters (=, +, -, @, \\t, \\r). These cells are sanitized by prepending a single quote ('), preventing remote code execution when opened in Microsoft Excel or Google Sheets.");

addBullet("Regular Expression Denial of Service (ReDoS) Defense", "User-configured field validation regexes in packages/services/src/forms/public.ts are guarded with a 250-character length constraint and compiled inside try-catch blocks to prevent malicious backtrack patterns from freezing the single-threaded Node.js event loop.");

addBullet("JWT Token Versioning (Server-Side Session Revocation)", "JWT access tokens are stateless (15m expiry) stored in HttpOnly signed cookies. To allow instant remote logout from all devices, the users table holds a tokenVersion integer. When a user requests logout-all, tokenVersion increments in Postgres, instantly invalidating all existing access and refresh tokens without requiring a stateful token blacklist.");

addBullet("Distributed Redis Rate Limiting", "Configured at the Fastify gateway level via @fastify/rate-limit backed by Valkey/Redis, enforcing 100 requests/minute per IP across horizontally scaled API replicas.");

addBullet("Local File Upload Protection & Orphan Sweeper", "Public uploads enforce strict MIME type whitelisting, a 10MB size ceiling, and UUID-based filenames to defeat directory traversal. An automated cleanup routine sweeps unlinked files older than 24 hours to prevent disk exhaustion attacks.");

// --- 5. PERFORMANCE & SCALABILITY ---
addSectionHeader("5. Performance & Scalability Engineering", "How the application handles high-concurrency loads and large datasets");

addCard("Scalability Benchmarks & Optimizations", [
  { label: "Database Pagination", value: "Replaced unbounded memory loads with SQL-level count(), limit (50 max 100), and offset to prevent Out-Of-Memory (OOM) crashes on 50,000+ responses." },
  { label: "Zero-Latency RBAC", value: "In-memory LRU permission cache with 5-minute TTL plus instant bypass for OWNER roles eliminates redundant role_permissions queries on every request." },
  { label: "Fastify vs Express", value: "Fastify provides 2-3x higher req/sec throughput due to internal schema compilation (fast-json-stringify) and find-my-way radix tree routing." },
  { label: "Asynchronous Offloading", value: "Emails, webhooks, and heavy background notifications are delegated to Redis-backed BullMQ workers with concurrency: 5 and DLQ retry." },
]);

// --- 6. TOP 10 INTERVIEW QUESTIONS & MODEL ANSWERS ---
addSectionHeader("6. Top Technical Interview Q&A (STAR Method)", "Word-for-word explanations to use when answering architectural and technical questions");

addQA(
  1,
  "Walk me through the high-level architecture of FormKit.",
  "Monorepo, Fastify, tRPC, PostgreSQL, BullMQ, Next.js",
  [
    { label: "Situation", text: "I wanted to build an end-to-end type-safe, multi-tenant form builder that could handle real-time editing, conversational UX, and reliable background jobs." },
    { label: "Task", text: "I needed a unified codebase with shared types between frontend and backend while maintaining clean process isolation between the HTTP API and worker processors." },
    { label: "Action", text: "I architected a Turborepo monorepo with 3 apps (web, api, worker) and 10 shared packages. I selected Fastify for its high throughput and paired it with tRPC for full type safety. For the database, I chose PostgreSQL with Drizzle ORM and backed asynchronous jobs with BullMQ and Valkey/Redis." },
    { label: "Result", text: "The app compiles in milliseconds, prevents dual-write failures via the Outbox Pattern, and generates both tRPC client bindings and OpenAPI documentation from a single source of truth." }
  ]
);

addQA(
  2,
  "What is the Transactional Outbox Pattern and why did you implement it?",
  "Distributed Systems, Dual-Write Hazard, Eventual Consistency, BullMQ",
  [
    { label: "Situation", text: "When a user submits a form or signs up, we need to send transactional emails and notify workspace owners. Writing to Postgres and immediately calling an email API in the same HTTP handler creates a dual-write failure risk." },
    { label: "Action", text: "I created an outbox_events table. When a submission occurs, the response and the outbox event payload are committed together in a single atomic database transaction. An outbox processor dispatches the job to BullMQ, and a 60-second reconcile cron sweeps any jobs that failed immediate dispatch." },
    { label: "Result", text: "Even if the Redis queue or email provider experiences momentary downtime, zero events are lost. The system guarantees at-least-once delivery." }
  ]
);

addQA(
  3,
  "How does FormKit prevent respondents from breaking when a form is edited?",
  "Immutable Snapshots, Data Integrity, Versioning",
  [
    { label: "Answer", text: "We use the Published Snapshot Pattern. When an owner clicks 'Publish', the current draft questions, validation rules, ordering, and theme are compiled into an immutable JSON snapshot stored on the forms table (publishedSnapshot). Public visitors interact solely with this frozen snapshot. The owner can safely add, delete, or modify draft fields in the builder without affecting in-progress respondent sessions." }
  ]
);

addQA(
  4,
  "How does authentication and multi-tenancy work in your platform?",
  "JWT Token Versioning, HttpOnly Cookies, RBAC, Scoped Workspaces",
  [
    { label: "Answer", text: "FormKit uses a hybrid auth model: 15-minute stateless JWT access tokens in signed HttpOnly cookies paired with 30-day refresh tokens stored as SHA-256 hashes in PostgreSQL. To support instant global logout, each user has a tokenVersion integer. For multi-tenancy, every organization has teams, members, and system roles (OWNER, ADMIN, EDITOR, VIEWER) mapped to granular permissions (e.g. form:create, response:view). Requests pass through orgProcedure and hasPermission middlewares with in-memory caching." }
  ]
);

addQA(
  5,
  "What vulnerabilities did you find and how did you resolve them?",
  "CSV Injection (CWE-1236), ReDoS, OOM Pagination",
  [
    { label: "Answer", text: "During security auditing, I identified three critical vectors: 1) CSV Formula Injection during response export, which I neutralized by prefixing formula triggers (=, +, -, @) with a single quote; 2) Regular Expression Denial of Service (ReDoS) from custom question regex patterns, which I bounded by length and wrapped in try-catch; and 3) Memory exhaustion from unbounded response queries, which I resolved with SQL count() queries and limit/offset pagination." }
  ]
);

addQA(
  6,
  "Why did you use Fastify instead of Next.js Route Handlers or Express?",
  "API Gateway, Microservice Decoupling, Worker Sharing, Performance",
  [
    { label: "Answer", text: "While Next.js Route Handlers work for simple monoliths, separating the API into a standalone Fastify service allows independent scaling, dedicated background workers via BullMQ, and integration with high-speed plugins like @fastify/helmet, rate-limiting, and multipart streaming without cold-start penalties. Fastify's schema-based serialization also delivers 2-3x higher JSON throughput than Express." }
  ]
);

addQA(
  7,
  "How would you scale FormKit to handle 10,000,000 form submissions per month?",
  "Database Sharding, S3 Pre-signed URLs, Read Replicas, Caching",
  [
    { label: "Answer", text: "1) Storage: Migrate local disk file uploads to AWS S3 / Cloudflare R2 using presigned URLs, bypassing API server memory completely. 2) Caching: Cache published form snapshots in Redis Edge / CDN with cache tags, reducing DB hits for form landing pages to near zero. 3) Database: Add read replicas for response analytics and partition the responses table by formId or creation month. 4) Queues: Scale BullMQ workers horizontally on containerized runtimes." }
  ]
);

// --- 7. DATABASE SCHEMA SUMMARY ---
addSectionHeader("7. Database Entity Relationship (ER) Summary", "Key tables and relational design managed via Drizzle ORM");

addBullet("users & refresh_tokens", "User profiles, hashed passwords / OAuth IDs, tokenVersion for revocation, and device session metadata.");
addBullet("orgs, teams & memberships", "Multi-tenant workspace isolation. Users belong to Orgs and optionally sub-teams with assigned system roles.");
addBullet("roles, permissions & role_permissions", "Normalized RBAC model defining granular permissions (form:create, form:publish, response:view, etc.).");
addBullet("forms & form_fields", "Draft form definitions, order indexes, JSONB config (options, validations, conditionalLogic), and publishedSnapshot.");
addBullet("responses & response_answers", "Submitted respondent metadata (IP, user agent, timestamps) and normalized question answers stored in JSONB.");
addBullet("outbox_events", "Reliable transactional event store tracking pending, published, and failed events.");
addBullet("plans & subscriptions", "Stripe / Razorpay billing tiers (Free, Pro, Business) and monthly usage counter tracking.");

// --- 8. DEPLOYMENT MATRIX ---
addSectionHeader("8. Production Cloud Deployment Blueprint", "Zero-cost to enterprise-ready deployment architecture");

addCard("Production Hosting Topology", [
  { label: "Frontend Web (apps/web)", value: "Vercel (Edge CDN, SSR, Next.js optimization, automatic HTTPS)" },
  { label: "Backend API (apps/api)", value: "Render / Railway / AWS ECS (Node.js runtime, port 8080, Docker host 0.0.0.0)" },
  { label: "Database (PostgreSQL)", value: "Neon Serverless Postgres / Supabase (connection pooling, SSL required)" },
  { label: "Cache & Queue (Redis)", value: "Upstash Serverless Redis / Valkey Cloud (REST & TCP connections)" },
  { label: "Worker Engine (apps/worker)", value: "Railway Worker / Render Background Worker (BullMQ continuous loop)" },
  { label: "File Storage", value: "Local disk with auto-cleaner (Dev) / AWS S3 or Cloudflare R2 (Production)" },
]);

// Final Footer on all pages
const pageCount = doc.bufferedPageRange().count;
for (let i = 0; i < pageCount; i++) {
  doc.switchToPage(i);
  // Header (pages after page 0)
  if (i > 0) {
    drawHeader();
  }
  // Footer
  doc.save();
  doc.fontSize(8).fillColor(MUTED).font("Helvetica");
  doc.text("FormKit — Production Architecture & Engineering Interview Guide", 50, pageHeight - 35, {
    width: contentWidth / 2,
    align: "left",
  });
  doc.text(`Page ${i + 1} of ${pageCount}`, 50 + contentWidth / 2, pageHeight - 35, {
    width: contentWidth / 2,
    align: "right",
  });
  doc.strokeColor(BORDER_CARD).lineWidth(0.5).moveTo(50, pageHeight - 42).lineTo(545, pageHeight - 42).stroke();
  doc.restore();
}

doc.end();

writeStream.on("finish", () => {
  console.log(`✅ FormKit Interview Guide PDF generated successfully!`);
  console.log(`📁 File location: ${outputPath}`);
  console.log(`📄 Total pages: ${pageCount}`);
});

