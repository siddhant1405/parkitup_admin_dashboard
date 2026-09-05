"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { useUpdateSiteStatus } from "@/lib/queries";
import type { Site } from "@/lib/types";

export function SiteApprovalActions({ site }: { site: Site }) {
  const { mutate, isPending } = useUpdateSiteStatus();

  if (site.status === "submitted") {
    return (
      <ConfirmActionButton
        label="Approve"
        title="Approve this site?"
        description={`"${site.propertyName}" will become active and count toward every KPI on the dashboard.`}
        confirmLabel="Approve"
        pending={isPending}
        onConfirm={() => mutate({ id: site.id, status: "active" })}
      />
    );
  }

  if (site.status === "active") {
    return (
      <ConfirmActionButton
        label="Mark inactive"
        title="Mark this site inactive?"
        description={`"${site.propertyName}" will stop counting toward KPIs until it's reactivated.`}
        confirmLabel="Mark inactive"
        variant="destructive"
        pending={isPending}
        onConfirm={() => mutate({ id: site.id, status: "inactive" })}
      />
    );
  }

  if (site.status === "inactive") {
    return (
      <ConfirmActionButton
        label="Reactivate"
        title="Reactivate this site?"
        description={`"${site.propertyName}" will become active again and count toward every KPI on the dashboard.`}
        confirmLabel="Reactivate"
        pending={isPending}
        onConfirm={() => mutate({ id: site.id, status: "active" })}
      />
    );
  }

  return null;
}
