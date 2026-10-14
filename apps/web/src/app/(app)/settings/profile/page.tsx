"use client";

import { BadgeCheck, Mail, ShieldAlert } from "lucide-react";
import { useMe } from "~/hooks/use-me";
import { formatDate } from "~/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";

function initialsFor(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function ProfileSettingsPage() {
  const { data: me, isLoading } = useMe();

  if (isLoading || !me) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
        <CardDescription>
          Account details from your FormKit profile. Managed via your identity provider.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 border border-border">
            {me.image && <AvatarImage src={me.image} alt={me.name ?? me.email} />}
            <AvatarFallback className="text-base">
              {initialsFor(me.name, me.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-base font-medium text-foreground">
              {me.name || "Unnamed user"}
            </p>
            <p className="text-sm text-muted-foreground">{me.email}</p>
          </div>
        </div>

        <Separator />

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Email address</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
              <Mail className="size-3.5 text-muted-foreground" />
              {me.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Verification</dt>
            <dd className="mt-1">
              {me.emailVerified ? (
                <Badge variant="success">
                  <BadgeCheck className="size-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="warning">
                  <ShieldAlert className="size-3" />
                  Not verified
                </Badge>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Sign-in method</dt>
            <dd className="mt-1 text-sm text-foreground capitalize">
              {me.provider ?? "Email & password"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Member since</dt>
            <dd className="mt-1 text-sm text-foreground">{formatDate(me.createdAt)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
