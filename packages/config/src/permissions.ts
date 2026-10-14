export const PERMISSIONS = {
    FORM_CREATE: "form:create",
    FORM_PUBLISH: "form:publish",
    FORM_DELETE: "form:delete",
    RESPONSE_VIEW: "response:view",
    RESPONSE_EXPORT: "response:export",
    MEMBER_INVITE: "member:invite",
    MEMBER_REMOVE: "member:remove",
    ROLE_MANAGE: "role:manage",
    BILLING_MANAGE: "billing:manage",
    ORG_SETTINGS: "org:settings",
    TEAM_CREATE: "team:create",
    ORG_MANAGE_ALL_TEAMS: "org:manage_all_teams",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];