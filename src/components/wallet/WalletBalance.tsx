import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Gift, ShoppingCart } from "lucide-react";

interface WalletBalanceProps {
  balance: number;
}

export function WalletBalance({ balance }: WalletBalanceProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <CardHeader className="pb-2 relative">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-4xl font-bold text-primary mb-2">
            ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-sm text-muted-foreground">
            Available for purchases & rewards
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="p-2 rounded-lg bg-green-500/10">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Credits Available</p>
            <p className="font-semibold text-sm">₹{balance.toLocaleString("en-IN")}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="p-2 rounded-lg bg-primary/10">
            <Gift className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Earn More</p>
            <p className="font-semibold text-sm">Refer friends & earn ₹50</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="p-2 rounded-lg bg-dealer/10">
            <ShoppingCart className="h-4 w-4 text-dealer" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Use Balance</p>
            <p className="font-semibold text-sm">Apply at checkout</p>
          </div>
        </div>
      </div>
    </div>
  );
}
