import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Search, Users, TrendingUp, DollarSign, CheckCircle, Clock, Loader2 } from "lucide-react";
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
      
      // Fetch referrals
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (referralError) throw referralError;

      // Fetch all unique user IDs
      const referrerIds = [...new Set(referralData?.map(r => r.referrer_id).filter(Boolean) || [])];
      const referredIds = [...new Set(referralData?.map(r => r.referred_id).filter(Boolean) || [])];
      const allUserIds = [...new Set([...referrerIds, ...referredIds])];

      // Fetch profiles for all users
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

      // Enrich referral data with user info
      const enrichedReferrals = (referralData || []).map(r => ({
        ...r,
        referrer: r.referrer_id ? profilesMap[r.referrer_id] : undefined,
        referred: r.referred_id ? profilesMap[r.referred_id] : undefined,
      }));

      setReferrals(enrichedReferrals);

      // Calculate stats
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
      title: "Total Referrals",
      value: stats.totalReferrals,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Claimed",
      value: stats.claimedReferrals,
      icon: CheckCircle,
      color: "bg-green-500/10 text-green-600",
    },
    {
      title: "Pending",
      value: stats.pendingReferrals,
      icon: Clock,
      color: "bg-yellow-500/10 text-yellow-600",
    },
    {
      title: "Total Bonus Paid",
      value: `₹${stats.totalBonusPaid.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-dealer/10 text-dealer",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Gift className="h-8 w-8 text-primary" />
          Referral Management
        </h1>
        <p className="text-muted-foreground">
          Track and manage all user referrals and bonuses
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    {isLoading ? "..." : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            All Referrals
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No referrals match your search" : "No referrals yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Referred User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {referral.referrer?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {referral.referrer?.email || "No email"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                          {referral.referrer?.referral_code || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {referral.referred?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {referral.referred?.email || "No email"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(referral.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          ₹{referral.bonus_amount || 50}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={referral.is_claimed ? "default" : "secondary"}>
                          {referral.is_claimed ? "Claimed" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!referral.is_claimed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClaimBonus(referral.id)}
                            disabled={processingId === referral.id}
                          >
                            {processingId === referral.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Claim
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
