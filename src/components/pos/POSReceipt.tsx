import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PosOrder } from "@/lib/posDb";

interface Props {
  order: PosOrder;
  onNewBill: () => void;
}

export default function POSReceipt({ order, onNewBill }: Props) {
  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-6 shadow-lg print:shadow-none print:border-none" id="receipt">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">🎆 GKP Crackers</h1>
          <p className="text-xs text-muted-foreground">Tax Invoice / Bill of Supply</p>
          <Separator className="my-3" />
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>{new Date(order.created_at).toLocaleString()}</p>
            <p className="font-medium text-foreground">Customer: {order.customer_name}</p>
            {order.customer_phone && <p>Phone: {order.customer_phone}</p>}
            <p>Payment: {order.payment_method.toUpperCase()} | Mode: {order.billing_mode.toUpperCase()}</p>
          </div>
        </div>

        <table className="w-full text-xs mb-3">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-1.5">#</th>
              <th className="text-left py-1.5">Item</th>
              <th className="text-center py-1.5">Qty</th>
              <th className="text-right py-1.5">Rate</th>
              <th className="text-right py-1.5">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b border-border/30">
                <td className="py-1">{i + 1}</td>
                <td className="py-1">{item.product_name}</td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">₹{item.unit_price}</td>
                <td className="text-right py-1 font-medium">₹{item.total_price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-xs border-t border-border pt-2">
          <div className="flex justify-between text-muted-foreground">
            <span>Total Items</span>
            <span>{totalItems}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-1 border-t border-border">
            <span>GRAND TOTAL</span>
            <span className="text-primary">₹{order.total_amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground mt-4 mb-4 space-y-0.5">
          <p>{order.synced ? "✅ Synced" : "⏳ Pending sync"}</p>
          <p>Thank you for your purchase! 🎉</p>
        </div>

        <div className="flex gap-3 print:hidden">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />Print
          </Button>
          <Button variant="hero" className="flex-1 gap-2" onClick={onNewBill}>
            New Bill
          </Button>
        </div>
      </div>
    </div>
  );
}
