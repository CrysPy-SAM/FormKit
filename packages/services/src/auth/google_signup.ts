import { OAuth2Client } from "google-auth-library";
import { env } from "../env.js";
import { dispatchOutboxEvent } from "@formkit/queue";
import { db, eq, memberships, orgs, outboxEvents, users } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import { generateSlug } from "@formkit/utils";
import { invalidateProfileCache } from "../users/profile.js";
import { createPersonalWorkspace } from "./workspace.js";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

type GoogleProfile = {
    googleId: string;
    email: string;
    name: string | null;
    picture: string | null;
    emailVerified: boolean;
};

async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
        throw new Error("Invalid Google token payload");
    }

    return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name ?? null,
        picture: payload.picture ?? null,
        emailVerified: payload.email_verified ?? false,
    };
}


async function signInWithOAuth(input: {
    provider: "google" | "apple";
    providerId: string;
    email: string;
    name?: string | null;
    image?: string | null;
    emailVerified: boolean;
}) {
    const byProvider = await db.query.users.findFirst({
        where: { provider: input.provider, providerId: input.providerId },
    });
    if (byProvider) return byProvider;

    const byEmail = await db.query.users.findFirst({ where: { email: input.email } });

    if (byEmail) {
        if (byEmail.provider === "credentials") {
            const [linked] = await db.update(users)
                .set({
                    provider: input.provider,
                    providerId: input.providerId,
                    emailVerified: true,
                    emailVerifiedAt: new Date(),
                })
                .where(eq(users.id, byEmail.id))
                .returning();

            if (!linked) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to link account" });
            }
            await invalidateProfileCache(byEmail.id);
            return linked;
        }
        throw new TRPCError({
            code: "CONFLICT",
            message: `This email is already linked to ${byEmail.provider}. Multiple OAuth providers per account aren't supported yet.`,
        });
    }

    // 3. Genuinely new user — this is the path that actually inserts into the DB
    let outboxEventId: string | undefined;
    let eventPayload: { userId: string; email: string; name: string | null } | undefined;

    const user = await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(users).values({
            name: input.name ?? null,
            email: input.email, 
            image: input.image ?? null,
            provider: input.provider,
            providerId: input.providerId,
            emailVerified: input.emailVerified,
            emailVerifiedAt: input.emailVerified ? new Date() : null,
            tokenVersion: 0,
        }).returning();

        if (!newUser) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
        }

        await createPersonalWorkspace(tx, newUser.id, newUser.name);

        if (!input.emailVerified) {
            eventPayload = { userId: newUser.id, email: newUser.email, name: newUser.name };

            const [event] = await tx.insert(outboxEvents).values({
                eventType: "user:signup",
                aggregateId: newUser.id,
                payload: eventPayload,
            }).returning();

            if (!event) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create outbox event" });
            }
            outboxEventId = event.id;
        }

        return newUser;
    });

    if (outboxEventId && eventPayload) {
        void dispatchOutboxEvent(outboxEventId, "user:signup", eventPayload);
    }

    return user;
}

export async function googleSignIn(idToken: string) {
    const profile = await verifyGoogleIdToken(idToken);

    return signInWithOAuth({
        provider: "google",
        providerId: profile.googleId,
        email: profile.email,
        name: profile.name,
        image: profile.picture,
        emailVerified: profile.emailVerified,
    });
}