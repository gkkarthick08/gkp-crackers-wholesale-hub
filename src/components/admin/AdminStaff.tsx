import { useState, useEffect, useCallback } from "react";
import type { Database } from "@/integrations/supabase/types";
import { UserPlus, Trash2, Shield, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StaffMember {
  user_id: string;
  role_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
}

export default function AdminStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .eq("role", "staff");
      if (error) throw error;

      const staffList: StaffMember[] = [];
      for (const role of roles || []) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", role.user_id)
          .single();
        staffList.push({
          user_id: role.user_id,
          role_id: role.id,
          full_name: profile?.full_name || "Unknown",
          email: profile?.email || null,
          phone: profile?.phone || null,
        });
      }
      setStaff(staffList);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      toast({ title: "Error loading staff", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const addStaff = async () => {
    if (!searchEmail.trim()) return;
    setIsAdding(true);
    try {
      // Find user by email
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("email", searchEmail.trim().toLowerCase())
        .single();
      if (profileErr || !profile) {
        toast({ title: "User not found", description: "No account with this email. They must sign up first.", variant: "destructive" });
        return;
      }

      // Check if already staff
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.id)
        .eq("role", "staff")
        .maybeSingle();
      if (existing) {
        toast({ title: "Already staff", description: `${profile.full_name} is already a staff member.` });
        return;
      }

      // Add staff role
      const { error } = await supabase.from("user_roles").insert({
        user_id: profile.id,
        role: "staff" as Database["public"]["Enums"]["app_role"],
      });
      if (error) throw error;

      toast({ title: "Staff added!", description: `${profile.full_name} can now access POS.` });
      setSearchEmail("");
      fetchStaff();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const removeStaff = async (member: StaffMember) => {
    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", member.role_id);
      if (error) throw error;
      toast({ title: "Staff removed", description: `${member.full_name} no longer has staff access.` });
      fetchStaff();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Staff Management</h1>
        <p className="text-sm text-muted-foreground">Add or remove staff members who can access POS billing</p>
      </div>

      {/* Add Staff */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" />Add Staff Member
          </CardTitle>
          <CardDescription>Enter the email of a registered user to grant POS access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Enter user email..."
                value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStaff()}
                className="pl-10" />
            </div>
            <Button onClick={addStaff} disabled={isAdding || !searchEmail.trim()} className="gap-2">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Add Staff
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />Staff Members ({staff.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No staff members yet. Add one above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {staff.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{member.full_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {member.email && <span>{member.email}</span>}
                      {member.phone && <span>📞 {member.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Staff</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => removeStaff(member)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
