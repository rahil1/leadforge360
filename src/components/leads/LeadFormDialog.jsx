import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEAD_STATUSES } from "@/lib/plans";

const empty = { name: "", email: "", phone: "", company: "", job_title: "", value: "", status: "new", source: "manual", assigned_to: "", notes: "" };

export default function LeadFormDialog({ open, onOpenChange, lead, onSave, teamEmails = [], saving }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(lead ? { ...empty, ...lead, value: lead.value ?? "" } : empty);
  }, [lead, open]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, value: form.value === "" ? 0 : parseFloat(form.value) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{lead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Name *</Label>
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Cooper" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@acme.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 000 0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme Inc." />
            </div>
            <div className="space-y-1.5">
              <Label>Job Title</Label>
              <Input value={form.job_title} onChange={(e) => set("job_title", e.target.value)} placeholder="Head of Sales" />
            </div>
            <div className="space-y-1.5">
              <Label>Deal Value ($)</Label>
              <Input type="number" min="0" step="0.01" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="5000" />
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => set("source", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="csv_import">CSV Import</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {teamEmails.length > 0 && (
              <div className="space-y-1.5">
                <Label>Assigned To</Label>
                <Select value={form.assigned_to || "unassigned"} onValueChange={(v) => set("assigned_to", v === "unassigned" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamEmails.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Context, next steps..." className="h-20" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : lead ? "Update Lead" : "Add Lead"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
