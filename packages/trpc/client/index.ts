import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";

import { type AppRouter } from "../server/index.js";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;

export { observable } from "@trpc/server/observable";
export type { AppRouter } from "../server/index.js";

export * from "@trpc/client";
