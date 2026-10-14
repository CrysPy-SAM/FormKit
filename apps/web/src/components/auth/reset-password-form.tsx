"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, TriangleAlert } from "lucide-react";
import { trpc } from "~/trpc/client";
import { resetPasswordSchema, type ResetPasswordValues } from "~/lib/auth-schemas";
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

export function ResetPasswordForm({ token }: { token: string | undefined }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const resetPassword = trpc.auth.resetPassword.useMutation();

  function onSubmit(values: ResetPasswordValues) {
    if (!token) return;
    resetPassword.mutate({ token, newPassword: values.newPassword });
  }

  if (!token) {
    return (
      <div className="flex flex-col items-start gap-4 animate-fade-up">
        <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-5" />
        </div>
        <p className="text-sm text-foreground">
          This reset link is missing or invalid. Request a new one to continue.
        </p>
        <Button asChild size="sm">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  if (resetPassword.isSuccess) {
    return (
      <div className="flex flex-col items-start gap-4 animate-fade-up">
        <div className="flex size-11 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-5" />
        </div>
        <p className="text-sm text-foreground">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Button size="sm" onClick={() => router.push("/login")}>
          Continue to sign in
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    autoFocus
                    className="pr-9"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {resetPassword.isError && (
          <p className="text-sm font-medium text-destructive">
            {resetPassword.error.message || "This link may have expired. Please request a new one."}
          </p>
        )}

        <Button type="submit" className="w-full" loading={resetPassword.isPending}>
          Reset password
        </Button>
      </form>
    </Form>
  );
}
