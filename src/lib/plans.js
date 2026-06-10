export const PLANS = {
  free: {
    key: "free",
    name: "Free",
    price: 0,
    leadLimit: 20,
    includedSeats: 1,
    extraSeatPrice: null,
    features: ["Manage up to 20 leads", "Kanban pipeline board", "CSV import", "1 seat"],
  },
  startup: {
    key: "startup",
    name: "Startup",
    price: 29,
    leadLimit: 1000,
    includedSeats: 3,
    extraSeatPrice: 5,
    features: [
      "Manage up to 1,000 leads",
      "3 seats included",
      "Invite team members by email",
      "Extra seats at $5/seat",
      "CSV import & assignment",
    ],
  },
  pro: {
    key: "pro",
    name: "Pro",
    price: 49,
    leadLimit: null,
    includedSeats: 5,
    extraSeatPrice: 5,
    features: [
      "Everything in Startup",
      "Unlimited leads",
      "5 seats included",
      "Extra seats at $5/seat",
      "Priority support",
    ],
  },
};

export const LEAD_STATUSES = [
  { key: "new", label: "New", dot: "bg-sky-500", badge: "bg-sky-50 text-sky-700 border-sky-200" },
  { key: "contacted", label: "Contacted", dot: "bg-violet-500", badge: "bg-violet-50 text-violet-700 border-violet-200" },
  { key: "qualified", label: "Qualified", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "proposal", label: "Proposal", dot: "bg-primary", badge: "bg-accent text-accent-foreground border-primary/20" },
  { key: "won", label: "Won", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "lost", label: "Lost", dot: "bg-rose-400", badge: "bg-rose-50 text-rose-600 border-rose-200" },
];

export function getLeadLimit(subscription) {
  if (subscription?.lead_limit_override) return subscription.lead_limit_override;
  const plan = PLANS[subscription?.plan || "free"];
  return plan ? plan.leadLimit : 20;
}

export function getSeatLimit(subscription) {
  const plan = PLANS[subscription?.plan || "free"];
  return (plan?.includedSeats || 1) + (subscription?.extra_seats || 0);
}

export function monthlyTotal(subscription) {
  const plan = PLANS[subscription?.plan || "free"];
  if (!plan) return 0;
  return plan.price + (subscription?.extra_seats || 0) * (plan.extraSeatPrice || 0);
}
