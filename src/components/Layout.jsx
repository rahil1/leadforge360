import React, { useState } from "react";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAccount } from "@/lib/useAccount";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Users2, Upload, CreditCard, UserCog, Ticket,
  Flame, LogOut, Menu, X, KanbanSquare, ShieldCheck,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Leads", path: "/leads", icon: KanbanSquare },
  { label: "Import CSV", path: "/import", icon: Upload },
  { label: "Team & Seats", path: "/team", icon: Users2 },
  { label: "Billing", path: "/billing", icon: CreditCard },
];

const adminItems = [
  { label: "Users", path: "/admin/users", icon: UserCog },
  { label: "Subscriptions", path: "/admin/subscriptions", icon: ShieldCheck },
  { label: "Discount Codes", path: "/admin/discounts", icon: Ticket },
];

function NavLink({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
      {item.label}
    </Link>
  );
}

export default function Layout() {
  const { data, isLoading } = useAccount();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const { user, subscription, isTeamMember } = data;

  if (!user.onboarding_completed && !isTeamMember) {
    return <Navigate to="/onboarding" replace />;
  }

  const plan = PLANS[subscription?.plan || "free"];
  const isAdmin = user.role === "admin";

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 py-6">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Flame className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-heading font-bold text-base leading-none tracking-tight">LeadForge 360</p>
          <p className="text-[11px] text-muted-foreground mt-1">Leads to revenue</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.path} item={item} active={location.pathname === item.path} onClick={() => setMobileOpen(false)} />
        ))}
        {isAdmin && (
          <>
            <p className="px-3 pt-6 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
            {adminItems.map((item) => (
              <NavLink key={item.path} item={item} active={location.pathname === item.path} onClick={() => setMobileOpen(false)} />
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="px-3 py-2.5 rounded-xl bg-secondary/70 mb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Badge variant="outline" className="bg-accent text-accent-foreground border-primary/20 shrink-0 capitalize">
              {plan?.name || "Free"}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => base44.auth.logout()}>
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-card border-r border-border flex-col z-30">
        {sidebar}
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-40 bg-card/90 backdrop-blur border-b border-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Flame className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold">LeadForge 360</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-foreground/30" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="p-4 md:p-8 max-w-[100rem] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
