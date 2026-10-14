import { defineRelations } from "drizzle-orm";
import { users, orgs, teams, roles, permissions, rolePermissions, memberships, refreshTokens, emailVerificationTokens, passwordResetTokens } from "./user.js";
import { forms, formFields, responses, responseAnswers } from "./forms.js";
import { plans, subscriptions, usageCounters } from "./billing.js";
import { outboxEvents } from "./events.js";

const schema = {
    users, orgs, teams, roles, permissions, rolePermissions, memberships, refreshTokens, emailVerificationTokens, passwordResetTokens,
    forms, formFields, responses, responseAnswers, plans, subscriptions, usageCounters,
    outboxEvents,
};

export const relations = defineRelations(schema, (r) => ({
    users: {
        createdOrgs: r.many.orgs({ from: r.users.id, to: r.orgs.createdById }),
        memberships: r.many.memberships({ from: r.users.id, to: r.memberships.userId }),
        refreshTokens: r.many.refreshTokens({ from: r.users.id, to: r.refreshTokens.userId }),
        emailVerificationTokens: r.many.emailVerificationTokens({ from: r.users.id, to: r.emailVerificationTokens.userId }),
        passwordResetTokens: r.many.passwordResetTokens({ from: r.users.id, to: r.passwordResetTokens.userId }),
    },

    emailVerificationTokens: {
        user: r.one.users({ from: r.emailVerificationTokens.userId, to: r.users.id }),
    },

    passwordResetTokens: {
        user: r.one.users({ from: r.passwordResetTokens.userId, to: r.users.id }),
    },

    orgs: {
        createdBy: r.one.users({ from: r.orgs.createdById, to: r.users.id }),
        teams: r.many.teams({ from: r.orgs.id, to: r.teams.orgId }),
        memberships: r.many.memberships({ from: r.orgs.id, to: r.memberships.orgId }),
        forms: r.many.forms({ from: r.orgs.id, to: r.forms.orgId }),
        subscription: r.one.subscriptions({ from: r.orgs.id, to: r.subscriptions.orgId }),
    },

    teams: {
        org: r.one.orgs({ from: r.teams.orgId, to: r.orgs.id }),
        createdBy: r.one.users({ from: r.teams.createdById, to: r.users.id }),
        memberships: r.many.memberships({ from: r.teams.id, to: r.memberships.teamId }),
        forms: r.many.forms({ from: r.teams.id, to: r.forms.teamId }), // ← new
    },

    memberships: {
        user: r.one.users({ from: r.memberships.userId, to: r.users.id }),
        org: r.one.orgs({ from: r.memberships.orgId, to: r.orgs.id }),
        team: r.one.teams({ from: r.memberships.teamId, to: r.teams.id }),
        role: r.one.roles({ from: r.memberships.roleId, to: r.roles.id }),
    },

    roles: {
        rolePermissions: r.many.rolePermissions({ from: r.roles.id, to: r.rolePermissions.roleId }),
        memberships: r.many.memberships({ from: r.roles.id, to: r.memberships.roleId }),
    },

    permissions: {
        rolePermissions: r.many.rolePermissions({ from: r.permissions.id, to: r.rolePermissions.permissionId }),
    },

    rolePermissions: {
        role: r.one.roles({ from: r.rolePermissions.roleId, to: r.roles.id }),
        permission: r.one.permissions({ from: r.rolePermissions.permissionId, to: r.permissions.id }),
    },

    forms: {
        org: r.one.orgs({ from: r.forms.orgId, to: r.orgs.id }),
        team: r.one.teams({ from: r.forms.teamId, to: r.teams.id }), // ← new, nullable
        createdBy: r.one.users({ from: r.forms.createdById, to: r.users.id }),
        fields: r.many.formFields({ from: r.forms.id, to: r.formFields.formId }),
        responses: r.many.responses({ from: r.forms.id, to: r.responses.formId }),
    },

    formFields: {
        form: r.one.forms({ from: r.formFields.formId, to: r.forms.id }),
        answers: r.many.responseAnswers({ from: r.formFields.id, to: r.responseAnswers.fieldId }),
    },

    responses: {
        form: r.one.forms({ from: r.responses.formId, to: r.forms.id }),
        answers: r.many.responseAnswers({ from: r.responses.id, to: r.responseAnswers.responseId }),
    },

    responseAnswers: {
        response: r.one.responses({ from: r.responseAnswers.responseId, to: r.responses.id }),
        field: r.one.formFields({ from: r.responseAnswers.fieldId, to: r.formFields.id }),
    },

    subscriptions: {
        org: r.one.orgs({ from: r.subscriptions.orgId, to: r.orgs.id }),
        plan: r.one.plans({ from: r.subscriptions.planId, to: r.plans.id }),
    },
}));