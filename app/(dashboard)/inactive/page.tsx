"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SiteQueueCard } from "@/components/site-queue-card";
import { useSites, useUpdateSiteStatus } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";

export default function InactivePage() {
  const { data: sites, isLoading } = useSites();
  const { mutate, isPending, variables } = useUpdateSiteStatus();

  const inactiveSites = (sites ?? []).filter((site) => site.status === "inactive" && !site.isDeleted);
  const deletedSites = (sites ?? []).filter((site) => site.isDeleted);
  const archivedSites = [...inactiveSites, ...deletedSites];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Inactive / Deleted</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sites that were deactivated or removed from the active portfolio.
      </p>

      {isLoading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      )}

      {!isLoading && archivedSites.length === 0 && (
        <div className="mt-10 text-center text-muted-foreground">No inactive or deleted sites.</div>
      )}

      {!isLoading && archivedSites.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {archivedSites.map((site) => (
            <SiteQueueCard
              key={site.id}
              site={site}
              showStatus
              timestampLabel="Last updated"
              timestampValue={formatDateTime(site.updatedAt)}
              {...(!site.isDeleted && {
                actionLabel: "Reactivate",
                actionTitle: "Reactivate this site?",
                actionDescription: `"${site.propertyName}" will become active again and count toward every KPI on the dashboard.`,
                onConfirm: () => mutate({ id: site.id, status: "active" }),
              })}
              pending={isPending && variables?.id === site.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
