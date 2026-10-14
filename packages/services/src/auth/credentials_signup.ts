import { db, outboxEvents, users } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { signupInput } from "./model.js";
import bcrypt from "bcryptjs"
import { dispatchOutboxEvent } from "@formkit/queue";
import { createPersonalWorkspace } from "./workspace.js";

const SALT_ROUNDS = 12;


export async function signup(input: z.infer<typeof signupInput>) {
    const existing = await db.query.users.findFirst({ where: { email: input.email } });

    if (existing) {
        if (existing.provider === "credentials") {
            throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }

        throw new TRPCError({
            code: "CONFLICT",
            message: `This email is linked to ${existing.provider}. Please sign in with ${existing.provider} instead.`,
        });
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const { user, outboxEventId, eventPayload } = await db.transaction(async (tx) => {

        const [newUser] = await tx.insert(users).values({
            name: input.name,
            email: input.email,
            passwordHash,
            provider: "credentials",
            emailVerified: false,
            tokenVersion: 0,
        }).returning();

        if (!newUser) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
        }

        await createPersonalWorkspace(tx, newUser.id, newUser.name);

        const eventPayload = { userId: newUser.id, email: newUser.email, name: newUser.name };

        const [event] = await tx.insert(outboxEvents).values({
            eventType: "user:signup",
            aggregateId: newUser.id,
            payload: eventPayload,
        }).returning();

        if (!event) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create outbox event" });

        return { user: newUser, outboxEventId: event.id, eventPayload };
    })

    void dispatchOutboxEvent(outboxEventId, "user:signup", eventPayload);
    return user;
}