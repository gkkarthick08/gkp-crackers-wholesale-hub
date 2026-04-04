import { useState } from "react";
import { Printer, Edit2, Check, Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PosOrder } from "@/lib/posDb";
import { usePOSSettings } from "@/components/admin/AdminPOSSettings";

interface Props {
  order: PosOrder;
  onNewBill: () => void;
  onUpdateOrder?: (order: PosOrder) => void;
}

export default function POSReceipt({ order, onNewBill, onUpdateOrder }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editOrder, setEditOrder] = useState<PosOrder>({ ...order, items: order.items.map(i => ({ ...i })) });
  const { settings: posSettings } = usePOSSettings();

  const totalItems = (isEditing ? editOrder : order).items.reduce((s, i) => s + i.quantity, 0);
  const currentOrder = isEditing ? editOrder : order;
  const mrpTotal = currentOrder.mrp_total || currentOrder.items.reduce((s, i) => s + (i.mrp || 0) * i.quantity, 0);
  const saleTotal = currentOrder.items.reduce((s, i) => s + i.total_price, 0);
  const savings = mrpTotal - saleTotal;

  const updateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setEditOrder(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
      return;
    }
    setEditOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, quantity: newQty, total_price: item.unit_price * newQty } : item
      ),
    }));
  };

  const removeItem = (index: number) => {
    setEditOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const saveEdits = () => {
    const newSaleTotal = editOrder.items.reduce((s, i) => s + i.total_price, 0);
    const newMrpTotal = editOrder.items.reduce((s, i) => s + (i.mrp || 0) * i.quantity, 0);
    const newTotal = Math.round(newSaleTotal + (editOrder.packing_charges || 0) + (editOrder.delivery_charges || 0));
    const updated: PosOrder = {
      ...editOrder,
      total_amount: newTotal,
      mrp_total: newMrpTotal,
      savings: newMrpTotal - newSaleTotal,
    };
    setEditOrder(updated);
    onUpdateOrder?.(updated);
    setIsEditing(false);
  };

  const maxWidth = posSettings.posBillSize === "58mm" ? "max-w-sm" : "max-w-md";

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className={`${maxWidth} mx-auto bg-card border border-border rounded-2xl p-6 shadow-lg print:shadow-none print:border-none`} id="receipt">
        {/* Header */}
        <div className="text-center mb-4">
          {posSettings.posShowLogo && posSettings.posLogoUrl && (
            <img src={posSettings.posLogoUrl} alt="Logo" className="h-12 mx-auto mb-2 print:h-10" />
          )}
          <h1 className="text-2xl font-bold">{posSettings.posStoreName || "🎆 GKP Crackers"}</h1>
          {posSettings.posAddress && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{posSettings.posAddress}</p>
          )}
          {posSettings.posPhone && (
            <p className="text-[10px] text-muted-foreground">Ph: {posSettings.posPhone}</p>
          )}
          {posSettings.posShowGst && posSettings.posGstNumber && (
            <p className="text-[10px] text-muted-foreground font-medium">GSTIN: {posSettings.posGstNumber}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Tax Invoice / Bill of Supply</p>
          <Separator className="my-3" />
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>{new Date(currentOrder.created_at).toLocaleString()}</p>
            <p className="font-medium text-foreground">Customer: {currentOrder.customer_name}</p>
            {currentOrder.customer_phone && <p>Phone: {currentOrder.customer_phone}</p>}
            <p>Payment: {currentOrder.payment_method.toUpperCase()} | Mode: {currentOrder.billing_mode.toUpperCase()}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs mb-3">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-1.5">#</th>
              <th className="text-left py-1.5">Item</th>
              <th className="text-center py-1.5">Qty</th>
              <th className="text-right py-1.5">Rate</th>
              <th className="text-right py-1.5">Total</th>
              {isEditing && <th className="py-1.5 w-6"></th>}
            </tr>
          </thead>
          <tbody>
            {currentOrder.items.map((item, i) => (
              <tr key={i} className="border-b border-border/30">
                <td className="py-1">{i + 1}</td>
                <td className="py-1">{item.product_name}</td>
                <td className="text-center py-1">
                  {isEditing ? (
                    <div className="flex items-center justify-center gap-0.5">
                      <button onClick={() => updateItemQty(i, item.quantity - 1)}
                        className="h-5 w-5 rounded border border-border flex items-center justify-center hover:bg-muted">
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <Input value={item.quantity}
                        onChange={(e) => updateItemQty(i, parseInt(e.target.value) || 0)}
                        className="w-10 h-5 text-center text-[10px] px-0.5" />
                      <button onClick={() => updateItemQty(i, item.quantity + 1)}
                        className="h-5 w-5 rounded border border-border flex items-center justify-center hover:bg-muted">
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ) : item.quantity}
                </td>
                <td className="text-right py-1">₹{item.unit_price}</td>
                <td className="text-right py-1 font-medium">₹{item.total_price.toLocaleString()}</td>
                {isEditing && (
                  <td className="py-1">
                    <button onClick={() => removeItem(i)} className="text-destructive hover:bg-destructive/10 rounded p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="space-y-1 text-xs border-t border-border pt-2">
          <div className="flex justify-between text-muted-foreground">
            <span>Total Items</span>
            <span>{totalItems}</span>
          </div>
          {mrpTotal > 0 && mrpTotal !== saleTotal && (
            <>
              <div className="flex justify-between text-muted-foreground">
                <span>MRP Total</span>
                <span className="line-through">₹{mrpTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Sale Total</span>
                <span>₹{saleTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium text-green-600">
                <span>🎉 You Save</span>
                <span>₹{savings.toLocaleString()}</span>
              </div>
            </>
          )}
          {(currentOrder.packing_charges || 0) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Packing Charges</span>
              <span>+₹{currentOrder.packing_charges}</span>
            </div>
          )}
          {(currentOrder.delivery_charges || 0) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Charges</span>
              <span>+₹{currentOrder.delivery_charges}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-1 border-t border-border">
            <span>GRAND TOTAL</span>
            <span className="text-primary">₹{currentOrder.total_amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-muted-foreground mt-4 mb-4 space-y-0.5">
          <p>{currentOrder.synced ? "✅ Synced" : "⏳ Pending sync"}</p>
          <p>{posSettings.posFooterText}</p>
          {posSettings.posTermsText && (
            <p className="italic mt-1">{posSettings.posTermsText}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 print:hidden">
          {isEditing ? (
            <>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => { setEditOrder({ ...order, items: order.items.map(i => ({ ...i })) }); setIsEditing(false); }}>
                Cancel
              </Button>
              <Button variant="hero" className="flex-1 gap-2" onClick={saveEdits}>
                <Check className="h-4 w-4" />Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-3.5 w-3.5" />Edit
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />Print
              </Button>
              <Button variant="hero" className="flex-1 gap-2" onClick={onNewBill}>
                New Bill
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
