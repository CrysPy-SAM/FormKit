import { db } from "@formkit/db";
import type { PublishedFieldSnapshot } from "@formkit/db";
import { PERMISSIONS } from "@formkit/config";
import { TRPCError } from "@trpc/server";

function isEmptyAnswer(value: unknown): boolean {
    if (value === null || value === undefined || value === "") return true;
    if (Array.isArray(value)) return value.length === 0;
    return false;
}

function average(nums: number[]): number | null {
    return nums.length ? nums.reduce((sum, n) => sum + n, 0) / nums.length : null;
}

/**
 * Per-question stats for one field, computed entirely from the answers
 * already collected for it — no assumptions about respondents who never
 * submitted (see getFormAnalytics for why that population isn't visible to
 * this data model at all).
 */
function analyzeField(field: PublishedFieldSnapshot, values: unknown[], totalResponses: number) {
    const answered = values.filter((v) => !isEmptyAnswer(v)).length;
    const answerRate = totalResponses > 0 ? answered / totalResponses : 0;
    const base = { fieldId: field.id, label: field.label, type: field.type, answered, answerRate };

    if (field.type === "rating") {
        const nums = values.map(Number).filter((n) => !Number.isNaN(n));
        const distribution = [1, 2, 3, 4, 5].map((value) => ({
            value,
            count: nums.filter((n) => n === value).length,
        }));
        return { ...base, average: average(nums), distribution };
    }

    if (field.type === "number") {
        const nums = values.map(Number).filter((n) => !Number.isNaN(n));
        return {
            ...base,
            average: average(nums),
            min: nums.length ? Math.min(...nums) : null,
            max: nums.length ? Math.max(...nums) : null,
        };
    }

    if (field.type === "select" || field.type === "radio") {
        const definedOptions = field.config.options ?? [];
        const counts = new Map<string, number>();
        for (const v of values) if (typeof v === "string") counts.set(v, (counts.get(v) ?? 0) + 1);
        const knownIds = new Set(definedOptions.map((o) => o.id));
        const options = definedOptions.map((o) => ({ id: o.id, label: o.label, count: counts.get(o.id) ?? 0 }));
        if (field.config.allowOther && counts.has("other")) {
            options.push({ id: "other", label: "Other", count: counts.get("other")! });
        }
        // Any recorded value that no longer matches a defined option (e.g. the
        // option was edited/removed after this field was answered) — surfaced
        // rather than silently dropped, so counts still add up.
        for (const [id, count] of counts) {
            if (id !== "other" && !knownIds.has(id)) options.push({ id, label: id, count });
        }
        return { ...base, options: withPercentages(options) };
    }

    if (field.type === "yes_no") {
        const yes = values.filter((v) => v === "yes").length;
        const no = values.filter((v) => v === "no").length;
        return {
            ...base,
            options: withPercentages([
                { id: "yes", label: "Yes", count: yes },
                { id: "no", label: "No", count: no },
            ]),
        };
    }

    if (field.type === "checkbox") {
        const definedOptions = field.config.options ?? [];
        const counts = new Map<string, number>();
        for (const v of values) if (Array.isArray(v)) for (const item of v) counts.set(item, (counts.get(item) ?? 0) + 1);
        const options = definedOptions.map((o) => ({ id: o.id, label: o.label, count: counts.get(o.id) ?? 0 }));
        // Checkbox percentages are "of respondents who answered this
        // question" (they can pick more than one), not "of total picks".
        return { ...base, options: withPercentages(options, answered) };
    }

    // Free text / date / url / phone / file_upload — nothing meaningful to
    // aggregate without inventing an insight, so only the answer rate above
    // is reported for these.
    return base;
}

function withPercentages(options: { id: string; label: string; count: number }[], base?: number) {
    const denominator = base ?? options.reduce((sum, o) => sum + o.count, 0);
    return options
        .map((o) => ({ ...o, percentage: denominator > 0 ? o.count / denominator : 0 }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Aggregates response analytics for a form, from the same `responses` /
 * `response_answers` rows the Responses page already reads — no separate
 * analytics storage.
 *
 * Important data-model limitation: a `responses` row is only ever created
 * once, at final submission (see submitPublicResponse) — there is no record
 * of a visitor who opened the form and never finished. That means three
 * commonly-expected metrics are NOT reliably computable here and are
 * intentionally omitted rather than faked:
 *   - "Completion rate" (starts vs. finishes) — every stored response is,
 *     by construction, already complete.
 *   - "Average completion time" — `startedAt` and `completedAt` are both
 *     stamped at the same instant (submission time), so their difference is
 *     just request latency, not how long the respondent actually spent.
 *   - True step-by-step drop-off / abandonment — same root cause: nothing
 *     is recorded for a session that didn't reach the final submit.
 * What IS reliable and reported instead: per-question answer rate among
 * respondents who did complete the form (a legitimate, if different,
 * engagement signal), plus full per-type breakdowns of the answers given.
 */
export async function getFormAnalytics(orgId: string, formId: string, userId: string) {
    const membership = await db.query.memberships.findFirst({
        where: { userId, orgId },
        with: { role: { with: { rolePermissions: { with: { permission: true } } } } },
    });
    if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this org" });
    }
    if (!membership.role) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Membership missing role" });
    }

    const form = await db.query.forms.findFirst({ where: { id: formId, orgId } });
    if (!form) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    const hasOrgWideAccess = membership.role.rolePermissions.some(
        (rp) => rp.permission?.key === PERMISSIONS.ORG_MANAGE_ALL_TEAMS
    );
    if (!hasOrgWideAccess && form.teamId !== null) {
        const teamMembership = await db.query.memberships.findFirst({
            where: { userId, orgId, teamId: form.teamId },
        });
        if (!teamMembership) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You're not a member of this team" });
        }
    }

    const fields = (form.publishedSnapshot?.fields ?? [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .filter((f) => f.type !== "statement");

    const responses = await db.query.responses.findMany({
        where: { formId },
        with: { answers: true },
    });

    const total = responses.length;

    const trendMap = new Map<string, number>();
    for (const r of responses) {
        const day = (r.completedAt ?? r.startedAt ?? new Date()).toISOString().slice(0, 10);
        trendMap.set(day, (trendMap.get(day) ?? 0) + 1);
    }
    const trend = Array.from(trendMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const valuesByField = new Map<string, unknown[]>();
    for (const r of responses) {
        for (const a of r.answers) {
            if (!valuesByField.has(a.fieldId)) valuesByField.set(a.fieldId, []);
            valuesByField.get(a.fieldId)!.push(a.value);
        }
    }

    const fieldAnalytics = fields.map((field) => analyzeField(field, valuesByField.get(field.id) ?? [], total));

    const averageAnsweredFields =
        total > 0 && fields.length > 0
            ? average(responses.map((r) => r.answers.filter((a) => !isEmptyAnswer(a.value)).length))
            : null;

    return {
        formTitle: form.title,
        total,
        totalFields: fields.length,
        averageAnsweredFields,
        trend,
        fields: fieldAnalytics,
    };
}
