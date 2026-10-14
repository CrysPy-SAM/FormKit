import { success, z } from "zod"

export const CreateTeamInput = z.object({
    name: z
        .string({ error: "Team name is required" })
        .trim()
        .min(2, { error: "Team name is too sort" })
        .max(50, { error: "Team name is too long" })
        .describe("Name of the team"),
})

export const CreateTeamOutput = z.object({
    success: z.boolean().default(true),
    message: z.string()
})

export type CreateTeamInputType = z.infer<typeof CreateTeamInput>
export type CreateTeamOutputType = z.infer<typeof CreateTeamOutput>


export const teamSummaryOutput = z.object({
    id: z.string(),
    name: z.string(),
    orgId: z.string(),
    memberCount: z.number(),
});

export const createTeamOutput = teamSummaryOutput;
export const listTeamsOutput = z.array(teamSummaryOutput);

export const orgSubscriptionOutput = z.object({
    planTier: z.string(),
    planName: z.string(),
    status: z.string(),
    limits: z.object({
        maxForms: z.number(),
        maxResponsesPerMonth: z.number(),
        maxOrgMembers: z.number(),
        maxTeamMembers: z.number(),
        maxTeams: z.number(),
        customBranding: z.boolean(),
    }),
});

export type orgSubscriptionInput = z.infer<typeof orgSubscriptionOutput>