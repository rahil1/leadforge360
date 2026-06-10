import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Ticket } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

function AdminDiscountsContent() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", percent_off: "", max_uses: "", expires_date: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: codes } = useQuery({
    queryKey: ["admin-codes"],
    queryFn: () => base44.entities.DiscountCode.list("-created_date", 200),
    initialData: [],
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-codes"] });

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.DiscountCode.create({
      code: form.code.trim().toUpperCase(),
      percent_off: Number(form.percent_off),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_date: form.expires_date || null,
      active: true,
      times_used: 0,
    });
    refresh();
    setOpen(false);
    setForm({ code: "", percent_off: "", max_uses: "", expires_date: "" });
    setSaving(false);
    toast({ title: "Code created", description: "The discount code is now live." });
  };

  const toggle = async (c) => {
    await base44.entities.DiscountCode.update(c.id, { active: !c.active });
    refresh();
  };

  const remove = async (c) => {
    await base44.entities.DiscountCode.delete(c.id);
    refresh();
    toast({ title: "Code deleted" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Discount Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">Create promo codes users can apply on the Billing page.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="shadow-md shadow-primary/25">
          <Plus className="w-4 h-4 mr-2" /> New Code
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No discount codes yet.</TableCell></TableRow>
              )}
              {codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Ticket className="w-3.5 h-3.5 text-primary" />
                      <span className="font-mono font-semibold">{c.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{c.percent_off}% off</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.times_used || 0}{c.max_uses ? ` / ${c.max_uses}` : ""}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {c.expires_date ? format(new Date(c.expires_date), "MMM d, yyyy") : "Never"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={!!c.active} onCheckedChange={() => toggle(c)} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(c)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">New Discount Code</DialogTitle>
          </DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input required placeholder="WELCOME20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </div>
              <div className="space-y-1.5">
                <Label>Percent Off *</Label>
                <Input required type="number" min="1" max="100" placeholder="20" value={form.percent_off} onChange={(e) => setForm({ ...form, percent_off: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Uses</Label>
                <Input type="number" min="1" placeholder="Unlimited" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Expires</Label>
                <Input type="date" value={form.expires_date} onChange={(e) => setForm({ ...form, expires_date: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Code"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDiscounts() {
  return <AdminGuard><AdminDiscountsContent /></AdminGuard>;
}
