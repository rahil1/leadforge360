import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export default function PlanCard({ plan, current, discount, onSelect, busy }) {
  const discounted = discount ? plan.price * (1 - discount / 100) : plan.price;
  return (
    <div className={`relative bg-card rounded-2xl border p-6 transition-all ${current ? "border-primary ring-1 ring-primary shadow-lg shadow-primary/15" : "border-border"}`}>
      {plan.key === "startup" && !current && (
        <span className="absolute -top-2.5 left-5 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded-full px-2.5 py-0.5">Popular</span>
      )}
      <div className="flex items-center justify-between">
        <p className="font-heading font-bold text-lg">{plan.name}</p>
        {current && <Badge className="bg-primary text-primary-foreground">Current Plan</Badge>}
      </div>
      <div className="mt-2">
        {discount && plan.price > 0 ? (
          <p className="font-heading text-3xl font-bold">
            ${discounted.toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground line-through ml-2">${plan.price}</span>
            <span className="text-xs font-normal text-muted-foreground">/mo</span>
          </p>
        ) : (
          <p className="font-heading text-3xl font-bold">${plan.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
        )}
      </div>
      <ul className="mt-4 space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" /> {f}
          </li>
        ))}
      </ul>
      {!current && (
        <Button onClick={() => onSelect(plan)} disabled={busy} className="w-full mt-6 shadow-md shadow-primary/25">
          {plan.price === 0 ? "Downgrade to Free" : "Switch with PayPal"}
        </Button>
      )}
    </div>
  );
}
