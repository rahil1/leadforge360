import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAccount } from "@/lib/useAccount";
import { useLeads, useLeadMutations } from "@/lib/useLeads";
import { LEAD_STATUSES, getLeadLimit } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LeadFormDialog from "@/components/leads/LeadFormDialog";

export default function Leads() {
  const { data: account } = useAccount();
  const { data: leads } = useLeads(account?.accountEmail);
  const { createLead, updateLead, deleteLead } = useLeadMutations(account?.accountEmail);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || [l.name, l.email, l.company].some((v) => v?.toLowerCase().includes(q));
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async (data) => {
    if (editingLead) {
      await updateLead.mutateAsync({ id: editingLead.id, data });
    } else {
      const limit = getLeadLimit(account?.subscription);
      if (limit && leads.length >= limit) {
        toast({ title: "Lead limit reached", description: `Your plan allows ${limit} leads. Upgrade in Billing.`, variant: "destructive" });
        return;
      }
      await createLead.mutateAsync(data);
    }
    setFormOpen(false);
    setEditingLead(null);
  };

  const statusOf = (key) => LEAD_STATUSES.find((s) => s.key === key) || LEAD_STATUSES[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">All Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">{leads.length} lead{leads.length !== 1 && "s"} in your workspace</p>
        </div>
        <Button onClick={() => { setEditingLead(null); setFormOpen(true); }} className="shadow-md shadow-primary/25">
          <Plus className="w-4 h-4 mr-2" /> Add Lead
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, company..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {LEAD_STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No leads found. Add your first lead or import a CSV.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((lead) => {
                const st = statusOf(lead.status);
                return (
                  <TableRow key={lead.id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => { setEditingLead(lead); setFormOpen(true); }}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.company || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={st.badge}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{lead.value ? `$${Number(lead.value).toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{lead.assigned_to || "—"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingLead(lead); setFormOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteLead.mutate(lead.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

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
