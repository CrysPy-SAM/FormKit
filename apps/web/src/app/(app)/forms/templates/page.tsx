"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FilePlus2, LayoutTemplate, Search } from "lucide-react";
import type { RouterOutputs } from "@formkit/trpc/client";
import { trpc } from "~/trpc/client";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { EmptyState } from "~/components/dashboard/empty-state";
import { ErrorState } from "~/components/dashboard/error-state";
import { TemplateCard } from "~/components/forms/template-card";
import { getTemplateIcon } from "~/lib/template-icons";
import { TemplatePreviewDialog } from "~/components/forms/template-preview-dialog";
import { UseTemplateDialog } from "~/components/forms/use-template-dialog";

type FormTemplate = RouterOutputs["forms"]["templates"]["list"][number];

export default function FormTemplatesPage() {
  const templatesQuery = trpc.forms.templates.list.useQuery();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [previewing, setPreviewing] = useState<FormTemplate | null>(null);
  const [using, setUsing] = useState<FormTemplate | null>(null);

  const categories = useMemo(() => {
    const set = new Set((templatesQuery.data ?? []).map((t) => t.category));
    return ["all", ...Array.from(set)];
  }, [templatesQuery.data]);

  const filtered = useMemo(() => {
    return (templatesQuery.data ?? [])
      .filter((t) => category === "all" || t.category === category)
      .filter((t) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      });
  }, [templatesQuery.data, category, query]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 animate-fade-up">
        <Link
          href="/forms"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to forms
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Form templates</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Start from a professional template, then customize everything — questions, fields,
              theme, and more.
            </p>
          </div>
          <Button variant="secondary" asChild>
            <Link href="/forms/new">
              <FilePlus2 className="size-4" />
              Start from blank
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={category} onValueChange={setCategory} className="min-w-0">
          {/* Many categories don't fit one row on small screens — scroll
              horizontally rather than wrap, since TabsList has a fixed
              height and a wrapped second row would just get clipped. */}
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <TabsList className="w-max">
              {categories.map((c) => (
                <TabsTrigger key={c} value={c}>
                  {c === "all" ? "All" : c}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        <div className="relative w-full lg:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="pl-8"
          />
        </div>
      </div>

      {templatesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-56 animate-shimmer bg-shimmer" />
          ))}
        </div>
      ) : templatesQuery.isError ? (
        <ErrorState description={templatesQuery.error.message} onRetry={() => templatesQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No matching templates"
          description="Try a different search or category."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              icon={getTemplateIcon(template.icon)}
              onPreview={() => setPreviewing(template)}
              onUse={() => setUsing(template)}
            />
          ))}
        </div>
      )}

      <TemplatePreviewDialog
        template={previewing}
        open={!!previewing}
        onOpenChange={(open) => !open && setPreviewing(null)}
        onUseTemplate={(t) => {
          setPreviewing(null);
          setUsing(t);
        }}
      />

      <UseTemplateDialog
        template={using}
        open={!!using}
        onOpenChange={(open) => !open && setUsing(null)}
      />
    </div>
  );
}
