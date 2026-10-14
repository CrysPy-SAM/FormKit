import { Badge } from "~/components/ui/badge";

const STATUS_CONFIG = {
  draft: { label: "Draft", variant: "outline" as const },
  published: { label: "Published", variant: "success" as const },
  archived: { label: "Archived", variant: "default" as const },
};

export function FormStatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
