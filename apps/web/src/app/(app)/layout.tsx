import type { ReactNode } from "react";
import { WorkspaceProvider } from "~/providers/workspace";
import { Sidebar } from "~/components/layout/sidebar";
import { Topbar } from "~/components/layout/topbar";
import { VerifyEmailBanner } from "~/components/layout/verify-email-banner";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="flex min-h-svh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <VerifyEmailBanner />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
