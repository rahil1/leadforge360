import React from "react";
import { Users, TrendingUp, Trophy, Target } from "lucide-react";
import { getLeadLimit } from "@/lib/plans";

function Stat({ icon: Icon, label, value, sub, tint }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="font-heading text-2xl font-bold mt-1.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${tint}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function StatsBar({ leads, subscription }) {
  const limit = getLeadLimit(subscription);
  const won = leads.filter((l) => l.status === "won");
  const closed = leads.filter((l) => l.status === "won" || l.status === "lost");
  const pipeline = leads
    .filter((l) => !["won", "lost"].includes(l.status))
    .reduce((s, l) => s + (l.value || 0), 0);
  const revenue = won.reduce((s, l) => s + (l.value || 0), 0);
  const conversion = closed.length ? Math.round((won.length / closed.length) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat
        icon={Users}
        label="Total Leads"
        value={leads.length.toLocaleString()}
        sub={limit ? `of ${limit.toLocaleString()} allowed` : "Unlimited plan"}
        tint="bg-accent text-primary"
      />
      <Stat
        icon={TrendingUp}
        label="Pipeline Value"
        value={`$${pipeline.toLocaleString()}`}
        sub="Open opportunities"
        tint="bg-sky-50 text-sky-600"
      />
      <Stat
        icon={Trophy}
        label="Revenue Won"
        value={`$${revenue.toLocaleString()}`}
        sub={`${won.length} deals closed`}
        tint="bg-emerald-50 text-emerald-600"
      />
      <Stat
        icon={Target}
        label="Conversion Rate"
        value={`${conversion}%`}
        sub="Won vs. closed"
        tint="bg-violet-50 text-violet-600"
      />
    </div>
  );
}
