import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

function AdminUsersContent() {
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
    initialData: [],
  });
  const { data: subs } = useQuery({
    queryKey: ["admin-subs"],
    queryFn: () => base44.entities.Subscription.list("-created_date", 500),
    initialData: [],
  });

  const subOf = (email) => subs.find((s) => s.user_email === email);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q);
  });

  const changeRole = async (u, role) => {
    await base44.entities.User.update(u.id, { role });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    toast({ title: "Role updated", description: `${u.email} is now ${role}.` });
  };

  const invite = async (e) => {
    e.preventDefault();
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim().toLowerCase(), inviteRole);
    setInviteEmail("");
    setInviting(false);
    toast({ title: "Invitation sent", description: `${inviteEmail} was invited as ${inviteRole}.` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">{users.length} registered users on the platform.</p>
      </div>

      <form onSubmit={invite} className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Invite a new user</p>
          <Input required type="email" placeholder="user@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
        </div>
        <Select value={inviteRole} onValueChange={setInviteRole}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={inviting} className="shadow-md shadow-primary/25">
          <UserPlus className="w-4 h-4 mr-2" /> {inviting ? "Inviting..." : "Invite"}
        </Button>
      </form>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>User</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Onboarded</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const sub = subOf(u.email);
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.company_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-accent text-accent-foreground border-primary/20">
                        {PLANS[sub?.plan]?.name || "Free"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.onboarding_completed ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Yes</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-secondary text-muted-foreground">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {u.created_date ? format(new Date(u.created_date), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <Select value={u.role || "user"} onValueChange={(v) => changeRole(u, v)}>
                        <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  return <AdminGuard><AdminUsersContent /></AdminGuard>;
}
