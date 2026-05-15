import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/transport";
import { useActiveProfileName } from "@/hooks/use-profiles";
import { AnalyticsResponse } from "@hermes/protocol";

export function useAnalytics(days = 30) {
  const profile = useActiveProfileName();
  return useQuery<AnalyticsResponse>({
    queryKey: ["analytics", profile, days],
    queryFn: () => fetchJSON(`/api/analytics/usage?days=${days}`, undefined, AnalyticsResponse),
    staleTime: 60_000,
  });
}
