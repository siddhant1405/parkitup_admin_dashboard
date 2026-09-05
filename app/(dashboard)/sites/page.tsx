"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ImageOff, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { useSites } from "@/lib/queries";
import { PARKING_TYPE_LABELS, formatDate, getSiteLocality } from "@/lib/format";
import type { ParkingType, Site, SiteStatus } from "@/lib/types";

// Draft sites never reach this admin dashboard (they belong to the operator portal), so
// this app's status filter excludes it even though SiteStatus still models it.
type StatusFilterValue = Exclude<SiteStatus, "draft"> | "deleted";

const STATUS_FILTER_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "deleted", label: "Deleted" },
];

type SortOption = "recent" | "name" | "most-slots" | "fewest-slots";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recently updated" },
  { value: "name", label: "Property name (A-Z)" },
  { value: "most-slots", label: "Most slots" },
  { value: "fewest-slots", label: "Fewest slots" },
];

function siteStatusValue(site: Site): StatusFilterValue {
  // The mock data layer never returns draft sites to this app, so `site.status` here is
  // never actually "draft" even though the shared SiteStatus type still allows it.
  return site.isDeleted ? "deleted" : (site.status as Exclude<SiteStatus, "draft">);
}

function getTimestampInfo(site: { status: SiteStatus; submittedAt?: string; activatedAt?: string; updatedAt: string }): { label: string; value: string } {
  if (site.activatedAt) {
    return { label: "Added", value: formatDate(site.activatedAt) };
  }
  if (site.submittedAt) {
    return { label: "Added", value: formatDate(site.submittedAt) };
  }
  return { label: "Updated", value: formatDate(site.updatedAt) };
}

export default function SitesPage() {
  const { data: sites, isLoading } = useSites();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue[]>([]);
  const [parkingTypeFilter, setParkingTypeFilter] = useState<ParkingType | "all">("all");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [localityFilter, setLocalityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  // Extract unique operators, parking types, and localities from sites
  const uniqueOperators = useMemo(() => {
    if (!sites) return [];
    const operators = new Map<string, string>();
    sites.forEach((site) => {
      operators.set(site.operatorId, site.operatorName);
    });
    return Array.from(operators.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sites]);

  const uniqueParkingTypes = useMemo(() => {
    if (!sites) return [];
    const types = new Set<ParkingType>();
    sites.forEach((site) => {
      types.add(site.parkingConfiguration.parkingType);
    });
    return Array.from(types).sort();
  }, [sites]);

  const uniqueLocalities = useMemo(() => {
    if (!sites) return [];
    const localities = new Set<string>();
    sites.forEach((site) => {
      localities.add(getSiteLocality(site.address));
    });
    return Array.from(localities).sort();
  }, [sites]);

  const baseCount = useMemo(() => sites?.filter((site) => !site.isDeleted).length ?? 0, [sites]);

  const filteredSites = useMemo(() => {
    if (!sites) return [];
    const query = search.trim().toLowerCase();

    const filtered = sites.filter((site) => {
      // Status filter (multi-select; empty selection means "all statuses" minus deleted)
      const matchesStatusFilter =
        statusFilter.length === 0
          ? !site.isDeleted
          : statusFilter.includes(siteStatusValue(site));

      if (!matchesStatusFilter) return false;

      // Parking type filter
      if (parkingTypeFilter !== "all" && site.parkingConfiguration.parkingType !== parkingTypeFilter) {
        return false;
      }

      // Operator filter
      if (operatorFilter !== "all" && site.operatorId !== operatorFilter) {
        return false;
      }

      // Locality filter
      if (localityFilter !== "all" && getSiteLocality(site.address) !== localityFilter) {
        return false;
      }

      // Search filter
      if (!query) return true;

      return (
        site.propertyName.toLowerCase().includes(query) ||
        site.address.toLowerCase().includes(query) ||
        site.operatorName.toLowerCase().includes(query)
      );
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case "name":
        sorted.sort((a, b) => a.propertyName.localeCompare(b.propertyName));
        break;
      case "most-slots":
        sorted.sort((a, b) => b.parkingConfiguration.totalSlots - a.parkingConfiguration.totalSlots);
        break;
      case "fewest-slots":
        sorted.sort((a, b) => a.parkingConfiguration.totalSlots - b.parkingConfiguration.totalSlots);
        break;
      case "recent":
      default:
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
    }

    return sorted;
  }, [sites, search, statusFilter, parkingTypeFilter, operatorFilter, localityFilter, sortBy]);

  function toggleStatus(value: StatusFilterValue, checked: boolean) {
    setStatusFilter((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)));
  }

  function clearAllFilters() {
    setSearch("");
    setStatusFilter([]);
    setParkingTypeFilter("all");
    setOperatorFilter("all");
    setLocalityFilter("all");
  }

  const operatorName = uniqueOperators.find((op) => op.id === operatorFilter)?.name;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (search.trim()) {
    chips.push({ key: "search", label: `Search: ${search.trim()}`, onRemove: () => setSearch("") });
  }
  if (statusFilter.length > 0) {
    chips.push({
      key: "status",
      label: `Status: ${statusFilter
        .map((value) => STATUS_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? value)
        .join(", ")}`,
      onRemove: () => setStatusFilter([]),
    });
  }
  if (parkingTypeFilter !== "all") {
    chips.push({
      key: "parking-type",
      label: `Type: ${PARKING_TYPE_LABELS[parkingTypeFilter]}`,
      onRemove: () => setParkingTypeFilter("all"),
    });
  }
  if (operatorFilter !== "all") {
    chips.push({
      key: "operator",
      label: `Operator: ${operatorName ?? operatorFilter}`,
      onRemove: () => setOperatorFilter("all"),
    });
  }
  if (localityFilter !== "all") {
    chips.push({
      key: "locality",
      label: `Locality: ${localityFilter}`,
      onRemove: () => setLocalityFilter("all"),
    });
  }

  const hasActiveFilters = chips.length > 0;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sites</h1>
          <p className="text-sm text-muted-foreground">
            All sites across every status, searchable and filterable.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-row flex-wrap items-center gap-3 lg:flex-nowrap">
        <div className="relative min-w-[220px] flex-1 lg:min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, address, or operator"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-36 shrink-0 justify-between gap-2">
              {statusFilter.length === 0 ? "All status" : `Status (${statusFilter.length})`}
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {STATUS_FILTER_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={statusFilter.includes(option.value)}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(checked) => toggleStatus(option.value, checked === true)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Select
          value={parkingTypeFilter}
          onValueChange={(value) => setParkingTypeFilter(value as ParkingType | "all")}
        >
          <SelectTrigger className="w-40 shrink-0">
            <SelectValue placeholder="Parking type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All parking types</SelectItem>
            {uniqueParkingTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {PARKING_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={operatorFilter} onValueChange={(value) => setOperatorFilter(value)}>
          <SelectTrigger className="w-40 shrink-0">
            <SelectValue placeholder="Operator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All operators</SelectItem>
            {uniqueOperators.map((operator) => (
              <SelectItem key={operator.id} value={operator.id}>
                {operator.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={localityFilter} onValueChange={(value) => setLocalityFilter(value)}>
          <SelectTrigger className="w-40 shrink-0">
            <SelectValue placeholder="Locality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All localities</SelectItem>
            {uniqueLocalities.map((locality) => (
              <SelectItem key={locality} value={locality}>
                {locality}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-44 shrink-0">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && hasActiveFilters && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredSites.length} of {baseCount} sites
            </p>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={clearAllFilters}>
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <Badge key={chip.key} variant="secondary" className="gap-1 py-1 pr-1 pl-2.5">
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remove filter: ${chip.label}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      )}

      {!isLoading && filteredSites.length === 0 && (
        <div className="mt-10 text-center text-muted-foreground">
          No sites match your search and filters.
        </div>
      )}

      {!isLoading && filteredSites.length > 0 && (
        <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredSites.map((site) => {
            const { label: timestampLabel, value: timestampValue } = getTimestampInfo(site);
            return (
              <Link key={site.id} href={`/sites/${site.id}`}>
                <Card className="h-full overflow-hidden py-0 transition-shadow hover:shadow-md cursor-pointer">
                  <div className="aspect-video w-full bg-muted">
                    {site.photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element -- mock data: photos are data URIs
                      <img
                        src={site.photos[0]}
                        alt={site.propertyName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-8" />
                      </div>
                    )}
                  </div>
                  <CardContent className="space-y-3 py-4">
                    <div>
                      <h3 className="font-semibold line-clamp-2">{site.propertyName}</h3>
                      <p className="truncate text-xs text-muted-foreground">{site.address}</p>
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>{site.parkingConfiguration.opensAt} - {site.parkingConfiguration.closesAt}</span>
                        {site.isDeleted ? (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-transparent">
                            Deleted
                          </Badge>
                        ) : (
                          <StatusBadge status={site.status} />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{PARKING_TYPE_LABELS[site.parkingConfiguration.parkingType]}</span>
                        <span>{site.parkingConfiguration.totalSlots} slots</span>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground">
                        Added by <span className="font-medium text-foreground">{site.operatorName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timestampLabel} {timestampValue}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
