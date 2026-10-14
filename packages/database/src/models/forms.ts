import { pgTable, uuid, varchar, timestamp, boolean, jsonb, integer, pgEnum } from "drizzle-orm/pg-core";
import { orgs, teams, users } from "./user.js";
import { FieldConfig, FormSettings, PublishedFormSnapshot } from "./forms-types.js";
import { InferSelectModel } from "drizzle-orm";

export const formStatusEnum = pgEnum("form_status", ["draft", "published", "archived"]);
export const fieldTypeEnum = pgEnum("field_type", [
    "short_text", "long_text", "email", "number", "date", "url", "phone_number",
    "select", "radio", "checkbox", "rating", "file_upload", "statement", "yes_no"
]);

export const forms = pgTable("forms", {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    status: formStatusEnum("status").default("draft").notNull(),
    settings: jsonb("settings").$type<FormSettings>().default({}),
    publishedSnapshot: jsonb("published_snapshot").$type<PublishedFormSnapshot>(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
});

export const formFields = pgTable("form_fields", {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
    type: fieldTypeEnum("type").notNull(),
    label: varchar("label", { length: 500 }).notNull(),
    order: integer("order").notNull(),
    required: boolean("required").default(false).notNull(),
    config: jsonb("config").$type<FieldConfig>().default({}).notNull(),
});

export const responses = pgTable("responses", {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
    respondentEmail: varchar("respondent_email", { length: 255 }),
    metadata: jsonb("metadata").$type<{ ip?: string; userAgent?: string; referrer?: string }>().default({}),
    startedAt: timestamp("started_at").defaultNow(),
    completedAt: timestamp("completed_at"),
});

export const responseAnswers = pgTable("response_answers", {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id").notNull().references(() => responses.id, { onDelete: "cascade" }),
    fieldId: uuid("field_id").notNull().references(() => formFields.id, { onDelete: "cascade" }),
    value: jsonb("value").notNull(),
});

export type Form = InferSelectModel<typeof forms>;
export type FormField = InferSelectModel<typeof formFields>;