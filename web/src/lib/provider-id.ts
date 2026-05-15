export function normalizeProviderIdForGateway(provider?: string): string | undefined {
  if (!provider) return provider;
  const customPrefix = "custom:";
  if (!provider.startsWith(customPrefix)) return provider;

  const candidate = provider.slice(customPrefix.length).trim().toLowerCase();
  if (/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(candidate) && candidate.includes(".")) {
    return candidate;
  }

  return provider;
}
