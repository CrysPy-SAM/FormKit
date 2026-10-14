"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import type { RouterOutputs } from "@formkit/trpc/client";
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
import { Switch } from "~/components/ui/switch";
import { Separator } from "~/components/ui/separator";

type CloseSettings = RouterOutputs["forms"]["get"]["closeSettings"];

/** `datetime-local` inputs want "YYYY-MM-DDTHH:mm" in the viewer's local
 * time, not a UTC ISO string — convert both directions at the edges. */
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function FormCloseSettingsDialog({
  formId,
  closeSettings,
  trigger,
}: {
  formId: string;
  closeSettings: CloseSettings;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {open && (
        // Keyed remount (via `open &&`) re-initializes local draft state from
        // the latest saved settings each time the dialog is reopened.
        <CloseSettingsDialogContent formId={formId} closeSettings={closeSettings} onClose={() => setOpen(false)} />
      )}
    </Dialog>
  );
}

function CloseSettingsDialogContent({
  formId,
  closeSettings,
  onClose,
}: {
  formId: string;
  closeSettings: CloseSettings;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();

  const [limitEnabled, setLimitEnabled] = useState(closeSettings.closeAfterResponses !== null);
  const [limit, setLimit] = useState(String(closeSettings.closeAfterResponses ?? 100));
  const [dateEnabled, setDateEnabled] = useState(closeSettings.closeAt !== null);
  const [date, setDate] = useState(toLocalInputValue(closeSettings.closeAt));

  const update = trpc.forms.update.useMutation({
    onSuccess: () => {
      toast.success("Response limits saved");
      void utils.forms.get.invalidate({ formId });
      onClose();
    },
    onError: (err) => toast.error(err.message || "Couldn't save these settings"),
  });

  function handleSave() {
    const parsedLimit = Number(limit);
    if (limitEnabled && (!Number.isInteger(parsedLimit) || parsedLimit < 1)) {
      toast.error("Enter a response limit of 1 or more");
      return;
    }
    if (dateEnabled && !date) {
      toast.error("Choose a close date");
      return;
    }

    update.mutate({
      formId,
      closeSettings: {
        closeAfterResponses: limitEnabled ? parsedLimit : null,
        closeAt: dateEnabled ? new Date(date).toISOString() : null,
      },
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Response limits</DialogTitle>
        <DialogDescription>
          Automatically stop accepting new responses. Changes apply immediately — no need to
          republish.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="limit-toggle" className="font-normal">
              Limit total responses
            </Label>
            <Switch id="limit-toggle" checked={limitEnabled} onCheckedChange={setLimitEnabled} />
          </div>
          {limitEnabled && (
            <Input
              type="number"
              min={1}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="max-w-32"
              aria-label="Response limit"
            />
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="date-toggle" className="font-normal">
              Close on a date
            </Label>
            <Switch id="date-toggle" checked={dateEnabled} onCheckedChange={setDateEnabled} />
          </div>
          {dateEnabled && (
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="max-w-56"
              aria-label="Close date and time"
            />
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={update.isPending}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={update.isPending}>
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
