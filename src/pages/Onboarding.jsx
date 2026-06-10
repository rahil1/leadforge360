import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLANS } from "@/lib/plans";
import { Flame, Check, ArrowRight, ArrowLeft, Building2, Target, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";

const goals = [
  { key: "convert", label: "Convert more leads into customers" },
  { key: "organize", label: "Organize my sales pipeline" },
  { key: "team", label: "Collaborate with my sales team" },
  { key: "import", label: "Centralize leads from spreadsheets" },
];

const sizes = ["Just me", "2-5", "6-20", "21-50", "50+"];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [goal, setGoal] = useState("");
  const [plan, setPlan] = useState("free");
  const [submitting, setSubmitting] = useState(false);

  const finish = async () => {
    setSubmitting(true);
    const user = await base44.auth.me();
    await base44.auth.updateMe({
      company_name: companyName,
      company_size: companySize,
      goal,
      onboarding_completed: true,
    });
    const existing = await base44.entities.Subscription.filter({ user_email: user.email });
    const subData = {
      user_email: user.email,
      plan,
      status: plan === "free" ? "active" : "trialing",
      extra_seats: 0,
      started_date: format(new Date(), "yyyy-MM-dd"),
      trial_ends: plan === "free" ? null : format(addDays(new Date(), 14), "yyyy-MM-dd"),
      payment_method: "paypal",
    };
    if (existing[0]) {
      await base44.entities.Subscription.update(existing[0].id, subData);
    } else {
      await base44.entities.Subscription.create(subData);
    }
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Flame className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">LeadForge 360</span>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-secondary"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="bg-card rounded-3xl border border-border shadow-xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-1">
                <Building2 className="w-5 h-5 text-primary" />
                <h1 className="font-heading text-2xl font-bold">Tell us about your business</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-8">This helps us tailor LeadForge 360 to you.</p>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Company name</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc." className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Team size</Label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <button key={s} onClick={() => setCompanySize(s)} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${companySize === s ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25" : "border-border hover:border-primary/40"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-10">
                <Button onClick={() => setStep(1)} disabled={!companyName} className="h-11 px-6">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="bg-card rounded-3xl border border-border shadow-xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-1">
                <Target className="w-5 h-5 text-primary" />
                <h1 className="font-heading text-2xl font-bold">What's your main goal?</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-8">We'll point you in the right direction.</p>
              <div className="space-y-3">
                {goals.map((g) => (
                  <button key={g.key} onClick={() => setGoal(g.key)} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border text-left text-sm font-medium transition-all ${goal === g.key ? "border-primary bg-accent shadow-sm" : "border-border hover:border-primary/40"}`}>
                    {g.label}
                    {goal === g.key && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-10">
                <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                <Button onClick={() => setStep(2)} disabled={!goal} className="h-11 px-6">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <Rocket className="w-5 h-5 text-primary" />
                  <h1 className="font-heading text-2xl font-bold">Choose your plan</h1>
                </div>
                <p className="text-sm text-muted-foreground">Paid plans start with a 14-day free trial. Billed via PayPal.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.values(PLANS).map((p) => (
                  <button key={p.key} onClick={() => setPlan(p.key)} className={`relative text-left bg-card rounded-2xl border p-5 transition-all ${plan === p.key ? "border-primary shadow-lg shadow-primary/15 ring-1 ring-primary" : "border-border hover:border-primary/40"}`}>
                    {p.key === "startup" && (
                      <span className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded-full px-2.5 py-0.5">Popular</span>
                    )}
                    <p className="font-heading font-bold">{p.name}</p>
                    <p className="font-heading text-2xl font-bold mt-1">${p.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                    <ul className="mt-3 space-y-1.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-primary mt-0.5 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                <Button onClick={finish} disabled={submitting} className="h-11 px-8 shadow-md shadow-primary/25">
                  {submitting ? "Setting up..." : plan === "free" ? "Start for Free" : "Start 14-Day Trial"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
