"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { DetailField } from "@/components/detail-field";
import { SitePhotoCarousel } from "@/components/site-photo-carousel";
import { SiteApprovalActions } from "@/components/site-approval-actions";
import { useSite } from "@/lib/queries";
import {
  formatCurrency,
  formatDate,
  formatEntryExit,
  formatInternetQuality,
  formatLevel,
  formatPaymentRecipientType,
  formatPosDevices,
  formatSurface,
  PARKING_TYPE_LABELS,
} from "@/lib/format";

export default function SiteDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: site, isLoading } = useSite(params.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="aspect-video w-full max-w-3xl" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!site) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Site not found</h1>
        <p className="mt-2 text-muted-foreground">
          This site doesn&apos;t exist or may have been removed.
        </p>
      </div>
    );
  }

  const { parkingConfiguration: pc, security, people, paymentRecipient, gst } = site;

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{site.propertyName}</h1>
            <StatusBadge status={site.status} />
            {site.isDeleted && (
              <span className="text-xs font-medium text-destructive">Deleted</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{site.address}</p>
          <p className="text-xs text-muted-foreground">
            {site.lat.toFixed(5)}, {site.lng.toFixed(5)} · Submitted by {site.operatorName}
          </p>
        </div>
        <SiteApprovalActions site={site} />
      </div>

      <div className="mt-6 max-w-3xl">
        <SitePhotoCarousel photos={site.photos} alt={site.propertyName} />
      </div>

      <div className="mt-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Parking configuration</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <DetailField label="Parking type" value={PARKING_TYPE_LABELS[pc.parkingType]} />
            <DetailField
              label="Entry / exit"
              value={`${formatEntryExit(pc.entryExitConfig)} (${pc.numberOfGates} gate${pc.numberOfGates === 1 ? "" : "s"})`}
            />
            <DetailField label="Total slots" value={pc.totalSlots} />
            <DetailField label="Operating hours" value={`${pc.opensAt} - ${pc.closesAt}`} />
            <DetailField label="Peak periods" value={pc.peakPeriods} />
            <DetailField label="Surface" value={formatSurface(pc.surface)} />
            {site.rwaPassSystem !== undefined && (
              <DetailField label="RWA pass system" value={site.rwaPassSystem ? "Yes" : "No"} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security &amp; site conditions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <DetailField label="Guardroom" value={security.guardroom ? "Yes" : "No"} />
            <DetailField label="Cameras" value={formatLevel(security.cameraCoverage)} />
            <DetailField label="Boom barrier" value={security.boomBarrier ? "Yes" : "No"} />
            <DetailField label="ANPR" value={security.anpr ? "Yes" : "No"} />
            <DetailField label="Lighting" value={formatLevel(security.lighting)} />
            <DetailField label="Signage" value={formatLevel(security.signage)} />
            <DetailField label="POS / payment device" value={formatPosDevices(security.posDevice)} />
            <DetailField label="Internet / network" value={formatInternetQuality(security.internetQuality)} />
            <DetailField label="Vendor & pricing notes" value={security.vendorPricingNotes} />
            <DetailField label="Restrictions" value={security.restrictions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>People</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <DetailField label="Owner" value={people.ownerName} />
            <DetailField label="Owner phone" value={people.ownerPhone} />
            <DetailField label="Caretaker" value={people.caretakerName} />
            <DetailField label="Caretaker phone" value={people.caretakerPhone} />
            <DetailField label="Workers on site" value={people.workersOnSite} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment recipient</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <DetailField
              label="Recipient type"
              value={formatPaymentRecipientType(paymentRecipient.type)}
            />
            <DetailField label="Registered name" value={paymentRecipient.registeredName} />
            <DetailField label="GST No." value={gst.gstNumber} />
            <DetailField label="GST status" value={gst.registered ? "GST registered" : "Not GST registered"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {site.pricing.map((rule, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{rule.label}</div>
                  <div className="text-xs capitalize text-muted-foreground">{rule.billingType.replace("-", " ")}</div>
                </div>
                <div className="text-sm font-semibold">{formatCurrency(rule.amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk factors</CardTitle>
          </CardHeader>
          <CardContent>
            {site.riskFactors.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm">
                {site.riskFactors.map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <DetailField label="Created" value={formatDate(site.createdAt)} />
            <DetailField label="Submitted" value={formatDate(site.submittedAt)} />
            <DetailField label="Activated" value={formatDate(site.activatedAt)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
