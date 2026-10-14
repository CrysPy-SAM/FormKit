import { z } from "zod";

export const signupInput = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(120)
        .describe("Name of user"),
    email: z
        .email("Invalid email")
        .trim()
        .max(255)
        .describe("Email of the user"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128)
        .regex(/[a-z]/, "Password must include a lowercase letter")
        .regex(/[A-Z]/, "Password must include an uppercase letter")
        .regex(/\d/, "Password must include a number")
        .describe("Password of the user"),
}).strict();

export const signupOutput = z.object({
    id: z.string().describe("Id of the created user"),
    name: z.string().nullable().describe("Name of the created user"),
    email: z.string().describe("Email of the created user"),
    emailVerified: z.boolean().nullable().describe("User email is verifyed or not"),
    orgs: z.array(z.object({
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        isPersonal: z.boolean(),
        role: z.string(),
    })),
})


export const loginInput = z.object({
    email: z
        .email("Invalid email")
        .trim()
        .max(255)
        .describe("Email of the user"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128)
        .describe("Password of user"),
});


export const oauthSignInInput = z.object({
    provider: z.enum(["google", "apple"]).describe("oAuth Provider Name"),
    providerId: z.string().describe("oAuth Provider Id"),
    email: z.email("Invalid email")
        .trim()
        .max(255)
        .describe("Email of the user"),
    name: z.string().optional(),
    image: z.url().optional(),
});

export const oauthSignInOutput = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
});

export const verifyEmailInput = z.object({
    token: z.string().min(1, "Token is missing").describe("Email verification token"),
});

export const verifyEmailOutput = z.object({
    success: z.boolean().describe("Whether the email was successfully verified"),
});

export const forgetPasswordInput = z.object({
    email: z
        .email()
        .describe("Email of the user.")
})

export const forgetPasswordOutput = z.object({
    message: z.string(),
    success: z.boolean().default(true)
})

export const resetPasswordInput = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(100),
});

export const resetPasswordOutput = z.object({
    success: z.boolean(),
});