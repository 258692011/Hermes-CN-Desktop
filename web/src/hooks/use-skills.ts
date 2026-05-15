import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJSON, putJSON } from "@/lib/transport";
import { useActiveProfileName } from "@/hooks/use-profiles";
import { MutationOkResponse, SkillsResponse, type SkillInfo } from "@hermes/protocol";

export function useSkills() {
  const profile = useActiveProfileName();
  return useQuery<SkillInfo[]>({
    queryKey: ["skills", profile],
    queryFn: () => fetchJSON("/api/skills", undefined, SkillsResponse),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useToggleSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { name: string; enabled: boolean }) =>
      putJSON("/api/skills/toggle", vars, MutationOkResponse),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }),
  });
}
