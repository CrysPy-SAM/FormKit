import { authRouter } from "./router/auth/route.js";
import { formsRouter } from "./router/forms/route.js";
import { healthRouter } from "./router/health/route.js";
import { userRouter } from "./router/user/route.js";
import { workspaceRouter } from "./router/workspace/router.js";
import { router } from "./trpc.js";

export const appRouter = router({
    health: healthRouter,
    auth: authRouter,
    user: userRouter,
    workspace: workspaceRouter,
    forms: formsRouter,
});

export { createContext } from "./context.js";
export type AppRouter = typeof appRouter;