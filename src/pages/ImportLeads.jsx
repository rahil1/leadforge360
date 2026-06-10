import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "@/lib/useAccount";
import { useLeads } from "@/lib/useLeads";
import { getLeadLimit } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Simple CSV parser supporting quoted values
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) { row.push(field); if (row.some((v) => v.trim() !== "")) rows.push(row); }
  return rows;
}

const FIELD_ALIASES = {
  name: ["name", "full name", "fullname", "lead name", "contact"],
  email: ["email", "e-mail", "email address"],
  phone: ["phone", "phone number", "mobile", "tel"],
  company: ["company", "organization", "business"],
  job_title: ["job title", "title", "position", "role"],
  value: ["value", "deal value", "amount", "deal size"],
  notes: ["notes", "note", "comments"],
};

function mapHeaders(headers) {
  const mapping = {};
  headers.forEach((h, i) => {
    const clean = h.trim().toLowerCase();
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.includes(clean)) mapping[field] = i;
    }
  });
  return mapping;
}

export default function ImportLeads() {
  const { data: account } = useAccount();
  const { data: leads } = useLeads(account?.accountEmail);
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setDone(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parseCSV(e.target.result);
      if (rows.length < 2) {
        toast({ title: "Invalid file", description: "The CSV must contain a header row and at least one lead.", variant: "destructive" });
        return;
      }
      const mapping = mapHeaders(rows[0]);
      if (mapping.name === undefined) {
        toast({ title: "Missing column", description: "Your CSV needs a 'Name' column.", variant: "destructive" });
        return;
      }
      const records = rows.slice(1).map((r) => ({
        name: r[mapping.name]?.trim() || "",
        email: mapping.email !== undefined ? r[mapping.email]?.trim() : "",
        phone: mapping.phone !== undefined ? r[mapping.phone]?.trim() : "",
        company: mapping.company !== undefined ? r[mapping.company]?.trim() : "",
        job_title: mapping.job_title !== undefined ? r[mapping.job_title]?.trim() : "",
        value: mapping.value !== undefined ? parseFloat(r[mapping.value]) || 0 : 0,
        notes: mapping.notes !== undefined ? r[mapping.notes]?.trim() : "",
      })).filter((r) => r.name);
      setParsed(records);
    };
    reader.readAsText(file);
  };

  const limit = getLeadLimit(account?.subscription);
  const remaining = limit ? Math.max(0, limit - leads.length) : null;
  const overLimit = parsed && remaining !== null && parsed.length > remaining;
  const toImport = parsed ? (remaining !== null ? parsed.slice(0, remaining) : parsed) : [];

  const runImport = async () => {
    setImporting(true);
    await base44.entities.Lead.bulkCreate(
      toImport.map((r) => ({ ...r, status: "new", source: "csv_import", account_email: account.accountEmail }))
    );
    queryClient.invalidateQueries({ queryKey: ["leads", account.accountEmail] });
    setDone(toImport.length);
    setParsed(null);
    setImporting(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Import Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV with columns like Name, Email, Phone, Company, Title, Value, Notes.
          {remaining !== null && ` You can import up to ${remaining.toLocaleString()} more lead${remaining !== 1 ? "s" : ""} on your plan.`}
        </p>
      </div>

      <label className="block border-2 border-dashed border-border rounded-3xl bg-card p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all">
        <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <p className="font-heading font-semibold">Click to upload your CSV</p>
        <p className="text-sm text-muted-foreground mt-1">{fileName || "Max one file at a time"}</p>
      </label>

      {done !== null && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Successfully imported {done} lead{done !== 1 && "s"}. They're now in your pipeline as "New".</p>
        </div>
      )}

      {parsed && (
        <div className="space-y-4">
          {overLimit && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm">
                Your file has {parsed.length} leads but your plan only allows {remaining} more.
                Only the first {remaining} will be imported — upgrade in Billing for more capacity.
              </p>
            </div>
          )}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <p className="font-heading font-semibold text-sm">Preview — {parsed.length} leads found</p>
              </div>
              <Button onClick={runImport} disabled={importing || toImport.length === 0} className="shadow-md shadow-primary/25">
                {importing ? "Importing..." : `Import ${toImport.length} Lead${toImport.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.slice(0, 50).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.company || "—"}</TableCell>
                      <TableCell>{r.value ? `$${r.value.toLocaleString()}` : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
