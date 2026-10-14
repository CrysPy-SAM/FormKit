"use client";

import type { LucideIcon } from "lucide-react";
import type { RouterOutputs } from "@formkit/trpc/client";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Eye, ArrowRight, GitBranch, Paperclip, Star } from "lucide-react";

type FormTemplate = RouterOutputs["forms"]["templates"]["list"][number];

function CapabilityIcon({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span
      title={label}
      aria-label={label}
      className="flex size-5 items-center justify-center rounded text-muted-foreground"
    >
      <Icon className="size-3.5" />
    </span>
  );
}

export function TemplateCard({
  template,
  icon: Icon,
  onPreview,
  onUse,
}: {
  template: FormTemplate;
  icon: LucideIcon;
  onPreview: () => void;
  onUse: () => void;
}) {
  const accent = template.theme.accentColor ?? "#4338ca";
  const hasConditionalLogic = template.fields.some((f) => !!f.config?.conditionalLogic?.length);
  const hasFileUpload = template.fields.some((f) => f.type === "file_upload");
  const hasRating = template.fields.some((f) => f.type === "rating");

  return (
    <Card className="group flex flex-col gap-4 p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div
          className="flex size-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}
        >
          <Icon className="size-5" />
        </div>
        <Badge variant="outline">{template.category}</Badge>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
        <p className="text-xs text-muted-foreground">{template.description}</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {template.fields.length} question{template.fields.length === 1 ? "" : "s"}
        </p>
        {(hasConditionalLogic || hasFileUpload || hasRating) && (
          <div className="flex items-center gap-0.5">
            {hasConditionalLogic && <CapabilityIcon icon={GitBranch} label="Conditional logic" />}
            {hasFileUpload && <CapabilityIcon icon={Paperclip} label="File upload" />}
            {hasRating && <CapabilityIcon icon={Star} label="Rating" />}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={onPreview}>
          <Eye className="size-3.5" />
          Preview
        </Button>
        <Button size="sm" className="flex-1" onClick={onUse}>
          Use template
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </Card>
  );
}
