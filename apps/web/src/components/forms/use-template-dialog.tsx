"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { RouterOutputs } from "@formkit/trpc/client";
import { trpc } from "~/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

type FormTemplate = RouterOutputs["forms"]["templates"]["list"][number];

export function UseTemplateDialog({
  template,
  open,
  onOpenChange,
}: {
  template: FormTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {template && (
        // Keyed by template.id so switching templates re-initializes local
        // state (title/team) by remounting, instead of resetting it
        // reactively from an effect.
        <UseTemplateDialogContent key={template.id} template={template} onOpenChange={onOpenChange} />
      )}
    </Dialog>
  );
}

function UseTemplateDialogContent({
  template,
  onOpenChange,
}: {
  template: FormTemplate;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const teamsQuery = trpc.workspace.list.useQuery();

  const [title, setTitle] = useState(template.name);
  const [teamId, setTeamId] = useState<string>("none");

  const createFromTemplate = trpc.forms.templates.create.useMutation({
    onSuccess: (data) => {
      void utils.forms.list.invalidate();
      toast.success("Form created from template");
      router.push(`/forms/${data.id}`);
    },
    onError: (err) => toast.error(err.message || "Couldn't create this form"),
  });

  function handleCreate() {
    if (!title.trim()) return;
    createFromTemplate.mutate({
      templateId: template.id,
      title: title.trim(),
      teamId: teamId === "none" ? undefined : teamId,
    });
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Use &quot;{template.name}&quot;</DialogTitle>
        <DialogDescription>
          This creates a normal, fully editable form pre-filled with this template&apos;s
          questions and theme — you can change everything afterward.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="template-form-title">Form title</Label>
          <Input
            id="template-form-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {!!teamsQuery.data?.length && (
          <div className="flex flex-col gap-1.5">
            <Label>Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="No team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No team (org-wide)</SelectItem>
                {teamsQuery.data.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={createFromTemplate.isPending}>
          Cancel
        </Button>
        <Button onClick={handleCreate} loading={createFromTemplate.isPending} disabled={!title.trim()}>
          Create form
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
