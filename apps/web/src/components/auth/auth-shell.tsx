import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "~/components/logo";

const HIGHLIGHTS = [
  "Build forms with a drag-and-drop editor built for speed",
  "Publish once, collect responses from anywhere",
  "Give every teammate the right level of access",
];

export function AuthShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1.5px 1.5px, currentColor 1.5px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <Link href="/" className="relative z-10 w-fit">
          <Logo className="text-background" />
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="font-serif text-3xl leading-snug text-balance">
            &ldquo;The fastest way we&apos;ve found to turn a question into a
            finished, on-brand form.&rdquo;
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm text-background/70">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-background/50" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-background/40">
          © {new Date().getFullYear()} FormKit. All rights reserved.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 flex w-fit lg:hidden">
            <Logo />
          </Link>

          <div className="mb-8 animate-fade-up">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="animate-fade-up [animation-delay:60ms]">{children}</div>
        </div>
      </div>
    </div>
  );
}
