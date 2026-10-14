import { CheckSquare, ChevronDownSquare, GripVertical, Star, Type } from "lucide-react";

const MOCK_FIELDS = [
  { icon: Type, label: "Full name", type: "Short text", required: true },
  { icon: ChevronDownSquare, label: "Team size", type: "Dropdown", required: true },
  { icon: CheckSquare, label: "Interests", type: "Checkboxes", required: false },
  { icon: Star, label: "How was your experience?", type: "Rating", required: false },
];

export function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="absolute inset-0 -z-10 translate-y-6 scale-[0.97] rounded-2xl bg-muted/60 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <span className="size-2.5 rounded-full bg-destructive/50" />
          <span className="size-2.5 rounded-full bg-warning/50" />
          <span className="size-2.5 rounded-full bg-success/50" />
          <span className="ml-3 text-xs text-muted-foreground">
            formkit.app/forms/customer-feedback
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr]">
          <div className="hidden flex-col gap-1 border-r border-border p-3 sm:flex">
            {["Short text", "Long text", "Dropdown", "Choice", "Rating"].map((label, i) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground"
              >
                <span className="flex size-5 items-center justify-center rounded bg-muted">
                  <Type className="size-3" />
                </span>
                {label}
                {i === 0 && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 p-4 sm:p-5">
            {MOCK_FIELDS.map((field) => {
              const Icon = field.icon;
              return (
                <div
                  key={field.label}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3"
                >
                  <GripVertical className="size-3.5 shrink-0 text-muted-foreground/40" />
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{field.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {field.type}
                      {field.required ? " · Required" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-3 text-xs text-muted-foreground">
              + Add question
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
