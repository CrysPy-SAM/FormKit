import { z } from "zod"

export type UserProfile = {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    provider: string | null;
    emailVerified: boolean;
    createdAt: string;
};

export type SessionInfo = {
    id: string;
    userAgent: string | null;
    ip: string | null;
    createdAt: string;
    expiresAt: string;
    isCurrent: boolean,
};

export const userProfileOutput = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    image: z.string().nullable(),
    provider: z.string().nullable(),
    emailVerified: z.boolean(),
    createdAt: z.string(),
    orgs: z.array(z.object({
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        isPersonal: z.boolean(),
        role: z.string(),
    })),
});

export const sessionOutput = z.object({
    id: z.string(),
    userAgent: z.string().nullable(),
    ip: z.string().nullable(),
    createdAt: z.string(),
    expiresAt: z.string(),
    isCurrent: z.boolean(),
});

