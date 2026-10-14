"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React, { useState, type ReactNode } from "react";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { ThemeProvider } from "~/providers/theme";
import { getQueryClient } from "~/providers/query-client";
import { trpc } from "~/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client"
import { refreshLink } from "~/trpc/refresh-link";
import { useRouter } from "next/navigation";
import { authChannel, type AuthChannelMessage } from "~/lib/auth-channel";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;



function useAuthChannelListener() {
  const router = useRouter();

  React.useEffect(() => {
    function handleMessage(event: MessageEvent<AuthChannelMessage>) {
      if (event.data.type === "logout") {
        router.push("/login");
        router.refresh();
      }
    }
    authChannel.addEventListener("message", handleMessage);
    return () => authChannel.removeEventListener("message", handleMessage);
  }, [router]);
}



export const GlobalProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  useAuthChannelListener();
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [refreshLink, createTRPCHttpBatchClientClient()],
    }),
  );

  const content = (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider queryClient={queryClient} client={trpcClient}>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </trpc.Provider>
        {process.env.NODE_ENV !== "production" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );

  if (!GOOGLE_CLIENT_ID) {
    return content;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>
  );
};