import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Search, Users, TrendingUp, DollarSign, CheckCircle, Clock, Loader2, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ReferralData {
  id: string;
  referrer_id: string;
  referred_id: string;
  bonus_amount: number | null;
  is_claimed: boolean;
  created_at: string;
  referrer?: {
    full_name: string;
    email: string | null;
    referral_code: string | null;
  };
  referred?: {
    full_name: string;
    email: string | null;
  };
}

interface ReferralStats {
  totalReferrals: number;
  claimedReferrals: number;
  pendingReferrals: number;
  totalBonusPaid: number;
}

export default function AdminReferrals() {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    claimedReferrals: 0,
    pendingReferrals: 0,
    totalBonusPaid: 0,
  });
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setIsLoading(true);
      
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (referralError) throw referralError;

      const referrerIds = [...new Set(referralData?.map(r => r.referrer_id).filter(Boolean) || [])];
      const referredIds = [...new Set(referralData?.map(r => r.referred_id).filter(Boolean) || [])];
      const allUserIds = [...new Set([...referrerIds, ...referredIds])];

      let profilesMap: Record<string, { full_name: string; email: string | null; referral_code: string | null }> = {};
      
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, referral_code")
          .in("id", allUserIds);

        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name, email: p.email, referral_code: p.referral_code };
            return acc;
          }, {} as Record<string, { full_name: string; email: string | null; referral_code: string | null }>);
        }
      }

      const enrichedReferrals = (referralData || []).map(r => ({
        ...r,
        referrer: r.referrer_id ? profilesMap[r.referrer_id] : undefined,
        referred: r.referred_id ? profilesMap[r.referred_id] : undefined,
      }));

      setReferrals(enrichedReferrals);

      const total = referralData?.length || 0;
      const claimed = referralData?.filter(r => r.is_claimed).length || 0;
      const totalPaid = referralData?.filter(r => r.is_claimed).reduce((sum, r) => sum + (r.bonus_amount || 0), 0) || 0;

      setStats({
        totalReferrals: total,
        claimedReferrals: claimed,
        pendingReferrals: total - claimed,
        totalBonusPaid: totalPaid,
      });
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast({
        title: "Error",
        description: "Failed to load referrals",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimBonus = async (referralId: string) => {
    try {
      setProcessingId(referralId);
      
      const { data, error } = await supabase.rpc("claim_referral_bonus", {
        referral_id: referralId,
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Bonus Claimed",
          description: "Referral bonus has been credited to both users",
        });
        fetchReferrals();
      } else {
        toast({
          title: "Error",
          description: "Failed to claim bonus",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error claiming bonus:", error);
      toast({
        title: "Error",
        description: "Failed to claim referral bonus",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredReferrals = referrals.filter((referral) => {
    const query = searchQuery.toLowerCase();
    return (
      referral.referrer?.full_name?.toLowerCase().includes(query) ||
      referral.referrer?.email?.toLowerCase().includes(query) ||
      referral.referrer?.referral_code?.toLowerCase().includes(query) ||
      referral.referred?.full_name?.toLowerCase().includes(query) ||
      referral.referred?.email?.toLowerCase().includes(query)
    );
  });

  const statCards = [
    {
      title: "Total",
      value: stats.totalReferrals,
      icon: Users,
      className: "bg-primary/5 border-primary/20 text-primary",
    },
    {
      title: "Claimed",
      value: stats.claimedReferrals,
      icon: CheckCircle,
      className: "bg-green-500/5 border-green-500/20 text-green-600",
    },
    {
      title: "Pending",
      value: stats.pendingReferrals,
      icon: Clock,
      className: "bg-amber-500/5 border-amber-500/20 text-amber-600",
    },
    {
      title: "Paid",
      value: `₹${stats.totalBonusPaid.toLocaleString()}`,
      icon: DollarSign,
      className: "bg-dealer/5 border-dealer/20 text-dealer",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Gift className="h-7 w-7 text-primary" />
          Referral Management
        </h1>
        <p className="text-muted-foreground mt-1">Track and manage all referrals and bonuses</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className={stat.className}>
            <CardContent className="py-4 px-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-current/10">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">{isLoading ? "..." : stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            All Referrals ({filteredReferrals.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery ? "No referrals match your search" : "No referrals yet"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border">
                {filteredReferrals.map((referral) => (
                  <div key={referral.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col gap-3">
                      {/* Referrer & Referred */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Referrer */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <UserPlus className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {referral.referrer?.full_name || "Unknown"}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                                {referral.referrer?.referral_code || "N/A"}
                              </code>
                              <span className="text-xs text-muted-foreground">referred</span>
                            </div>
                          </div>
                        </div>

                        {/* Arrow on desktop */}
                        <span className="hidden sm:block text-muted-foreground">→</span>

                        {/* Referred */}
                        <div className="flex items-center gap-3 flex-1 min-w-0 sm:pl-0 pl-13">
                          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                            <Users className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {referral.referred?.full_name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(referral.created_at), "dd MMM yyyy")}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Bonus & Action */}
                      <div className="flex items-center justify-between pl-13 sm:pl-0">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-green-600">
                            ₹{referral.bonus_amount || 50}
                          </span>
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
                        
                        {!referral.is_claimed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClaimBonus(referral.id)}
                            disabled={processingId === referral.id}
                            className="gap-2"
                          >
                            {processingId === referral.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">Claim Bonus</span>
                                <span className="sm:hidden">Claim</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
