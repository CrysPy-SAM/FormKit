"use client";

import { toast } from "sonner";
import type { RouterOutputs } from "@formkit/trpc/client";
import type { PublicField } from "~/lib/public-form-schema";
import { resolveFormTheme, getThemeCssVars } from "~/lib/form-theme";
import { StepForm } from "~/components/public/step-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

type FormTemplate = RouterOutputs["forms"]["templates"]["list"][number];

export function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onUseTemplate,
}: {
  template: FormTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (template: FormTemplate) => void;
}) {
  if (!template) return null;

  const fields: PublicField[] = template.fields.map((field) => ({
    id: field.id,
    type: field.type,
    label: field.label,
    required: field.required ?? false,
    config: field.config ?? {},
  }));

  const theme = resolveFormTheme(template.theme);
  const cssVars = getThemeCssVars(theme);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div style={cssVars} className="rounded-2xl bg-background p-1 font-sans text-foreground">
          <div className="rounded-xl bg-card p-6" style={{ boxShadow: cssVars.boxShadow }}>
            <StepForm
              key={template.id}
              fields={fields}
              progressStyle={theme.progressStyle}
              submitLabel="Submit"
              onComplete={() => toast.success("This is just a preview — nothing was submitted.")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onUseTemplate(template)}>Use this template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
