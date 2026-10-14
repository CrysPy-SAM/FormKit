import { PERMISSIONS } from "@formkit/config";
import {
    createFieldInput, updateFieldInput, deleteFieldInput,
    fieldOutput, deleteFieldOutput,
    addField, updateField, deleteField,
} from "@formkit/services";
import { hasPermission, router } from "../../../trpc.js";

export const fieldsRouter = router({
    create: hasPermission(PERMISSIONS.FORM_CREATE)  
        .meta({ openapi: { method: "POST", path: "/forms/{formId}/fields", tags: ["Fields"] } })
        .input(createFieldInput)
        .output(fieldOutput)
        .mutation(({ input, ctx }) =>
            addField(ctx.orgId, input.formId, input)
        ),

    update: hasPermission(PERMISSIONS.FORM_CREATE)
        .meta({ openapi: { method: "PATCH", path: "/forms/{formId}/fields/{fieldId}", tags: ["Fields"] } })
        .input(updateFieldInput)
        .output(fieldOutput)
        .mutation(({ input, ctx }) =>
            updateField(ctx.orgId, input.formId, input.fieldId, input)
        ),

    delete: hasPermission(PERMISSIONS.FORM_CREATE)
        .meta({ openapi: { method: "DELETE", path: "/forms/{formId}/fields/{fieldId}", tags: ["Fields"] } })
        .input(deleteFieldInput)
        .output(deleteFieldOutput)
        .mutation(({ input, ctx }) =>
            deleteField(ctx.orgId, input.formId, input.fieldId)
        ),
});