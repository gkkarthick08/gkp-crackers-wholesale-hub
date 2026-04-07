import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Gift, TrendingUp, Clock, CheckCircle, Coins } from "lucide-react";
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
  }, [user, fetchReferrals]);

  const fetchReferrals = useCallback(async () => {
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
  }, [user?.id]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-primary" />
            Your Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-primary" />
          Your Referrals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-green-500/5 border border-green-500/10 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Coins className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">₹{stats.earnings}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.claimed}</p>
            <p className="text-xs text-muted-foreground">Claimed</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* Referral List */}
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No referrals yet</p>
            <p className="text-sm text-muted-foreground mt-1">Share your code to start earning!</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {referral.referred_profile?.full_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(referral.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-bold text-green-600">
                      +₹{referral.bonus_amount || 0}
                    </p>
                    <Badge 
                      variant="outline"
                      className={referral.is_claimed 
                        ? "bg-green-500/10 text-green-600 border-green-500/20" 
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }
                    >
                      {referral.is_claimed ? "Claimed" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
