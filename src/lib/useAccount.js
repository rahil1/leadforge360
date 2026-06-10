import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Resolves the current user, their workspace (own account or the team they belong to),
// and the workspace subscription.
export function useAccount() {
  return useQuery({
    queryKey: ["account"],
    queryFn: async () => {
      const user = await base44.auth.me();
      const memberships = await base44.entities.TeamMember.filter({
        member_email: user.email,
        status: "active",
      });
      const isTeamMember = memberships.length > 0;
      const accountEmail = isTeamMember ? memberships[0].owner_email : user.email;
      const subs = await base44.entities.Subscription.filter({ user_email: accountEmail });
      return {
        user,
        accountEmail,
        isTeamMember,
        isOwner: !isTeamMember,
        subscription: subs[0] || null,
      };
    },
  });
}

export function useInvalidateAccount() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["account"] });
}
