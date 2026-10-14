"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "~/trpc/client";
import { signupSchema, type SignupValues } from "~/lib/auth-schemas";
import { setActiveOrgIdClient } from "~/lib/org-cookie";
import { cn } from "~/lib/utils";
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
import { GoogleSignInButton, isGoogleAuthEnabled } from "~/components/auth/google-signin-button";

const PASSWORD_RULES = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "Uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "Number", test: (v: string) => /\d/.test(v) },
];

export function SignupForm() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const password = form.watch("password");

  const signup = trpc.auth.signup.useMutation({
    onSuccess: (data) => {
      const defaultOrg = data.orgs[0];
      if (defaultOrg) setActiveOrgIdClient(defaultOrg.id);
      utils.invalidate();
      router.push("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Couldn't create your account");
    },
  });

  function onSubmit(values: SignupValues) {
    signup.mutate(values);
  }

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Cooper" autoComplete="name" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@company.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
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
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password || "");
                    return (
                      <div
                        key={rule.label}
                        className={cn(
                          "flex items-center gap-1.5 text-xs transition-colors",
                          passed ? "text-success" : "text-muted-foreground",
                        )}
                      >
                        {passed ? (
                          <Check className="size-3 shrink-0" />
                        ) : (
                          <X className="size-3 shrink-0 opacity-40" />
                        )}
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-1 w-full" loading={signup.isPending}>
            Create account
          </Button>
        </form>
      </Form>

      {isGoogleAuthEnabled && (
        <>
          <div className="relative flex items-center py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="px-3 text-xs text-muted-foreground">or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <GoogleSignInButton />
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground text-balance">
        By creating an account, you agree to FormKit&apos;s Terms of Service and Privacy
        Policy.
      </p>
    </div>
  );
}
