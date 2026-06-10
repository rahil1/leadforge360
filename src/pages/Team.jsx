import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "@/lib/useAccount";
import { PLANS, getSeatLimit } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users2, Mail, Trash2, Crown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

export default function Team() {
  const { data: account } = useAccount();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: team } = useQuery({
    queryKey: ["team", account?.accountEmail],
    queryFn: () => base44.entities.TeamMember.filter({ owner_email: account.accountEmail }),
    enabled: !!account?.accountEmail,
    initialData: [],
  });

  if (!account) return null;
  const { subscription, accountEmail, isOwner, user } = account;
  const plan = PLANS[subscription?.plan || "free"];
  const activeMembers = team.filter((m) => m.status !== "removed");
  const seatLimit = getSeatLimit(subscription);
  const seatsUsed = 1 + activeMembers.length; // owner + members
  const canInvite = plan.key !== "free" && seatsUsed < seatLimit;

  const invite = async (e) => {
    e.preventDefault();
    if (!canInvite) return;
    setInviting(true);
    const email = inviteEmail.trim().toLowerCase();
    await base44.entities.TeamMember.create({
      owner_email: accountEmail,
      member_email: email,
      status: "active",
      role: "member",
    });
    await base44.users.inviteUser(email, "user");
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: `You've been added to ${user.company_name || "a team"} on LeadForge 360`,
      body: `Hi,\n\n${user.full_name || accountEmail} has added you to their sales team on LeadForge 360.\n\nYou now have access to the team's shared lead pipeline. Check your inbox for an invitation to create your account, then sign in to start working leads.\n\n— LeadForge 360`,
      from_name: "LeadForge 360",
    });
    queryClient.invalidateQueries({ queryKey: ["team", accountEmail] });
    setInviteEmail("");
    setInviting(false);
    toast({ title: "Invitation sent", description: `${email} has been invited and notified by email.` });
  };

  const removeMember = async (member) => {
    await base44.entities.TeamMember.update(member.id, { status: "removed" });
    queryClient.invalidateQueries({ queryKey: ["team", accountEmail] });
    toast({ title: "Seat freed", description: `${member.member_email} was removed from the team.` });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Team & Seats</h1>
        <p className="text-sm text-muted-foreground mt-1">Invite teammates to collaborate on your lead pipeline.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-primary" />
            <p className="font-heading font-semibold text-sm">Seat Usage</p>
          </div>
          <p className="text-sm text-muted-foreground">{seatsUsed} of {seatLimit} seat{seatLimit !== 1 && "s"} used</p>
        </div>
        <Progress value={(seatsUsed / seatLimit) * 100} className="h-2" />
        <p className="text-xs text-muted-foreground mt-3">
          {plan.key === "free"
            ? "The Free plan includes 1 seat. Upgrade to Startup or Pro to invite your team."
            : `${plan.name} includes ${plan.includedSeats} seats${subscription?.extra_seats ? ` + ${subscription.extra_seats} extra purchased` : ""}. Buy additional seats at $${plan.extraSeatPrice}/seat in Billing.`}
        </p>
        {(plan.key === "free" || seatsUsed >= seatLimit) && isOwner && (
          <Link to="/billing">
            <Button variant="outline" size="sm" className="mt-4">
              {plan.key === "free" ? "Upgrade Plan" : "Add More Seats"}
            </Button>
          </Link>
        )}
      </div>

      {isOwner && plan.key !== "free" && (
        <form onSubmit={invite} className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <p className="font-heading font-semibold text-sm mb-3">Invite a team member</p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input required type="email" className="pl-9" placeholder="teammate@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <Button type="submit" disabled={!canInvite || inviting} className="shadow-md shadow-primary/25">
              {inviting ? "Sending..." : "Send Invite"}
            </Button>
          </div>
          {!canInvite && (
            <p className="text-xs text-destructive mt-2">All seats are in use. Remove a member or add seats in Billing.</p>
          )}
        </form>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border">
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
              <Crown className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{accountEmail}</p>
              <p className="text-xs text-muted-foreground">Account owner</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-accent text-accent-foreground border-primary/20">Owner</Badge>
        </div>
        {activeMembers.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-muted-foreground">
                {m.member_email[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{m.member_email}</p>
                <p className="text-xs text-muted-foreground capitalize">{m.status}</p>
              </div>
            </div>
            {isOwner && (
              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeMember(m)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        {activeMembers.length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">No team members yet.</p>
        )}
      </div>
    </div>
  );
}
