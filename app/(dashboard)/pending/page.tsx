"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SiteQueueCard } from "@/components/site-queue-card";
import { useSites, useUpdateSiteStatus } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";

export default function PendingPage() {
  const { data: sites, isLoading } = useSites();
  const { mutate, isPending, variables } = useUpdateSiteStatus();

  const pendingSites = (sites ?? []).filter((site) => site.status === "submitted");

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Pending Approval</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sites submitted by operators, awaiting manager review.
      </p>

      {isLoading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      )}

      {!isLoading && pendingSites.length === 0 && (
        <div className="mt-10 text-center text-muted-foreground">
          Nothing awaiting approval right now.
        </div>
      )}

      {!isLoading && pendingSites.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pendingSites.map((site) => (
            <SiteQueueCard
              key={site.id}
              site={site}
              timestampLabel="Submitted"
              timestampValue={formatDateTime(site.submittedAt)}
              actionLabel="Approve"
              actionTitle="Approve this site?"
              actionDescription={`"${site.propertyName}" will become active and count toward every KPI on the dashboard.`}
              pending={isPending && variables?.id === site.id}
              onConfirm={() => mutate({ id: site.id, status: "active" })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
