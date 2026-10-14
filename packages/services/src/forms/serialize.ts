import type { Form, FormField } from "@formkit/db";

export function serializeForm(form: Form) {
    return {
        id: form.id,
        orgId: form.orgId,
        teamId: form.teamId,
        title: form.title,
        slug: form.slug,
        status: form.status,
        publishedAt: form.publishedAt?.toISOString() ?? null,
        createdAt: form.createdAt.toISOString(),
        // Extra key — schemas that don't declare `theme` (formOutput) simply
        // strip it; formWithFieldsOutput declares it and keeps it.
        theme: form.settings?.formTheme ?? {},
        closeSettings: {
            closeAfterResponses: form.settings?.closeAfterResponses ?? null,
            closeAt: form.settings?.closeAt ?? null,
        },
    };
}

export function serializeField(field: FormField) {
    return {
        id: field.id,
        formId: field.formId,
        type: field.type,
        label: field.label,
        order: field.order,
        required: field.required,
        config: field.config,
    };
}