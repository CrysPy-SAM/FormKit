import type { ReactNode } from "react";
import { SettingsNav } from "~/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, security, and workspace preferences.
        </p>
      </div>
      <SettingsNav />
      <div className="animate-fade-up">{children}</div>
    </div>
  );
}
