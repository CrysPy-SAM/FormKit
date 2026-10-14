import { cn } from "~/lib/utils";

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-6", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M10 9.5C10 8.67157 10.6716 8 11.5 8H21.5C22.3284 8 23 8.67157 23 9.5C23 10.3284 22.3284 11 21.5 11H14C13.4477 11 13 11.4477 13 12V14H20C20.8284 14 21.5 14.6716 21.5 15.5C21.5 16.3284 20.8284 17 20 17H13V22.5C13 23.3284 12.3284 24 11.5 24C10.6716 24 10 23.3284 10 22.5V9.5Z"
        className="fill-primary-foreground"
      />
    </svg>
  );
}

function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold text-foreground", className)}>
      <LogoMark />
      {!iconOnly && <span className="text-[15px] tracking-tight">FormKit</span>}
    </span>
  );
}

export { Logo, LogoMark };
