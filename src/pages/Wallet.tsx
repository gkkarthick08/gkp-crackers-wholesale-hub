import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import { ReferralCard } from "@/components/referral/ReferralCard";
import { ReferralHistory } from "@/components/referral/ReferralHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet as WalletIcon, Users } from "lucide-react";

export default function Wallet() {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Wallet & Referrals</h1>
        
        <Tabs defaultValue="wallet" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <WalletIcon className="h-4 w-4" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Referrals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <WalletBalance balance={profile?.wallet_balance || 0} />
              </div>
              <div className="md:col-span-2">
                <TransactionHistory />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <ReferralCard />
              <ReferralHistory />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
