"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { useMe } from "~/hooks/use-me";
import { getActiveOrgIdClient, setActiveOrgIdClient } from "~/lib/org-cookie";

type OrgSummary = {
  id: string;
  slug: string;
  name: string;
  isPersonal: boolean;
  role: string;
};

type WorkspaceContextValue = {
  orgs: OrgSummary[];
  activeOrg: OrgSummary | null;
  switchOrg: (orgId: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

const noopSubscribe = () => () => {};

/**
 * Resolves the active org (from the `active_org_id` cookie the tRPC client
 * reads on every request) and only renders org-scoped children once it's
 * settled, so first-paint queries never fire with a stale/mismatched header.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: me, isLoading, isError } = useMe();

  // Cookies aren't a subscribable store, so this just reads once per render
  // pass — switchOrg below drives updates explicitly via invalidate/refresh.
  const cookieOrgId = useSyncExternalStore(
    noopSubscribe,
    getActiveOrgIdClient,
    () => null,
  );

  const orgs = me?.orgs ?? [];
  const matchedOrg = orgs.find((o) => o.id === cookieOrgId);
  const activeOrg = matchedOrg ?? orgs[0] ?? null;

  useEffect(() => {
    if (activeOrg && activeOrg.id !== cookieOrgId) {
      setActiveOrgIdClient(activeOrg.id);
    }
  }, [activeOrg, cookieOrgId]);

  useEffect(() => {
    if (isError) {
      window.location.href = "/login";
    }
  }, [isError]);

  const switchOrg = useCallback(
    (orgId: string) => {
      setActiveOrgIdClient(orgId);
      void utils.invalidate();
      router.refresh();
    },
    [utils, router],
  );

  if (isError) {
    return <WorkspaceSkeleton />;
  }

  if (isLoading || !me || !activeOrg) {
    return <WorkspaceSkeleton />;
  }

  return (
    <WorkspaceContext.Provider value={{ orgs, activeOrg, switchOrg }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    </div>
  );
}
