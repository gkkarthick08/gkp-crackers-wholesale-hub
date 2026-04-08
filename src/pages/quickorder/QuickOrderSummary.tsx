import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickOrderSummaryProps {
  totalItems: number;
  totalAmount: number;
  onViewEstimate: () => void;
  disabled: boolean;
}

export default function QuickOrderSummary({
  totalItems,
  totalAmount,
  onViewEstimate,
  disabled,
}: QuickOrderSummaryProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-4 z-40">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
          <div className="text-center sm:text-left">
            <p className="text-xs text-muted-foreground">Items</p>
            <p className="text-xl font-bold">{totalItems}</p>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div className="text-center sm:text-left">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl sm:text-2xl font-bold text-gradient-hero">₹{totalAmount.toLocaleString()}</p>
          </div>
        </div>
        <Button
          variant="hero"
          size="lg"
          className="gap-2 w-full sm:w-auto h-12"
          onClick={onViewEstimate}
          disabled={disabled}
        >
          <ShoppingCart className="h-5 w-5" />
          View Estimate Cart ({totalItems})
        </Button>
      </div>
    </div>
  );
}
