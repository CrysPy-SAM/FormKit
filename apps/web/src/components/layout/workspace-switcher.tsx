"use client";

import Link from "next/link";
import { Check, ChevronsUpDown, Users } from "lucide-react";
import { useWorkspace } from "~/providers/workspace";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function WorkspaceSwitcher() {
  const { orgs, activeOrg, switchOrg } = useWorkspace();

  if (!activeOrg) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 text-left shadow-xs transition-colors hover:bg-muted",
            "focus-visible:ring-2 focus-visible:ring-ring outline-none",
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            {initialsFor(activeOrg.name)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {activeOrg.name}
            </span>
            <span className="truncate text-xs text-muted-foreground capitalize">
              {activeOrg.role.toLowerCase()}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {orgs.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => switchOrg(org.id)}>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent text-[10px] font-semibold text-accent-foreground">
              {initialsFor(org.name)}
            </span>
            <span className="min-w-0 flex-1 truncate">{org.name}</span>
            {org.id === activeOrg.id && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/workspace">
            <Users className="size-4" />
            Workspace settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
