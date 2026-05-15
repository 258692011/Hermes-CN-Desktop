import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/transport";
import { FsListResponse } from "@hermes/protocol";

export function useFsList(path: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["fs-list", path],
    queryFn: () =>
      fetchJSON(`/api/fs/list?path=${encodeURIComponent(path)}`, undefined, FsListResponse),
    enabled: options?.enabled ?? true,
    staleTime: 0,
    refetchOnWindowFocus: false,
    gcTime: 30_000,
  });
}
