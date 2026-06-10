import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useLeads(accountEmail) {
  return useQuery({
    queryKey: ["leads", accountEmail],
    queryFn: () => base44.entities.Lead.filter({ account_email: accountEmail }, "-updated_date", 5000),
    enabled: !!accountEmail,
    initialData: [],
  });
}

export function useLeadMutations(accountEmail) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["leads", accountEmail] });

  const createLead = useMutation({
    mutationFn: (data) => base44.entities.Lead.create({ ...data, account_email: accountEmail }),
    onSuccess: invalidate,
  });

  const updateLead = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: invalidate,
  });

  const deleteLead = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: invalidate,
  });

  // Optimistic status change for drag & drop
  const moveLead = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Lead.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["leads", accountEmail] });
      queryClient.setQueryData(["leads", accountEmail], (old) =>
        (old || []).map((l) => (l.id === id ? { ...l, status } : l))
      );
    },
    onSettled: invalidate,
  });

  return { createLead, updateLead, deleteLead, moveLead };
}
