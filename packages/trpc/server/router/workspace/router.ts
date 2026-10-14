import { PERMISSIONS } from "@formkit/config";
import { hasPermission, orgProcedure, router } from "../../trpc.js";
import { createTeam, CreateTeamInput, CreateTeamOutput, listTeams, listTeamsOutput, orgSubscriptionOutput } from "@formkit/services";
import { getOrgSubscription } from "@formkit/services/src/workspace/subscription.js";

export const workspaceRouter = router({
    createTeam: hasPermission(PERMISSIONS.TEAM_CREATE)
        .meta({ openapi: { method: "POST", path: "/teams", tags: ["Teams"] } })
        .input(CreateTeamInput)
        .output(CreateTeamOutput)
        .mutation(({ ctx, input }) => createTeam(input.name, ctx.orgId, ctx.user.sub)),

    list: orgProcedure
        .meta({ openapi: { method: "GET", path: "/teams", tags: ["Teams"] } })
        .output(listTeamsOutput)
        .query(({ ctx }) => listTeams(ctx.orgId)),
    
    getSubscription: orgProcedure
        .meta({ openapi: { method: "GET", path: "/workspace/subscription", tags: ["Workspace"] } })
        .output(orgSubscriptionOutput)
        .query(({ ctx }) => getOrgSubscription(ctx.orgId)),
}) 