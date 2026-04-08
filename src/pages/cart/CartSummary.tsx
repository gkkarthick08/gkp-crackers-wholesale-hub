import { Tag } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface CartSummaryProps {
  totalItems: number;
  totalMrp: number;
  totalAmount: number;
  totalSavings: number;
  savingsPercentage: number;
  walletDiscount: number;
  finalAmount: number;
  minOrderValue: number;
  amountNeeded: number;
  isMinOrderMet: boolean;
}

export default function CartSummary({
  totalItems,
  totalMrp,
  totalAmount,
  totalSavings,
  savingsPercentage,
  walletDiscount,
  finalAmount,
  minOrderValue,
  amountNeeded,
  isMinOrderMet,
}: CartSummaryProps) {
  return (
    <Card className="shadow-card border-primary/20">
      <CardHeader>
        <CardTitle>Order Estimate Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-muted-foreground">
          <span>Total Items</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>MRP Total</span>
          <span className="line-through">₹{totalMrp.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Sale Price</span>
          <span>₹{totalAmount.toLocaleString()}</span>
        </div>
        {totalSavings > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              Your Savings
            </span>
            <span>-₹{totalSavings.toLocaleString()} ({savingsPercentage}%)</span>
          </div>
        )}
        {walletDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Wallet Discount</span>
            <span>-₹{walletDiscount.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t border-border pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total to Pay</span>
            <span className="text-gradient-hero">₹{finalAmount.toLocaleString()}</span>
          </div>
        </div>

        {!isMinOrderMet && (
          <div className="bg-destructive/10 rounded-xl p-4 text-sm text-destructive">
            ⚠️ Minimum order: ₹{minOrderValue.toLocaleString()}. Add ₹{amountNeeded.toLocaleString()} more.
          </div>
        )}

        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
          ⚠️ This is an estimate. Final price will be confirmed.
        </div>
      </CardContent>
    </Card>
  );
}
