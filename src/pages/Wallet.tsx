import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import { ReferralCard } from "@/components/referral/ReferralCard";
import { ReferralHistory } from "@/components/referral/ReferralHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet as WalletIcon, Users, Sparkles } from "lucide-react";

export default function Wallet() {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Wallet & Referrals</h1>
          </div>
          <p className="text-muted-foreground ml-12 sm:ml-14">
            Manage your balance and earn rewards
          </p>
        </div>
        
        <Tabs defaultValue="wallet" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
            <TabsTrigger value="wallet" className="flex items-center gap-2 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <WalletIcon className="h-4 w-4" />
              <span className="font-medium">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4" />
              <span className="font-medium">Referrals</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-6 mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <WalletBalance balance={profile?.wallet_balance || 0} />
              </div>
              <div className="lg:col-span-2">
                <TransactionHistory />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6 mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
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
