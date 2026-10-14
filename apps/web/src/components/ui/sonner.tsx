"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      style={
        {
          "--normal-bg": "var(--color-popover)",
          "--normal-text": "var(--color-popover-foreground)",
          "--normal-border": "var(--color-border)",
          "--success-bg": "var(--color-popover)",
          "--success-text": "var(--color-success)",
          "--error-bg": "var(--color-popover)",
          "--error-text": "var(--color-destructive)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
