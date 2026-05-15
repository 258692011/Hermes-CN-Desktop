import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJSON, deleteJSON, postJSON } from "@/lib/transport";
import { useActiveProfileName } from "@/hooks/use-profiles";
import {
  MessagesResponse,
  MutationOkResponse,
  SearchResponse,
  SessionDetail,
  SessionsResponse,
  type SearchResult,
} from "@hermes/protocol";

function hasAnyMessages(result: MessagesResponse): boolean {
  return result.ui_messages ? result.ui_messages.length > 0 : result.messages.length > 0;
}

async function fetchSessionLogMessages(id: string): Promise<MessagesResponse | null> {
  try {
    const result = await fetchJSON(
      `/__hermes_session_log/${encodeURIComponent(id)}`,
      undefined,
      MessagesResponse,
    );
    return hasAnyMessages(result) ? result : null;
  } catch {
    return null;
  }
}

async function fetchSessionMessages(id: string): Promise<MessagesResponse> {
  const result = await fetchJSON(
    `/api/sessions/${id}/messages`,
    undefined,
    MessagesResponse,
  );
  if (hasAnyMessages(result)) return result;
  return await fetchSessionLogMessages(id) ?? result;
}

export function useSessions(limit = 50, offset = 0) {
  const profile = useActiveProfileName();
  return useQuery<SessionsResponse>({
    queryKey: ["sessions", profile, limit, offset],
    queryFn: () => fetchJSON(`/api/sessions?limit=${limit}&offset=${offset}`, undefined, SessionsResponse),
  });
}

export function useSession(id: string | undefined) {
  const profile = useActiveProfileName();
  return useQuery<SessionDetail>({
    queryKey: ["session", profile, id],
    queryFn: () => fetchJSON(`/api/sessions/${id}`, undefined, SessionDetail),
    enabled: !!id,
  });
}

export function useSessionMessages(id: string | undefined) {
  const profile = useActiveProfileName();
  return useQuery<MessagesResponse>({
    queryKey: ["session-messages", profile, id],
    queryFn: () => fetchSessionMessages(id!),
    enabled: !!id,
  });
}

export function useSessionSearch(q: string) {
  const profile = useActiveProfileName();
  return useQuery<{ results: SearchResult[] }>({
    queryKey: ["sessions-search", profile, q],
    queryFn: () => fetchJSON(`/api/sessions/search?q=${encodeURIComponent(q)}&limit=20`, undefined, SearchResponse),
    enabled: q.length >= 2,
    staleTime: 10_000,
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJSON(`/api/sessions/${id}`, undefined, MutationOkResponse),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

function withoutSession(sessions: SessionsResponse | undefined, id: string): SessionsResponse | undefined {
  if (!sessions) return sessions;
  const nextSessions = sessions.sessions.filter((session) => session.id !== id);
  if (nextSessions.length === sessions.sessions.length) return sessions;
  return {
    ...sessions,
    sessions: nextSessions,
    total: Math.max(0, sessions.total - (sessions.sessions.length - nextSessions.length)),
  };
}

function withoutSearchResult(
  results: { results: SearchResult[] } | undefined,
  id: string,
): { results: SearchResult[] } | undefined {
  if (!results) return results;
  const nextResults = results.results.filter((result) => result.session_id !== id);
  return nextResults.length === results.results.length ? results : { ...results, results: nextResults };
}

export function useArchiveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      postJSON(`/api/sessions/${encodeURIComponent(id)}/archive`, {}, MutationOkResponse),
    onMutate: async (id) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["sessions"] }),
        qc.cancelQueries({ queryKey: ["sessions-search"] }),
      ]);
      const sessionSnapshots = qc.getQueriesData<SessionsResponse>({ queryKey: ["sessions"] });
      const searchSnapshots = qc.getQueriesData<{ results: SearchResult[] }>({
        queryKey: ["sessions-search"],
      });

      qc.setQueriesData<SessionsResponse>({ queryKey: ["sessions"] }, (data) =>
        withoutSession(data, id),
      );
      qc.setQueriesData<{ results: SearchResult[] }>({ queryKey: ["sessions-search"] }, (data) =>
        withoutSearchResult(data, id),
      );

      return { sessionSnapshots, searchSnapshots };
    },
    onError: (_error, _id, context) => {
      for (const [queryKey, data] of context?.sessionSnapshots ?? []) {
        qc.setQueryData(queryKey, data);
      }
      for (const [queryKey, data] of context?.searchSnapshots ?? []) {
        qc.setQueryData(queryKey, data);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["sessions"] });
      void qc.invalidateQueries({ queryKey: ["sessions-search"] });
    },
  });
}
