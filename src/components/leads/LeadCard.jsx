import React from "react";
import { Building2, DollarSign, UserRound } from "lucide-react";

export default function LeadCard({ lead, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl border border-border p-3.5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      <p className="font-medium text-sm leading-tight">{lead.name}</p>
      {lead.company && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
          <Building2 className="w-3 h-3" /> {lead.company}
        </p>
      )}
      <div className="flex items-center justify-between mt-2.5">
        {lead.value > 0 ? (
          <span className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-md px-1.5 py-0.5">
            <DollarSign className="w-3 h-3" />
            {Number(lead.value).toLocaleString()}
          </span>
        ) : <span />}
        {lead.assigned_to && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground" title={lead.assigned_to}>
            <UserRound className="w-3 h-3" />
            {lead.assigned_to.split("@")[0]}
          </span>
        )}
      </div>
    </button>
  );
}
