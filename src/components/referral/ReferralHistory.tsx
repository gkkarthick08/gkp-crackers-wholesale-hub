import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Gift } from "lucide-react";
import { format } from "date-fns";

interface Referral {
  id: string;
  referred_id: string;
  bonus_amount: number;
  is_claimed: boolean;
  created_at: string;
  referred_profile?: {
    full_name: string;
    email: string | null;
  };
}

export function ReferralHistory() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, claimed: 0, pending: 0, earnings: 0 });

  useEffect(() => {
    if (user) {
      fetchReferrals();
    }
  }, [user]);

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          id,
          referred_id,
          bonus_amount,
          is_claimed,
          created_at
        `)
        .eq("referrer_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch referred user profiles separately
      const referralData = data || [];
      const referredIds = referralData.map(r => r.referred_id).filter(Boolean);
      
      let profilesMap: Record<string, { full_name: string; email: string | null }> = {};
      
      if (referredIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", referredIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name, email: p.email };
            return acc;
          }, {} as Record<string, { full_name: string; email: string | null }>);
        }
      }

      const enrichedReferrals = referralData.map(r => ({
        ...r,
        referred_profile: r.referred_id ? profilesMap[r.referred_id] : undefined
      }));

      setReferrals(enrichedReferrals);

      // Calculate stats
      const total = referralData.length;
      const claimed = referralData.filter(r => r.is_claimed).length;
      const earnings = referralData.filter(r => r.is_claimed).reduce((sum, r) => sum + (r.bonus_amount || 0), 0);
      
      setStats({
        total,
        claimed,
        pending: total - claimed,
        earnings
      });
    } catch (error) {
      console.error("Error fetching referrals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Your Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Your Referrals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
          <div className="bg-green-500/10 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{stats.claimed}</p>
            <p className="text-xs text-muted-foreground">Claimed</p>
          </div>
          <div className="bg-yellow-500/10 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-primary">₹{stats.earnings}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
        </div>

        {/* Referral List */}
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No referrals yet</p>
            <p className="text-xs mt-1">Share your code to start earning!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {referral.referred_profile?.full_name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(referral.created_at), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    +₹{referral.bonus_amount || 0}
                  </p>
                  <Badge variant={referral.is_claimed ? "default" : "secondary"}>
                    {referral.is_claimed ? "Claimed" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
