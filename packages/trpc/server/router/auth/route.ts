import { router, publicProcedure, protectedProcedure } from "../../trpc.js";
import { signupInput, signupOutput, verifyEmailInput, verifyEmailOutput, verifyEmail, googleSignIn, createSession, signup, oauthSignInOutput, loginInput, login, logout, logoutAllDevices, forgetPasswordInput, forgetPasswordOutput, forgetPassword, resetPasswordInput, resetPasswordOutput, resetPassword, refreshSession, sessionOutput, getMySessions, revokeSession, getUserOrgs } from "@formkit/services";
import { AccessPayload } from "@formkit/types";
import { z } from "zod";

// wherever COOKIE_OPTS currently lives
const ACCESS_COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    signed: true,
    path: "/",
};

const REFRESH_COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    signed: true,
    path: "/trpc/auth.refresh",
};

export const authRouter = router({
    //user signup route
    signup: publicProcedure
        .meta({ openapi: { method: "POST", path: "/signup", tags: ["Auth"] } })
        .input(signupInput)
        .output(signupOutput)
        .mutation(async ({ input, ctx }) => {
            const user = await signup(input);
            const { accessToken, refreshToken } = await createSession(
                user.id,
                user.tokenVersion,
                ctx.res.accessJwtSign.bind(ctx.res),
                ctx.res.refreshJwtSign.bind(ctx.res),
                {
                    userAgent: ctx.req.headers["user-agent"],
                    ip: ctx.req.ip,
                },
            );
            ctx.res.setCookie("access_token", accessToken, { ...ACCESS_COOKIE_OPTS, maxAge: 15 * 60 });
            ctx.res.setCookie("refresh_token", refreshToken, { ...REFRESH_COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 });
            const orgs = await getUserOrgs(user.id);

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                orgs
            };
        }),

    // Google Signup
    googleSignIn: publicProcedure
        .meta({ openapi: { method: "POST", path: "/signup/google", tags: ["Auth"] } })
        .input(z.object({ idToken: z.string() }))
        .output(signupOutput)
        .mutation(async ({ input, ctx }) => {
            const user = await googleSignIn(input.idToken);

            const { accessToken, refreshToken } = await createSession(
                user.id,
                user.tokenVersion,
                ctx.res.accessJwtSign.bind(ctx.res),
                ctx.res.refreshJwtSign.bind(ctx.res),
                { userAgent: ctx.req.headers["user-agent"], ip: ctx.req.ip },
            );

            ctx.res.setCookie("access_token", accessToken, { ...ACCESS_COOKIE_OPTS, maxAge: 15 * 60 });
            ctx.res.setCookie("refresh_token", refreshToken, { ...REFRESH_COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 });

            const orgs = await getUserOrgs(user.id);

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                orgs,
            };
        }),

    // user login route
    login: publicProcedure
        .meta({ openapi: { method: "POST", path: "/login", tags: ["Auth"] } })
        .input(loginInput)
        .output(signupOutput)
        .mutation(async ({ input, ctx }) => {
            const user = await login(input);
            const { accessToken, refreshToken } = await createSession(
                user.id,
                user.tokenVersion,
                ctx.res.accessJwtSign.bind(ctx.res),
                ctx.res.refreshJwtSign.bind(ctx.res),
                {
                    userAgent: ctx.req.headers["user-agent"],
                    ip: ctx.req.ip,
                },
            );
            ctx.res.setCookie("access_token", accessToken, { ...ACCESS_COOKIE_OPTS, maxAge: 15 * 60 });
            ctx.res.setCookie("refresh_token", refreshToken, { ...REFRESH_COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 });

            const orgs = await getUserOrgs(user.id);

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                orgs
            };
        }),

    // user email verification route.
    verify: publicProcedure
        .meta({ openapi: { method: "POST", path: "/verify", tags: ["Auth"] } })
        .input(verifyEmailInput)
        .output(verifyEmailOutput)
        .mutation(async ({ input }) => {
            return verifyEmail(input.token);
        }),


    // Forget password
    forgetPassword: publicProcedure
        .meta({ openapi: { method: "POST", path: "/forget-password", tags: ["Auth"] } })
        .input(forgetPasswordInput)
        .output(forgetPasswordOutput)
        .mutation(({ input }) => forgetPassword(input)),

    // Reset password
    resetPassword: publicProcedure
        .meta({ openapi: { method: "POST", path: "/reset-password", tags: ["Auth"] } })
        .input(resetPasswordInput)
        .output(resetPasswordOutput)
        .mutation(({ input }) => resetPassword(input.token, input.newPassword)),

    // Getting new refresh and access token
    refresh: publicProcedure
        .meta({ openapi: { method: "POST", path: "/refresh", tags: ["Auth"] } })
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx }) => {
            const refreshTokenRaw = ctx.req.cookies?.refresh_token;

            const user = await refreshSession(
                refreshTokenRaw,
                async (token) => ctx.req.server.refresh.verify<AccessPayload>(token),
            );

            const { accessToken, refreshToken } = await createSession(
                user.id,
                user.tokenVersion,
                ctx.res.accessJwtSign.bind(ctx.res),
                ctx.res.refreshJwtSign.bind(ctx.res),
                {
                    userAgent: ctx.req.headers["user-agent"],
                    ip: ctx.req.ip,
                },
            );

            ctx.res.setCookie("access_token", accessToken, { ...ACCESS_COOKIE_OPTS, maxAge: 15 * 60 });
            ctx.res.setCookie("refresh_token", refreshToken, { ...REFRESH_COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 });

            return { success: true };
        }),

    // Logout user
    logout: publicProcedure
        .meta({ openapi: { method: "POST", path: "/logout", tags: ["Auth"] } })
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx }) => {
            const refreshTokenRaw = ctx.req.cookies?.refresh_token;
            await logout(refreshTokenRaw);

            ctx.res.clearCookie("access_token", { path: "/" });
            ctx.res.clearCookie("refresh_token", { path: "/trpc/auth.refresh" });

            return { success: true };
        }),

    // Logout user from all the devices
    logoutAllDevices: protectedProcedure
        .meta({ openapi: { method: "POST", path: "/logout-all", tags: ["Auth"] } })
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx }) => {
            await logoutAllDevices(ctx.user.sub);

            ctx.res.clearCookie("access_token", { path: "/" });
            ctx.res.clearCookie("refresh_token", { path: "/trpc/auth.refresh" });

            return { success: true };
        }),

    // Get all the session of the user
    sessions: protectedProcedure
        .meta({ openapi: { method: "GET", path: "/sessions", tags: ["Auth"] } })
        .output(z.array(sessionOutput))
        .query(({ ctx }) => getMySessions(ctx.user.sub, ctx.req.cookies?.refresh_token)),

    // revoke a particualr session.
    revokeSession: protectedProcedure
        .meta({ openapi: { method: "POST", path: "/sessions/revoke", tags: ["Auth"] } })
        .input(z.object({ sessionId: z.string() }))
        .output(z.object({ success: z.boolean() }))
        .mutation(({ input, ctx }) => revokeSession(ctx.user.sub, input.sessionId)),

});