import Link from "next/link";
import { Plus } from "lucide-react";
import { Logo } from "~/components/logo";
import { Button } from "~/components/ui/button";
import { SidebarNav } from "~/components/layout/sidebar-nav";
import { WorkspaceSwitcher } from "~/components/layout/workspace-switcher";
import { UsagePanel } from "~/components/layout/usage-panel";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-5 py-5">
      <div className="px-4">
        <Link href="/dashboard" className="flex w-fit">
          <Logo />
        </Link>
      </div>

      <div className="px-3">
        <WorkspaceSwitcher />
      </div>

      <div className="px-3">
        <Button asChild className="w-full justify-start" size="sm">
          <Link href="/forms/new" onClick={onNavigate}>
            <Plus className="size-4" />
            New form
          </Link>
        </Button>
      </div>

      <SidebarNav onNavigate={onNavigate} />

      <div className="mt-auto">
        <UsagePanel />
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <div className="sticky top-0 h-svh">
        <SidebarContent />
      </div>
    </aside>
  );
}
