"use client";

import { useState } from "react";
import type { RouterOutputs } from "@formkit/trpc/client";
import { FIELD_TYPE_MAP } from "~/components/forms/field-types";
import { OptionsEditor } from "~/components/forms/options-editor";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type FormField = RouterOutputs["forms"]["get"]["fields"][number];
type FieldPatch = {
  label?: string;
  required?: boolean;
  config?: FormField["config"];
};

// Only single-value choice fields make an unambiguous "is / is not" source —
// checkbox (multi-select) and free-text types are excluded on purpose.
const CONDITION_SOURCE_TYPES = new Set(["radio", "select", "yes_no"]);

function optionsFor(field: FormField): { id: string; label: string }[] {
  if (field.type === "yes_no") return [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }];
  return field.config?.options ?? [];
}

function ConditionalLogicEditor({
  field,
  allFields,
  onUpdate,
}: {
  field: FormField;
  allFields: FormField[];
  onUpdate: (patch: FieldPatch) => void;
}) {
  const eligibleSources = allFields.filter(
    (f) => f.id !== field.id && f.order < field.order && CONDITION_SOURCE_TYPES.has(f.type),
  );
  const condition = field.config?.conditionalLogic?.[0];
  const sourceField = condition ? allFields.find((f) => f.id === condition.fieldId) : undefined;
  const sourceMissing = !!condition && !sourceField;

  function setCondition(next: { fieldId: string; operator: "equals" | "not_equals"; value: string } | undefined) {
    onUpdate({ config: { ...field.config, conditionalLogic: next ? [next] : [] } });
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Show this question only if…</Label>

      {eligibleSources.length === 0 && !sourceMissing ? (
        <p className="text-xs text-muted-foreground">
          Add a multiple-choice, dropdown, or yes/no question earlier in the form to enable skip
          logic here.
        </p>
      ) : (
        <>
          {sourceMissing && (
            <p className="text-xs text-warning-foreground">
              The referenced question was deleted. Choose a new one or clear this rule.
            </p>
          )}

          <Select
            value={condition?.fieldId ?? "always"}
            onValueChange={(value) => {
              if (value === "always") {
                setCondition(undefined);
                return;
              }
              const first = optionsFor(allFields.find((f) => f.id === value)!)[0];
              setCondition({ fieldId: value, operator: "equals", value: first?.id ?? "" });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Always show" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">Always show</SelectItem>
              {eligibleSources.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {condition && sourceField && (
            <div className="flex items-center gap-2">
              <Select
                value={condition.operator}
                onValueChange={(operator) =>
                  setCondition({ ...condition, operator: operator as "equals" | "not_equals" })
                }
              >
                <SelectTrigger className="w-28 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Is</SelectItem>
                  <SelectItem value="not_equals">Is not</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={condition.value}
                onValueChange={(value) => setCondition({ ...condition, value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {optionsFor(sourceField).map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function FieldInspector({
  field,
  allFields,
  onUpdate,
}: {
  field: FormField;
  allFields: FormField[];
  onUpdate: (patch: FieldPatch) => void;
}) {
  const meta = FIELD_TYPE_MAP[field.type];
  // The parent renders this component keyed by field.id, so local state
  // below re-initializes automatically whenever the selected field changes.
  const [label, setLabel] = useState(field.label);
  const [placeholder, setPlaceholder] = useState(field.config?.placeholder ?? "");

  const options = field.config?.options ?? [{ id: crypto.randomUUID(), label: "Option 1" }];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{meta.label}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="field-label">Question</Label>
        <Input
          id="field-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => label.trim() && onUpdate({ label: label.trim() })}
        />
      </div>

      {meta.hasPlaceholder && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field-placeholder">Placeholder</Label>
          <Input
            id="field-placeholder"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            onBlur={() =>
              onUpdate({ config: { ...field.config, placeholder: placeholder || undefined } })
            }
          />
        </div>
      )}

      {meta.hasOptions && (
        <div className="flex flex-col gap-1.5">
          <Label>Options</Label>
          <OptionsEditor
            options={options}
            onChange={(next) => onUpdate({ config: { ...field.config, options: next } })}
          />

          <div className="mt-2 flex items-center justify-between">
            <Label htmlFor="field-allow-other" className="font-normal text-muted-foreground">
              Allow &ldquo;Other&rdquo; option
            </Label>
            <Switch
              id="field-allow-other"
              checked={field.config?.allowOther ?? false}
              onCheckedChange={(checked) =>
                onUpdate({ config: { ...field.config, allowOther: checked } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="field-randomize" className="font-normal text-muted-foreground">
              Randomize order
            </Label>
            <Switch
              id="field-randomize"
              checked={field.config?.randomizeOrder ?? false}
              onCheckedChange={(checked) =>
                onUpdate({ config: { ...field.config, randomizeOrder: checked } })
              }
            />
          </div>
        </div>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <Label htmlFor="field-required" className="font-normal">
          Required
        </Label>
        <Switch
          id="field-required"
          checked={field.required}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>

      <Separator />
      <ConditionalLogicEditor field={field} allFields={allFields} onUpdate={onUpdate} />
    </div>
  );
}
