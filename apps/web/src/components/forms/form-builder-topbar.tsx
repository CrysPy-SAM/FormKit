"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Check, Copy, Eye, Inbox, Palette, Rocket, Share2, Timer, Workflow } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import type { RouterOutputs } from "@formkit/trpc/client";
import { FormStatusBadge } from "~/components/forms/status-badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { getPublicFormUrl } from "~/lib/public-form-url";
import { ThemeEditorDialog } from "~/components/forms/theme-editor-dialog";
import { FormCloseSettingsDialog } from "~/components/forms/form-close-settings-dialog";

type FormWithFields = RouterOutputs["forms"]["get"];

export function FormBuilderTopbar({ form }: { form: FormWithFields }) {
  const utils = trpc.useUtils();
  // FormBuilder (the parent) is keyed by formId, so this remounts — and
  // local state re-initializes — whenever a different form is opened.
  const [title, setTitle] = useState(form.title);

  const updateForm = trpc.forms.update.useMutation({
    onSuccess: () => {
      void utils.forms.get.invalidate({ formId: form.id });
      void utils.forms.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Couldn't rename this form"),
  });

  const publish = trpc.forms.publish.useMutation({
    onSuccess: () => {
      toast.success("Form published");
      void utils.forms.get.invalidate({ formId: form.id });
      void utils.forms.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Couldn't publish this form"),
  });

  function commitTitle() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === form.title) {
      setTitle(form.title);
      return;
    }
    updateForm.mutate({ formId: form.id, title: trimmed });
  }

  return (
    <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
      <Button variant="ghost" size="icon" asChild className="shrink-0">
        <Link href="/forms" aria-label="Back to forms">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-8 max-w-xs border-transparent bg-transparent px-1.5 text-sm font-medium shadow-none hover:border-input focus-visible:border-input"
        aria-label="Form title"
      />

      <FormStatusBadge status={form.status} />

      <div className="flex-1" />

      <Button variant="secondary" size="sm" asChild>
        <Link href={`/forms/${form.id}/responses`}>
          <Inbox className="size-4" />
          Responses
        </Link>
      </Button>

      <Button variant="secondary" size="sm" asChild>
        <Link href={`/forms/${form.id}/analytics`}>
          <BarChart3 className="size-4" />
          Analytics
        </Link>
      </Button>

      <Button variant="secondary" size="sm" asChild>
        <Link href={`/forms/${form.id}/preview`}>
          <Eye className="size-4" />
          Preview
        </Link>
      </Button>

      <ThemeEditorDialog
        formId={form.id}
        theme={form.theme}
        trigger={
          <Button variant="secondary" size="sm">
            <Palette className="size-4" />
            Theme
          </Button>
        }
      />

      <Button variant="secondary" size="sm" asChild>
        <Link href={`/forms/${form.id}/logic`}>
          <Workflow className="size-4" />
          Logic
        </Link>
      </Button>

      <FormCloseSettingsDialog
        formId={form.id}
        closeSettings={form.closeSettings}
        trigger={
          <Button variant="secondary" size="sm">
            <Timer className="size-4" />
            Limits
          </Button>
        }
      />

      {form.status === "published" && <ShareLinkPopover slug={form.slug} />}

      {form.status === "draft" && (
        <Button
          size="sm"
          onClick={() => publish.mutate({ formId: form.id })}
          loading={publish.isPending}
        >
          <Rocket className="size-4" />
          Publish
        </Button>
      )}
    </div>
  );
}

function ShareLinkPopover({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = getPublicFormUrl(slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm">
          <Share2 className="size-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="text-sm font-medium text-foreground">Public link</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Anyone with this link can fill out and submit your form.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Input value={getPublicFormUrl(slug)} readOnly className="text-xs" onFocus={(e) => e.currentTarget.select()} />
          <Button size="icon" variant="secondary" className="shrink-0" onClick={copyLink} aria-label="Copy link">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
