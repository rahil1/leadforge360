import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAccount } from "@/lib/useAccount";
import { useLeads, useLeadMutations } from "@/lib/useLeads";
import { getLeadLimit } from "@/lib/plans";
import { useToast } from "@/components/ui/use-toast";
import StatsBar from "@/components/dashboard/StatsBar";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import LeadFormDialog from "@/components/leads/LeadFormDialog";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function Dashboard() {
  const { data: account } = useAccount();
  const { data: leads } = useLeads(account?.accountEmail);
  const { createLead, updateLead, moveLead } = useLeadMutations(account?.accountEmail);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const { toast } = useToast();

  const { data: team } = useQuery({
    queryKey: ["team", account?.accountEmail],
    queryFn: () => base44.entities.TeamMember.filter({ owner_email: account.accountEmail }),
    enabled: !!account?.accountEmail,
    initialData: [],
  });
  const teamEmails = [account?.accountEmail, ...team.filter((m) => m.status !== "removed").map((m) => m.member_email)].filter(Boolean);

  const handleSave = async (data) => {
    if (editingLead) {
      await updateLead.mutateAsync({ id: editingLead.id, data });
    } else {
      const limit = getLeadLimit(account?.subscription);
      if (limit && leads.length >= limit) {
        toast({
          title: "Lead limit reached",
          description: `Your plan allows ${limit} leads. Upgrade in Billing to add more.`,
          variant: "destructive",
        });
        return;
      }
      await createLead.mutateAsync(data);
    }
    setFormOpen(false);
    setEditingLead(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag leads through your sales stages to close deals.</p>
        </div>
        <Button onClick={() => { setEditingLead(null); setFormOpen(true); }} className="shadow-md shadow-primary/25">
          <Plus className="w-4 h-4 mr-2" /> Add Lead
        </Button>
      </div>

      <StatsBar leads={leads} subscription={account?.subscription} />

      <KanbanBoard
        leads={leads}
        onMove={(id, status) => moveLead.mutate({ id, status })}
        onLeadClick={(lead) => { setEditingLead(lead); setFormOpen(true); }}
      />

      <LeadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={editingLead}
        onSave={handleSave}
        teamEmails={teamEmails}
        saving={createLead.isPending || updateLead.isPending}
      />
    </div>
  );
}
