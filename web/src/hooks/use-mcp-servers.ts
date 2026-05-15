import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/transport";
import { useActiveProfileName } from "@/hooks/use-profiles";
import { McpServersResponse } from "@hermes/protocol";

export function useMcpServers() {
  const profile = useActiveProfileName();
  return useQuery<McpServersResponse>({
    queryKey: ["mcp-servers", profile],
    queryFn: () => fetchJSON("/api/mcp-servers", undefined, McpServersResponse),
    staleTime: 60_000,
  });
}
