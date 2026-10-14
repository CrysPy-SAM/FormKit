import { router, hasPermission, orgProcedure } from "../../trpc.js";
import { PERMISSIONS } from "@formkit/config";
import { createFormInput, formOutput, createForm, publishFormInput, publishForm, getVisibleFormsForUser, getForm, getFormInput, formWithFieldsOutput, updateForm, updateFormInput, getFormResponses, getFormResponsesInput, formResponsesOutput, getFormAnalytics, getFormAnalyticsInput, formAnalyticsOutput } from "@formkit/services";
import { fieldsRouter } from "./fields/route.js";
import { publicFormRouter } from "./public/route.js";
import { templatesRouter } from "./templates/route.js";
import { z } from "zod"

export const formsRouter = router({
    create: hasPermission(PERMISSIONS.FORM_CREATE)
        .meta({ openapi: { method: "POST", path: "/forms", tags: ["Forms"] } })
        .input(createFormInput)
        .output(formOutput)
        .mutation(({ input, ctx }) =>
            createForm(ctx.orgId, ctx.user.sub, input)
        ),
    list: orgProcedure
        .meta({ openapi: { method: "GET", path: "/forms", tags: ["Forms"] } })
        .output(z.array(formOutput))
        .query(({ ctx }) => getVisibleFormsForUser(ctx.orgId, ctx.user.sub)),

    get: orgProcedure
        .meta({ openapi: { method: "GET", path: "/forms/{formId}", tags: ["Forms"] } })
        .input(getFormInput)
        .output(formWithFieldsOutput)
        .query(({ input, ctx }) => getForm(ctx.orgId, input.formId, ctx.user.sub)),

    update: hasPermission(PERMISSIONS.FORM_CREATE)
        .meta({ openapi: { method: "PATCH", path: "/forms/{formId}", tags: ["Forms"] } })
        .input(updateFormInput)
        .output(formOutput)
        .mutation(({ input, ctx }) => updateForm(ctx.orgId, input.formId, input)),

    publish: hasPermission(PERMISSIONS.FORM_PUBLISH)
        .meta({ openapi: { method: "POST", path: "/forms/{formId}/publish", tags: ["Forms"] } })
        .input(publishFormInput)
        .output(formOutput)
        .mutation(async ({ input, ctx }) => publishForm(ctx.orgId, input.formId, ctx.user.sub)),

    responses: hasPermission(PERMISSIONS.RESPONSE_VIEW)
        .meta({ openapi: { method: "GET", path: "/forms/{formId}/responses", tags: ["Forms"] } })
        .input(getFormResponsesInput)
        .output(formResponsesOutput)
        .query(({ input, ctx }) =>
            getFormResponses(ctx.orgId, input.formId, ctx.user.sub, {
                limit: input.limit,
                offset: input.offset,
            })
        ),

    analytics: hasPermission(PERMISSIONS.RESPONSE_VIEW)
        .meta({ openapi: { method: "GET", path: "/forms/{formId}/analytics", tags: ["Forms"] } })
        .input(getFormAnalyticsInput)
        .output(formAnalyticsOutput)
        .query(({ input, ctx }) => getFormAnalytics(ctx.orgId, input.formId, ctx.user.sub)),

    fields: fieldsRouter,
    public: publicFormRouter,
    templates: templatesRouter,
});