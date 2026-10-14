import { TRPCError } from "@trpc/server";
import z from "zod";
import { loginInput } from "./model.js";
import { db } from "@formkit/db";
import bcrypt from "bcryptjs";


export async function login(input: z.infer<typeof loginInput>) {
    const user = await db.query.users.findFirst({ where: { email: input.email } });

    if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
    }

    if (!user.passwordHash) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: `This account uses ${user.provider} sign-in. Please continue with ${user.provider} instead.`,
        });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
    }

    return user;
}