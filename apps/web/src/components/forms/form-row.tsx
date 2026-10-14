"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "~/lib/format";
import { MoreHorizontal, Eye, Link2, PenSquare, Rocket } from "lucide-react";
import { toast } from "sonner";
import type { RouterOutputs } from "@formkit/trpc/client";
import { trpc } from "~/trpc/client";
import { FormStatusBadge } from "~/components/forms/status-badge";
import { getPublicFormUrl } from "~/lib/public-form-url";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

type FormSummary = RouterOutputs["forms"]["list"][number];

export function FormRow({ form }: { form: FormSummary }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const publish = trpc.forms.publish.useMutation({
    onSuccess: () => {
      toast.success("Form published");
      void utils.forms.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Couldn't publish this form"),
  });

  return (
    <div className="group flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-5">
      <Link
        href={`/forms/${form.id}`}
        className="flex min-w-0 flex-1 flex-col gap-1 outline-none"
      >
        <span className="truncate text-sm font-medium text-foreground group-hover:text-primary">
          {form.title}
        </span>
        <span className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(form.createdAt)}
        </span>
      </Link>

      <FormStatusBadge status={form.status} />

      <div className="hidden items-center gap-1 sm:flex">
        <Button variant="ghost" size="icon" asChild aria-label="Preview form">
          <Link href={`/forms/${form.id}/preview`}>
            <Eye className="size-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild aria-label="Edit form">
          <Link href={`/forms/${form.id}`}>
            <PenSquare className="size-4" />
          </Link>
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}`)}>
            <PenSquare className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/preview`)}>
            <Eye className="size-4" />
            Preview
          </DropdownMenuItem>
          {form.status === "draft" && (
            <DropdownMenuItem
              onClick={() => publish.mutate({ formId: form.id })}
              disabled={publish.isPending}
            >
              <Rocket className="size-4" />
              Publish
            </DropdownMenuItem>
          )}
          {form.status === "published" && (
            <DropdownMenuItem
              onClick={() => {
                void navigator.clipboard.writeText(getPublicFormUrl(form.slug));
                toast.success("Link copied");
              }}
            >
              <Link2 className="size-4" />
              Copy link
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function FormRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-5">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="h-4 w-40 animate-shimmer bg-shimmer rounded" />
        <div className="h-3 w-24 animate-shimmer bg-shimmer rounded" />
      </div>
      <div className="h-5 w-16 animate-shimmer bg-shimmer rounded" />
    </div>
  );
}
