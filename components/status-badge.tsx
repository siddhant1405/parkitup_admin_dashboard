import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/format";
import type { SiteStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<SiteStatus, string> = {
  draft: "bg-muted text-muted-foreground border-transparent",
  submitted: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-transparent",
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-transparent",
  inactive: "bg-red-500/15 text-red-600 dark:text-red-400 border-transparent",
};

export function StatusBadge({ status, className }: { status: SiteStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
