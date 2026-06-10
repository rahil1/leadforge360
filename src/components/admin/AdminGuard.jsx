import React from "react";
import { useAccount } from "@/lib/useAccount";
import { ShieldAlert } from "lucide-react";

export default function AdminGuard({ children }) {
  const { data, isLoading } = useAccount();
  if (isLoading) return null;
  if (data.user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="w-10 h-10 text-muted-foreground mb-4" />
        <p className="font-heading font-semibold">Admin access required</p>
        <p className="text-sm text-muted-foreground mt-1">You don't have permission to view this page.</p>
      </div>
    );
  }
  return children;
}
