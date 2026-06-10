import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import { PLANS, monthlyTotal } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const statusBadge = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  trialing: "bg-sky-50 text-sky-700 border-sky-200",
  cancelled: "bg-secondary text-muted-foreground",
  past_due: "bg-rose-50 text-rose-600 border-rose-200",
};

function EditDialog({ sub, open, onOpenChange, onSaved }) {
  const [form, setForm] = useState({});
  const { toast } = useToast();

  React.useEffect(() => {
    if (sub) {
      setForm({
        plan: sub.plan,
        status: sub.status || "active",
        extra_seats: sub.extra_seats || 0,
        trial_ends: sub.trial_ends || "",
        lead_limit_override: sub.lead_limit_override || "",
      });
    }
  }, [sub]);

  const save = async (e) => {
    e.preventDefault();
    await base44.entities.Subscription.update(sub.id, {
      plan: form.plan,
      status: form.status,
      extra_seats: Number(form.extra_seats) || 0,
      trial_ends: form.trial_ends || null,
      lead_limit_override: form.lead_limit_override === "" ? null : Number(form.lead_limit_override),
    });
    onSaved();
    onOpenChange(false);
    toast({ title: "Subscription updated", description: `Changes saved for ${sub.user_email}.` });
  };

  if (!sub) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit Subscription</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">{sub.user_email}</p>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(PLANS).map((p) => <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Extra Seats</Label>
              <Input type="number" min="0" value={form.extra_seats} onChange={(e) => setForm({ ...form, extra_seats: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Trial Ends</Label>
              <Input type="date" value={form.trial_ends || ""} onChange={(e) => setForm({ ...form, trial_ends: e.target.value })} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Custom Lead Allowance</Label>
              <Input type="number" min="0" placeholder="Leave empty to use plan default" value={form.lead_limit_override} onChange={(e) => setForm({ ...form, lead_limit_override: e.target.value })} />
              <p className="text-[11px] text-muted-foreground">Overrides the plan's lead limit for this account.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminSubscriptionsContent() {
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: subs } = useQuery({
    queryKey: ["admin-subs"],
    queryFn: () => base44.entities.Subscription.list("-created_date", 500),
    initialData: [],
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-subs"] });

  const mrr = subs.filter((s) => s.status === "active").reduce((sum, s) => sum + monthlyTotal(s), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-sm text-muted-foreground mt-1">{subs.length} subscriptions · ${mrr.toLocaleString()} active MRR</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Lead Allowance</TableHead>
                <TableHead>Trial Ends</TableHead>
                <TableHead>Monthly</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No subscriptions yet.</TableCell></TableRow>
              )}
              {subs.map((s) => {
                const plan = PLANS[s.plan] || PLANS.free;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.user_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-accent text-accent-foreground border-primary/20">{plan.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadge[s.status] || ""}>{s.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{plan.includedSeats + (s.extra_seats || 0)} ({s.extra_seats || 0} extra)</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.lead_limit_override
                        ? `${s.lead_limit_override.toLocaleString()} (custom)`
                        : plan.leadLimit ? plan.leadLimit.toLocaleString() : "Unlimited"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {s.trial_ends ? format(new Date(s.trial_ends), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="font-medium">${monthlyTotal(s)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(s)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <EditDialog sub={editing} open={!!editing} onOpenChange={(v) => !v && setEditing(null)} onSaved={refresh} />
    </div>
  );
}

export default function AdminSubscriptions() {
  return <AdminGuard><AdminSubscriptionsContent /></AdminGuard>;
}
