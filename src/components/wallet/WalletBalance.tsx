import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, Gift, ShoppingCart, Sparkles } from "lucide-react";

interface WalletBalanceProps {
  balance: number;
}

export function WalletBalance({ balance }: WalletBalanceProps) {
  return (
    <div className="space-y-4">
      {/* Main Balance Card */}
      <Card className="bg-gradient-to-br from-primary via-primary/90 to-accent overflow-hidden relative border-0 shadow-festive">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-4 right-4">
          <Sparkles className="h-6 w-6 text-white/40 animate-sparkle" />
        </div>
        
        <CardContent className="pt-6 pb-6 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <span className="text-white/80 font-medium">Wallet Balance</span>
          </div>
          
          <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
            ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-sm text-white/70">
            Available for purchases & rewards
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium">Credits Available</p>
                <p className="font-bold text-lg text-green-600">₹{balance.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium">Earn More</p>
                <p className="font-bold text-primary">Refer friends & earn ₹50</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dealer/20 bg-dealer/5 hover:bg-dealer/10 transition-colors">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-dealer/10">
                <ShoppingCart className="h-5 w-5 text-dealer" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium">Use Balance</p>
                <p className="font-bold text-dealer">Apply at checkout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
