import { useQuery } from "@tanstack/react-query";
import { ProviderModelsResponse } from "@hermes/protocol";
import { fetchExternalJSON } from "@/lib/transport";

export interface UseProviderModelsResult {
  models: string[];
  fetchedAt: number;
}

export function buildModelsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/models`;
}

export function useProviderModels(baseUrl: string, apiKey: string | undefined) {
  return useQuery<UseProviderModelsResult>({
    queryKey: ["provider-models", baseUrl],
    queryFn: async () => {
      const url = buildModelsUrl(baseUrl);
      const headers: Record<string, string> = { Accept: "application/json" };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      const data = await fetchExternalJSON(url, { headers }, ProviderModelsResponse);
      const models = data.data.map((m) => m.id).filter((id) => id.length > 0).sort();
      return { models, fetchedAt: Date.now() };
    },
    enabled: false,
    staleTime: 15 * 60 * 1000,
    retry: false,
  });
}
