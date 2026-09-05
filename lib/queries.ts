import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSiteById, fetchSites, updateSiteStatus } from "./api";
import type { SiteStatus } from "./types";

export const siteKeys = {
  all: ["sites"] as const,
  detail: (id: string) => ["sites", id] as const,
};

export function useSites() {
  return useQuery({ queryKey: siteKeys.all, queryFn: fetchSites });
}

export function useSite(id: string) {
  return useQuery({
    queryKey: siteKeys.detail(id),
    queryFn: () => fetchSiteById(id),
    enabled: !!id,
  });
}

export function useUpdateSiteStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SiteStatus }) =>
      updateSiteStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: siteKeys.all });
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(updated.id) });
    },
  });
}
