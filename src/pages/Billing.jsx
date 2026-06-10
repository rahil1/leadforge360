import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAccount, useInvalidateAccount } from "@/lib/useAccount";
import { PLANS, getSeatLimit, monthlyTotal } from "@/lib/plans";
import PlanCard from "@/components/billing/PlanCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Ticket, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

export default function Billing() {
  const { data: account } = useAccount();
  const invalidateAccount = useInvalidateAccount();
  const [codeInput, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const appliedCode = account?.subscription?.discount_code;
  const { data: codeRecord } = useQuery({
    queryKey: ["discount", appliedCode],
    queryFn: async () => {
      const matches = await base44.entities.DiscountCode.filter({ code: appliedCode });
      return matches[0] || null;
    },
    enabled: !!appliedCode,
  });

  if (!account) return null;
  const { subscription, isOwner, user } = account;

  if (!isOwner) {
    return (
      <div className="max-w-xl">
        <h1 className="font-heading text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground mt-2">Billing is managed by your account owner ({account.accountEmail}).</p>
      </div>
    );
  }

  const plan = PLANS[subscription?.plan || "free"];
  const seatLimit = getSeatLimit(subscription);
  const discount = codeRecord?.percent_off;

  const changePlan = async (newPlan) => {
    setBusy(true);
    const data = { plan: newPlan.key, status: "active" };
    if (newPlan.key === "free") data.extra_seats = 0;
    if (subscription) {
      await base44.entities.Subscription.update(subscription.id, data);
    } else {
      await base44.entities.Subscription.create({ user_email: user.email, ...data, payment_method: "paypal", started_date: format(new Date(), "yyyy-MM-dd") });
    }
    invalidateAccount();
    setBusy(false);
    toast({
      title: newPlan.price > 0 ? "Plan updated" : "Downgraded to Free",
      description: newPlan.price > 0
        ? `You're now on ${newPlan.name}. Recurring PayPal billing of $${newPlan.price}/mo applies.`
        : "Your account is now on the Free plan.",
    });
  };

  const adjustSeats = async (delta) => {
    const next = (subscription?.extra_seats || 0) + delta;
    if (next < 0) return;
    setBusy(true);
    await base44.entities.Subscription.update(subscription.id, { extra_seats: next });
    invalidateAccount();
    setBusy(false);
    toast({
      title: delta > 0 ? "Seat added" : "Seat removed",
      description: delta > 0 ? `+$${plan.extraSeatPrice}/mo added to your PayPal subscription.` : "Your monthly total has been reduced.",
    });
  };

  const applyCode = async (e) => {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    const matches = await base44.entities.DiscountCode.filter({ code });
    const dc = matches[0];
    const expired = dc?.expires_date && new Date(dc.expires_date) < new Date();
    const maxedOut = dc?.max_uses && (dc.times_used || 0) >= dc.max_uses;
    if (!dc || !dc.active || expired || maxedOut) {
      toast({ title: "Invalid code", description: "This discount code is not valid or has expired.", variant: "destructive" });
      setBusy(false);
      return;
    }
    await base44.entities.DiscountCode.update(dc.id, { times_used: (dc.times_used || 0) + 1 });
    await base44.entities.Subscription.update(subscription.id, { discount_code: dc.code });
    invalidateAccount();
    setCodeInput("");
    setBusy(false);
    toast({ title: "Discount applied", description: `${dc.percent_off}% off with code ${dc.code}.` });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-sm text-muted-foreground mt-1">All payments are processed securely via PayPal.</p>
      </div>

      {/* Current plan summary */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <p className="font-heading text-lg font-bold">{plan.name} Plan</p>
              <Badge variant="outline" className="capitalize bg-accent text-accent-foreground border-primary/20">
                {subscription?.status || "active"}
              </Badge>
              {subscription?.discount_code && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Code: {subscription.discount_code}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {plan.leadLimit ? `${plan.leadLimit.toLocaleString()} leads` : "Unlimited leads"} · {seatLimit} seat{seatLimit !== 1 && "s"}
              {subscription?.status === "trialing" && subscription?.trial_ends && ` · Trial ends ${format(new Date(subscription.trial_ends), "MMM d, yyyy")}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-[#0070BA]" />
            <div className="text-right">
              <p className="font-heading text-2xl font-bold">${monthlyTotal(subscription)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
              <p className="text-[11px] text-muted-foreground">Billed via PayPal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-5">
        {Object.values(PLANS).map((p) => (
          <PlanCard key={p.key} plan={p} current={p.key === plan.key} discount={discount} onSelect={changePlan} busy={busy} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Extra seats */}
        {plan.extraSeatPrice && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <p className="font-heading font-semibold">Extra Seats</p>
            <p className="text-sm text-muted-foreground mt-1">
              {plan.name} includes {plan.includedSeats} seats. Add more at ${plan.extraSeatPrice}/seat per month.
            </p>
            <div className="flex items-center gap-4 mt-5">
              <Button variant="outline" size="icon" disabled={busy || !(subscription?.extra_seats > 0)} onClick={() => adjustSeats(-1)}>
                <Minus className="w-4 h-4" />
              </Button>
              <div className="text-center min-w-[80px]">
                <p className="font-heading text-2xl font-bold">{subscription?.extra_seats || 0}</p>
                <p className="text-[11px] text-muted-foreground">extra seats</p>
              </div>
              <Button variant="outline" size="icon" disabled={busy} onClick={() => adjustSeats(1)}>
                <Plus className="w-4 h-4" />
              </Button>
              <p className="text-sm text-muted-foreground ml-2">
                = ${(subscription?.extra_seats || 0) * plan.extraSeatPrice}/mo
              </p>
            </div>
          </div>
        )}

        {/* Discount code */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            <p className="font-heading font-semibold">Discount Code</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Have a promo code? Apply it to your subscription.</p>
          <form onSubmit={applyCode} className="flex gap-3 mt-5">
            <Input placeholder="e.g. WELCOME20" value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} />
            <Button type="submit" variant="outline" disabled={busy || !subscription}>Apply</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
