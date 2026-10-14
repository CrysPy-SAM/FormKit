"use client";

import { FIELD_TYPES, type FieldType } from "~/components/forms/field-types";

const GROUPS = ["Text", "Choice", "Other"] as const;

export function FieldPalette({
  onAdd,
  disabled,
}: {
  onAdd: (type: FieldType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">{group}</p>
          <div className="flex flex-col gap-0.5">
            {FIELD_TYPES.filter((f) => f.group === group).map((fieldType) => {
              const Icon = fieldType.icon;
              return (
                <button
                  key={fieldType.type}
                  type="button"
                  disabled={disabled}
                  onClick={() => onAdd(fieldType.type)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="size-3.5" />
                  </span>
                  {fieldType.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
