"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import {
  DEFAULT_FORM_THEME,
  resolveFormTheme,
  getThemeCssVars,
  RADIUS_PX,
  CARD_SHADOW,
  type FormTheme,
} from "~/lib/form-theme";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-card p-1"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs"
          maxLength={20}
        />
      </div>
    </div>
  );
}

export function ThemeEditorDialog({
  formId,
  theme,
  trigger,
}: {
  formId: string;
  theme?: FormTheme;
  trigger: ReactNode;
}) {
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<FormTheme>(() => ({ ...theme }));
  const [open, setOpen] = useState(false);

  const update = trpc.forms.update.useMutation({
    onSuccess: () => {
      toast.success("Theme saved");
      void utils.forms.get.invalidate({ formId });
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || "Couldn't save the theme"),
  });

  const preview = resolveFormTheme(draft);
  const previewVars = getThemeCssVars(preview);

  function set<K extends keyof FormTheme>(key: K, value: FormTheme[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft({ ...theme });
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Form theme</DialogTitle>
          <DialogDescription>
            Customize how this form looks to people filling it out. Changes apply the next time
            you publish.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_200px]">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <ColorField
                label="Accent color"
                value={preview.accentColor}
                onChange={(v) => set("accentColor", v)}
              />
              <ColorField
                label="Background color"
                value={preview.backgroundColor}
                onChange={(v) => set("backgroundColor", v)}
              />
              <ColorField
                label="Text color"
                value={preview.textColor}
                onChange={(v) => set("textColor", v)}
              />
              <ColorField
                label="Button text color"
                value={preview.buttonTextColor}
                onChange={(v) => set("buttonTextColor", v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Font</Label>
                <Select value={preview.fontFamily} onValueChange={(v) => set("fontFamily", v as FormTheme["fontFamily"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans">Sans-serif</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="mono">Monospace</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Corner radius</Label>
                <Select value={preview.borderRadius} onValueChange={(v) => set("borderRadius", v as FormTheme["borderRadius"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="full">Full (pill)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Card style</Label>
                <Select value={preview.cardStyle} onValueChange={(v) => set("cardStyle", v as FormTheme["cardStyle"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="bordered">Bordered</SelectItem>
                    <SelectItem value="shadow">Shadow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Layout</Label>
                <Select value={preview.layout} onValueChange={(v) => set("layout", v as FormTheme["layout"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="centered">Centered card</SelectItem>
                    <SelectItem value="full-bleed">Full width</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Progress indicator</Label>
                <Select value={preview.progressStyle} onValueChange={(v) => set("progressStyle", v as FormTheme["progressStyle"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Progress bar</SelectItem>
                    <SelectItem value="steps">Step dots</SelectItem>
                    <SelectItem value="none">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Logo URL (optional)</Label>
                <Input
                  type="url"
                  placeholder="https://…"
                  value={draft.logoUrl ?? ""}
                  onChange={(e) => set("logoUrl", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Live preview</Label>
            <div
              style={previewVars}
              className="flex h-full flex-col items-center justify-center gap-3 rounded-lg bg-background p-4 font-sans text-foreground"
            >
              <div className="w-full rounded-md bg-card p-3" style={{ boxShadow: CARD_SHADOW[preview.cardStyle] }}>
                <p className="text-sm font-medium text-foreground">What&apos;s your name?</p>
                <div
                  className="mt-2 h-8 w-full border border-input bg-card"
                  style={{ borderRadius: RADIUS_PX[preview.borderRadius] }}
                />
                <button
                  type="button"
                  className="mt-3 px-3 py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: preview.accentColor,
                    color: preview.buttonTextColor,
                    borderRadius: RADIUS_PX[preview.borderRadius],
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setDraft({ ...DEFAULT_FORM_THEME, logoUrl: undefined })}
            disabled={update.isPending}
          >
            Reset to default
          </Button>
          <Button onClick={() => update.mutate({ formId, theme: draft })} loading={update.isPending}>
            Save theme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
