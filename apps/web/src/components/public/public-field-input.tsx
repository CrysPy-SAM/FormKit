"use client";

import { useState, type ChangeEvent } from "react";
import { File as FileIcon, Loader2, Star, Upload, X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import type { PublicField } from "~/lib/public-form-schema";
import { uploadResponseFile, ALLOWED_UPLOAD_EXTENSIONS, type UploadedFile } from "~/lib/uploads";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUploadField({
  fieldId,
  slug,
  value,
  onChange,
  onUploadingChange,
}: {
  fieldId: string;
  slug?: string;
  value: UploadedFile | undefined;
  onChange: (value: UploadedFile | undefined) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = `${fieldId}-file`;

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-selected later if removed
    if (!file || !slug) return;

    setError(null);
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const uploaded = await uploadResponseFile(slug, file);
      onChange(uploaded);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't upload the file";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  if (!slug) {
    return (
      <div className="mt-2 flex max-w-lg items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-sm text-muted-foreground">
        File upload will be available once this form is published.
      </div>
    );
  }

  if (value) {
    return (
      <div className="mt-2 flex max-w-lg items-center justify-between gap-3 rounded-lg border border-input bg-card px-4 py-3 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <FileIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-foreground">{value.filename}</span>
          <span className="shrink-0 text-xs text-muted-foreground">({formatFileSize(value.size)})</span>
        </span>
        <button
          type="button"
          data-step-input
          onClick={() => onChange(undefined)}
          aria-label="Remove file"
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 max-w-lg">
      <label
        data-step-input
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-sm text-muted-foreground transition-colors hover:bg-muted",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Upload className="size-5" />
            Click to choose a file
            <span className="text-xs">Max 10MB</span>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept={ALLOWED_UPLOAD_EXTENSIONS}
          className="sr-only"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </label>
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  );
}

/** Single-choice types auto-advance a beat after a selection is made, the
 * same way Typeform-style step forms do — everything else needs an explicit
 * Continue (multi-select, free text, rating). */
export function isAutoAdvanceType(type: string) {
  return type === "radio" || type === "yes_no" || type === "select";
}

export function PublicFieldInput({
  field,
  onAutoAdvance,
  slug,
  onUploadingChange,
}: {
  field: PublicField;
  onAutoAdvance?: () => void;
  slug?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const { control } = useFormContext();
  const options = field.config?.options ?? [];

  if (field.type === "statement") {
    return (
      <p className="text-xl leading-relaxed font-medium text-foreground sm:text-2xl">
        {field.label}
      </p>
    );
  }

  return (
    <FormField
      control={control}
      name={field.id}
      render={({ field: rhf }) => (
        <FormItem>
          <FormLabel className="text-xl leading-snug font-medium text-foreground sm:text-2xl">
            {field.label}
            {field.required && <span className="ml-1.5 text-primary">*</span>}
          </FormLabel>

          <FormControl>
            {(() => {
              switch (field.type) {
                case "short_text":
                case "email":
                case "url":
                case "phone_number":
                  return (
                    <Input
                      data-step-input
                      type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                      placeholder={field.config?.placeholder}
                      className="mt-2 h-12 max-w-lg text-base"
                      {...rhf}
                      value={rhf.value ?? ""}
                    />
                  );
                case "number":
                  return (
                    <Input
                      data-step-input
                      type="number"
                      placeholder={field.config?.placeholder}
                      className="mt-2 h-12 max-w-lg text-base"
                      {...rhf}
                      value={rhf.value ?? ""}
                    />
                  );
                case "date":
                  return (
                    <Input
                      data-step-input
                      type="date"
                      className="mt-2 h-12 max-w-xs text-base"
                      {...rhf}
                      value={rhf.value ?? ""}
                    />
                  );
                case "long_text":
                  return (
                    <Textarea
                      data-step-input
                      placeholder={field.config?.placeholder}
                      className="mt-2 max-w-lg text-base"
                      rows={5}
                      {...rhf}
                      value={rhf.value ?? ""}
                    />
                  );
                case "select":
                  return (
                    <Select
                      value={rhf.value ?? ""}
                      onValueChange={(v) => {
                        rhf.onChange(v);
                        onAutoAdvance?.();
                      }}
                    >
                      <SelectTrigger data-step-input className="mt-2 h-12 max-w-lg text-base">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                        {field.config?.allowOther && <SelectItem value="other">Other</SelectItem>}
                      </SelectContent>
                    </Select>
                  );
                case "radio":
                case "yes_no": {
                  const items =
                    field.type === "yes_no"
                      ? [
                          { id: "yes", label: "Yes" },
                          { id: "no", label: "No" },
                        ]
                      : field.config?.allowOther
                        ? [...options, { id: "other", label: "Other" }]
                        : options;
                  return (
                    <RadioGroup
                      value={rhf.value ?? ""}
                      onValueChange={(v) => {
                        rhf.onChange(v);
                        onAutoAdvance?.();
                      }}
                      className="mt-3 gap-3"
                    >
                      {items.map((option, i) => (
                        <label
                          key={option.id}
                          htmlFor={`${field.id}-${option.id}`}
                          data-step-input={i === 0 ? true : undefined}
                          className="flex max-w-lg cursor-pointer items-center gap-3 rounded-lg border border-input bg-card px-4 py-3 text-base transition-colors hover:bg-muted has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
                        >
                          <RadioGroupItem id={`${field.id}-${option.id}`} value={option.id} />
                          {option.label}
                        </label>
                      ))}
                    </RadioGroup>
                  );
                }
                case "checkbox": {
                  const selected: string[] = Array.isArray(rhf.value) ? rhf.value : [];
                  const items = field.config?.allowOther
                    ? [...options, { id: "other", label: "Other" }]
                    : options;
                  return (
                    <div className="mt-3 flex flex-col gap-3">
                      {items.map((option, i) => (
                        <label
                          key={option.id}
                          htmlFor={`${field.id}-${option.id}`}
                          data-step-input={i === 0 ? true : undefined}
                          className="flex max-w-lg cursor-pointer items-center gap-3 rounded-lg border border-input bg-card px-4 py-3 text-base transition-colors hover:bg-muted has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
                        >
                          <Checkbox
                            id={`${field.id}-${option.id}`}
                            checked={selected.includes(option.id)}
                            onCheckedChange={(checked) => {
                              rhf.onChange(
                                checked
                                  ? [...selected, option.id]
                                  : selected.filter((v) => v !== option.id),
                              );
                            }}
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  );
                }
                case "rating": {
                  const ratingValue = Number(rhf.value) || 0;
                  return (
                    <div className="mt-3 flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          data-step-input={i === 0 ? true : undefined}
                          onClick={() => rhf.onChange(i + 1)}
                          aria-label={`Rate ${i + 1} out of 5`}
                          className="text-muted-foreground/40 transition-transform hover:scale-110 hover:text-warning"
                        >
                          <Star
                            className={cn("size-9", i < ratingValue && "fill-warning text-warning")}
                          />
                        </button>
                      ))}
                    </div>
                  );
                }
                case "file_upload":
                  return (
                    <FileUploadField
                      fieldId={field.id}
                      slug={slug}
                      value={rhf.value as UploadedFile | undefined}
                      onChange={rhf.onChange}
                      onUploadingChange={onUploadingChange}
                    />
                  );
                default:
                  return <Input data-step-input className="mt-2 max-w-lg" {...rhf} />;
              }
            })()}
          </FormControl>
          <FormMessage className="text-sm" />
        </FormItem>
      )}
    />
  );
}
