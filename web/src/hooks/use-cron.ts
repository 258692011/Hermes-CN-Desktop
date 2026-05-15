import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJSON, postJSON, putJSON, deleteJSON } from "@/lib/transport";
import { useActiveProfileName } from "@/hooks/use-profiles";
import { CronJobsResponse, MutationOkResponse, type CronJob } from "@hermes/protocol";

export function useCronJobs() {
  const profile = useActiveProfileName();
  return useQuery<CronJob[]>({
    queryKey: ["cron-jobs", profile],
    queryFn: () => fetchJSON("/api/cron/jobs", undefined, CronJobsResponse),
  });
}

export function useCreateCronJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (job: { prompt: string; schedule: string; name?: string; deliver?: string }) =>
      postJSON("/api/cron/jobs", job, MutationOkResponse),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cron-jobs"] }),
  });
}

export function useUpdateCronJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) =>
      putJSON(`/api/cron/jobs/${id}`, { updates }, MutationOkResponse),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cron-jobs"] }),
  });
}

export function useDeleteCronJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJSON(`/api/cron/jobs/${id}`, undefined, MutationOkResponse),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cron-jobs"] }),
  });
}

export function useCronAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "pause" | "resume" | "trigger" }) =>
      postJSON(`/api/cron/jobs/${id}/${action}`, {}, MutationOkResponse),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cron-jobs"] }),
  });
}
