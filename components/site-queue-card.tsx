import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { StatusBadge } from "@/components/status-badge";
import type { Site } from "@/lib/types";

interface SiteQueueCardProps {
  site: Site;
  timestampLabel: string;
  timestampValue: string;
  actionLabel?: string;
  actionTitle?: string;
  actionDescription?: string;
  onConfirm?: () => void;
  pending: boolean;
  showStatus?: boolean;
}

export function SiteQueueCard({
  site,
  timestampLabel,
  timestampValue,
  actionLabel,
  actionTitle,
  actionDescription,
  onConfirm,
  pending,
  showStatus = false,
}: SiteQueueCardProps) {
  return (
    <Card className="overflow-hidden py-0">
      <div className="aspect-video w-full bg-muted">
        {site.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- mock data: photos are data URIs
          <img src={site.photos[0]} alt={site.propertyName} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
      </div>
      <CardContent className="space-y-3 py-4">
        <div>
          <Link href={`/sites/${site.id}`} className="font-medium hover:underline">
            {site.propertyName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{site.address}</p>
          {showStatus && (
            <div className="mt-2">
              {site.isDeleted ? (
                <Badge variant="outline" className="bg-muted text-muted-foreground border-transparent">
                  Deleted
                </Badge>
              ) : (
                <StatusBadge status="inactive" />
              )}
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          <div>Submitted by {site.operatorName}</div>
          <div>
            {timestampLabel}: {timestampValue}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {actionLabel && actionTitle && actionDescription && onConfirm && (
            <ConfirmActionButton
              label={actionLabel}
              title={actionTitle}
              description={actionDescription}
              confirmLabel={actionLabel}
              pending={pending}
              onConfirm={onConfirm}
              className="flex-1"
            />
          )}
          <Link
            href={`/sites/${site.id}`}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            View details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
