import {
    getPublicFormInput, publicFormOutput, getPublicForm,
    submitResponseInput, submitResponseOutput, submitPublicResponse,
} from "@formkit/services";
import { publicProcedure, router } from "../../../trpc.js";

export const publicFormRouter = router({
    // Unauthenticated on purpose — anyone with the link can view a published
    // form. Never wrap this in orgProcedure/hasPermission.
    get: publicProcedure
        .meta({ openapi: { method: "GET", path: "/public/forms/{slug}", tags: ["Public"] } })
        .input(getPublicFormInput)
        .output(publicFormOutput)
        .query(({ input }) => getPublicForm(input.slug)),

    submit: publicProcedure
        .meta({ openapi: { method: "POST", path: "/public/forms/{slug}/responses", tags: ["Public"] } })
        .input(submitResponseInput)
        .output(submitResponseOutput)
        .mutation(({ input, ctx }) =>
            submitPublicResponse(
                input.slug,
                { answers: input.answers },
                {
                    ip: ctx.req.ip,
                    userAgent: ctx.req.headers["user-agent"],
                    referrer: ctx.req.headers["referer"] as string | undefined,
                },
            )
        ),
});
