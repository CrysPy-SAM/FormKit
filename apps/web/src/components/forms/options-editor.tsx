"use client";

import { GripVertical, Plus, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

type FieldOption = { id: string; label: string };

export function OptionsEditor({
  options,
  onChange,
}: {
  options: FieldOption[];
  onChange: (options: FieldOption[]) => void;
}) {
  function updateLabel(id: string, label: string) {
    onChange(options.map((o) => (o.id === id ? { ...o, label } : o)));
  }

  function addOption() {
    onChange([
      ...options,
      { id: crypto.randomUUID(), label: `Option ${options.length + 1}` },
    ]);
  }

  function removeOption(id: string) {
    onChange(options.filter((o) => o.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <div key={option.id} className="flex items-center gap-1.5">
          <GripVertical className="size-3.5 shrink-0 text-muted-foreground/40" />
          <Input
            value={option.label}
            onChange={(e) => updateLabel(option.id, e.target.value)}
            className="h-8 text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeOption(option.id)}
            disabled={options.length <= 1}
            aria-label="Remove option"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={addOption}
        className="mt-1 w-fit text-muted-foreground"
      >
        <Plus className="size-3.5" />
        Add option
      </Button>
    </div>
  );
}
