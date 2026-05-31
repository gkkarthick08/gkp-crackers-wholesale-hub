import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface PaymentSectionProps {
  user: any;
  useWallet: boolean;
  onUseWalletChange: (checked: boolean) => void;
  walletBalance: number;
  walletDiscount: number;
  walletEnabled: boolean;
}

export default function PaymentSection({
  user,
  useWallet,
  onUseWalletChange,
  walletBalance,
  walletDiscount,
  walletEnabled,
}: PaymentSectionProps) {
  if (!user || walletBalance <= 0 || !walletEnabled) {
    return null;
  }

  return (
    <Card className="shadow-card border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Use Wallet Balance</p>
              <p className="text-sm text-muted-foreground">
                Available: ₹{walletBalance.toFixed(2)}
              </p>
            </div>
          </div>
          <Switch
            checked={useWallet}
            onCheckedChange={onUseWalletChange}
          />
        </div>
        {useWallet && walletDiscount > 0 && (
          <p className="text-sm text-green-600 mt-3">
            You'll save ₹{walletDiscount.toFixed(2)} on this order!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
