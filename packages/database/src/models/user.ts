import { pgTable, uuid, varchar, timestamp, boolean, jsonb, unique, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }), // nullable for OAuth-only users
    emailVerified: boolean("email_verified").default(false),
    emailVerifiedAt: timestamp("email_verified_at"),
    image: varchar("image", { length: 500 }),
    provider: varchar("provider", { length: 50 }), // 'credentials' | 'google' | 'github'
    providerId: varchar("provider_id", { length: 255 }),
    tokenVersion: integer("token_version").default(0).notNull(), // token versioning for manual logout from the server
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
});

export const refreshTokens = pgTable("refresh_tokens", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    userAgent: varchar("user_agent", { length: 255 }),
    ip: varchar("ip", { length: 45 }),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const orgs = pgTable("orgs", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull().unique(), // used for org subdomain / URL scoping
    logo: varchar("logo", { length: 500 }),
    isPersonal: boolean("is_personal").default(false).notNull(),
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
});

export const teams = pgTable("teams", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 150 }).notNull(),
    orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
});

export const roles = pgTable("roles", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 50 }).notNull().unique(), // OWNER, ADMIN, EDITOR, VIEWER
    isSystem: boolean("is_system").default(true).notNull(), // block user-editing for now
});

export const permissions = pgTable("permissions", {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 100 }).notNull().unique(), // 'form:create', 'form:publish', 'billing:manage'
    description: varchar("description", { length: 255 }),
});

export const rolePermissions = pgTable("role_permissions", {
    roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
}, (t) => ([unique().on(t.roleId, t.permissionId)]));

export const memberships = pgTable("memberships", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }), // nullable
    roleId: uuid("role_id").notNull().references(() => roles.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ([unique().on(t.userId, t.orgId, t.teamId)]));

export const emailVerificationTokens = pgTable("email_verification_tokens", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow(),
});