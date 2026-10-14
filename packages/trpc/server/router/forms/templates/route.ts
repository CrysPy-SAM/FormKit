import { z } from "zod";
import { router, hasPermission, orgProcedure } from "../../../trpc.js";
import { PERMISSIONS } from "@formkit/config";
import {
    formOutput, formTemplateOutput,
    createFormFromTemplateInput, createFormFromTemplate, listFormTemplates,
} from "@formkit/services";

export const templatesRouter = router({
    // Just a static catalog — any org member can browse it, same bar as
    // seeing their own form list.
    list: orgProcedure
        .meta({ openapi: { method: "GET", path: "/forms/templates", tags: ["Forms"] } })
        .output(z.array(formTemplateOutput))
        .query(() => listFormTemplates()),

    create: hasPermission(PERMISSIONS.FORM_CREATE)
        .meta({ openapi: { method: "POST", path: "/forms/templates/use", tags: ["Forms"] } })
        .input(createFormFromTemplateInput)
        .output(formOutput)
        .mutation(({ input, ctx }) =>
            createFormFromTemplate(ctx.orgId, ctx.user.sub, input)
        ),
});
