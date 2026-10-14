"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

const createFormSchema = z.object({
  title: z.string().min(1, "Give your form a name").max(200),
  teamId: z.string().optional(),
});
type CreateFormValues = z.infer<typeof createFormSchema>;

export default function NewFormPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const teamsQuery = trpc.workspace.list.useQuery();

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { title: "", teamId: undefined },
  });

  const createForm = trpc.forms.create.useMutation({
    onSuccess: (data) => {
      void utils.forms.list.invalidate();
      router.push(`/forms/${data.id}`);
    },
    onError: (err) => toast.error(err.message || "Couldn't create this form"),
  });

  function onSubmit(values: CreateFormValues) {
    createForm.mutate({
      title: values.title,
      teamId: values.teamId === "none" ? undefined : values.teamId,
    });
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link
        href="/forms"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to forms
      </Link>

      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="text-lg">Create a new form</CardTitle>
          <CardDescription>
            Give it a name — you can add fields and customize everything next. Prefer a
            head start? <Link href="/forms/templates" className="text-primary hover:underline">Browse templates</Link> instead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form title</FormLabel>
                    <FormControl>
                      <Input placeholder="Customer feedback survey" autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!!teamsQuery.data?.length && (
                <FormField
                  control={form.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team</FormLabel>
                      <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="No team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No team (org-wide)</SelectItem>
                          {teamsQuery.data.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Optionally scope this form to a specific team.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="mt-1 w-full" loading={createForm.isPending}>
                Continue to editor
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
