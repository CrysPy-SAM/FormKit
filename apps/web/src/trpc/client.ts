import { createTRPCReact } from "@trpc/react-query";
import { AppRouter } from "@formkit/trpc/client";

export const trpc = createTRPCReact<AppRouter>();
