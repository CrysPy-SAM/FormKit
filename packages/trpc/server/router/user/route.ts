import { getMyProfile, userProfileOutput, } from "@formkit/services";
import { protectedProcedure, router } from "../../trpc.js";

export const userRouter = router({
    me: protectedProcedure
        .meta({ openapi: { method: "GET", path: "/me", tags: ["User"] } })
        .output(userProfileOutput)
        .query(({ ctx }) => getMyProfile(ctx.user.sub)),
})