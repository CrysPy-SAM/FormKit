"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { MailCheck, ArrowLeft } from "lucide-react";
import { trpc } from "~/trpc/client";
import { forgotPasswordSchema, type ForgotPasswordValues } from "~/lib/auth-schemas";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const forgetPassword = trpc.auth.forgetPassword.useMutation({
    onSuccess: (_, variables) => {
      setSentTo(variables.email);
    },
  });

  function onSubmit(values: ForgotPasswordValues) {
    forgetPassword.mutate(values);
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-start gap-4 animate-fade-up">
        <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <MailCheck className="size-5" />
        </div>
        <div>
          <p className="text-sm text-foreground">
            If an account exists for <span className="font-medium">{sentTo}</span>, we
            just sent a link to reset your password.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Didn&apos;t get it? Check your spam folder, or try again in a few minutes.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" loading={forgetPassword.isPending}>
            Send reset link
          </Button>
        </form>
      </Form>

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 self-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>
    </div>
  );
}
