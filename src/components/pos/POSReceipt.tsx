import { useState, useMemo } from "react";
import { Printer, Edit2, Check, Plus, Minus, X, Search, PackageCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PosOrder, PosOrderItem } from "@/lib/posDb";
import { usePOSSettings } from "@/components/admin/AdminPOSSettings";

interface PosProductLite {
  id: string;
  product_code: string;
  name: string;
  mrp: number;
  price: number;
  is_wholesale: boolean;
}

interface Props {
  order: PosOrder;
  onNewBill: () => void;
  onUpdateOrder?: (order: PosOrder) => void;
  availableProducts?: PosProductLite[];
}

export default function POSReceipt({ order, onNewBill, onUpdateOrder, availableProducts = [] }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editOrder, setEditOrder] = useState<PosOrder>({ ...order, items: order.items.map(i => ({ ...i })) });
  const [productQuery, setProductQuery] = useState("");
  const { settings: posSettings } = usePOSSettings();

  const currentOrder = isEditing ? editOrder : order;
  const totalItems = currentOrder.items.reduce((s, i) => s + i.quantity, 0);
  const mrpTotal = currentOrder.items.reduce((s, i) => s + (i.mrp || 0) * i.quantity, 0);
  const saleTotal = currentOrder.items.reduce((s, i) => s + i.total_price, 0);
  const savings = mrpTotal - saleTotal;

  const recalcTotals = (o: PosOrder): PosOrder => {
    const sale = o.items.reduce((s, i) => s + i.total_price, 0);
    const mrp = o.items.reduce((s, i) => s + (i.mrp || 0) * i.quantity, 0);
    const total = Math.round(sale + (o.packing_charges || 0) + (o.delivery_charges || 0));
    return { ...o, total_amount: total, mrp_total: mrp, savings: mrp - sale };
  };

  const updateItem = (index: number, patch: Partial<PosOrderItem>) => {
    setEditOrder(prev => {
      const items = prev.items.map((it, i) => {
        if (i !== index) return it;
        const merged = { ...it, ...patch };
        merged.total_price = merged.unit_price * merged.quantity;
        return merged;
      });
      return recalcTotals({ ...prev, items });
    });
  };

  const updateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setEditOrder(prev => recalcTotals({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
      return;
    }
    updateItem(index, { quantity: newQty });
  };

  const removeItem = (index: number) => {
    setEditOrder(prev => recalcTotals({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const addProduct = (p: PosProductLite) => {
    setEditOrder(prev => {
      const existingIdx = prev.items.findIndex(i => i.product_code === p.product_code);
      if (existingIdx >= 0) {
        const items = prev.items.map((it, i) => i === existingIdx
          ? { ...it, quantity: it.quantity + 1, total_price: it.unit_price * (it.quantity + 1) }
          : it);
        return recalcTotals({ ...prev, items });
      }
      const newItem: PosOrderItem = {
        product_id: p.is_wholesale ? null : p.id,
        product_code: p.product_code,
        product_name: p.name,
        quantity: 1,
        unit_price: p.price,
        total_price: p.price,
        mrp: p.mrp,
        is_wholesale: p.is_wholesale,
      };
      return recalcTotals({ ...prev, items: [...prev.items, newItem] });
    });
    setProductQuery("");
  };

  const updateCharges = (field: "packing_charges" | "delivery_charges", val: number) => {
    setEditOrder(prev => recalcTotals({ ...prev, [field]: val }));
  };

  const updateCustomer = (field: "customer_name" | "customer_phone", val: string) => {
    setEditOrder(prev => ({ ...prev, [field]: val }));
  };

  const saveEdits = () => {
    onUpdateOrder?.(editOrder);
    setIsEditing(false);
  };

  const cancelEdits = () => {
    setEditOrder({ ...order, items: order.items.map(i => ({ ...i })) });
    setIsEditing(false);
    setProductQuery("");
  };

  const filteredProducts = useMemo(() => {
    if (!productQuery.trim()) return [];
    const q = productQuery.toLowerCase();
    return availableProducts
      .filter(p => p.name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q))
      .slice(0, 6);
  }, [productQuery, availableProducts]);

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
          {posSettings.posAddress && <p className="text-[10px] text-muted-foreground mt-0.5">{posSettings.posAddress}</p>}
          {posSettings.posPhone && <p className="text-[10px] text-muted-foreground">Ph: {posSettings.posPhone}</p>}
          {posSettings.posShowGst && posSettings.posGstNumber && (
            <p className="text-[10px] text-muted-foreground font-medium">GSTIN: {posSettings.posGstNumber}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Tax Invoice / Bill of Supply</p>
          <Separator className="my-3" />
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>{new Date(currentOrder.created_at).toLocaleString()}</p>
            {isEditing ? (
              <div className="space-y-1.5 mt-2 print:hidden">
                <Input value={editOrder.customer_name} onChange={(e) => updateCustomer("customer_name", e.target.value)}
                  placeholder="Customer name" className="h-7 text-xs" />
                <Input value={editOrder.customer_phone} onChange={(e) => updateCustomer("customer_phone", e.target.value)}
                  placeholder="Phone" className="h-7 text-xs" />
              </div>
            ) : (
              <>
                <p className="font-medium text-foreground">Customer: {currentOrder.customer_name}</p>
                {currentOrder.customer_phone && <p>Phone: {currentOrder.customer_phone}</p>}
              </>
            )}
            <p>Payment: {currentOrder.payment_method.toUpperCase()} | Mode: {currentOrder.billing_mode.toUpperCase()}</p>
          </div>
        </div>

        {/* Add Product (edit mode) */}
        {isEditing && availableProducts.length > 0 && (
          <div className="mb-3 print:hidden">
            <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
              <Plus className="h-3 w-3" />Add product
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={productQuery} onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search by name or code" className="pl-7 h-8 text-xs" />
            </div>
            {filteredProducts.length > 0 && (
              <div className="mt-1 border border-border rounded-md max-h-40 overflow-y-auto bg-popover">
                {filteredProducts.map(p => (
                  <button key={p.id} onClick={() => addProduct(p)}
                    className="w-full text-left px-2 py-1.5 hover:bg-muted text-xs flex justify-between items-center border-b border-border last:border-b-0">
                    <span className="truncate flex-1">{p.name} <span className="text-muted-foreground">({p.product_code})</span></span>
                    <span className="font-medium ml-2">₹{p.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Items Table */}
        <table className="w-full text-xs mb-3">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-1.5">#</th>
              <th className="text-left py-1.5">Item</th>
              <th className="text-center py-1.5">Qty</th>
              <th className="text-right py-1.5">Rate</th>
              <th className="text-right py-1.5">Total</th>
              {isEditing && <th className="py-1.5 w-6 print:hidden"></th>}
            </tr>
          </thead>
          <tbody>
            {currentOrder.items.map((item, i) => (
              <tr key={i} className="border-b border-border/30">
                <td className="py-1">{i + 1}</td>
                <td className="py-1">
                  {isEditing ? (
                    <Input value={item.product_name}
                      onChange={(e) => updateItem(i, { product_name: e.target.value })}
                      className="h-6 text-[10px] px-1" />
                  ) : item.product_name}
                </td>
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
                <td className="text-right py-1">
                  {isEditing ? (
                    <Input type="number" min={0} step="0.01" value={item.unit_price}
                      onChange={(e) => updateItem(i, { unit_price: parseFloat(e.target.value) || 0 })}
                      className="w-16 h-5 text-right text-[10px] px-1 ml-auto" />
                  ) : `₹${item.unit_price}`}
                </td>
                <td className="text-right py-1 font-medium">₹{item.total_price.toLocaleString()}</td>
                {isEditing && (
                  <td className="py-1 print:hidden">
                    <button onClick={() => removeItem(i)} className="text-destructive hover:bg-destructive/10 rounded p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Charges edit (edit mode) */}
        {isEditing && (
          <div className="grid grid-cols-2 gap-2 mb-3 print:hidden">
            <div>
              <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                <PackageCheck className="h-3 w-3" />Packing ₹
              </Label>
              <Input type="number" min={0} value={editOrder.packing_charges || ""}
                onChange={(e) => updateCharges("packing_charges", Number(e.target.value) || 0)}
                className="h-7 text-xs" placeholder="0" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                <Truck className="h-3 w-3" />Delivery ₹
              </Label>
              <Input type="number" min={0} value={editOrder.delivery_charges || ""}
                onChange={(e) => updateCharges("delivery_charges", Number(e.target.value) || 0)}
                className="h-7 text-xs" placeholder="0" />
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="space-y-1 text-xs border-t border-border pt-2">
          <div className="flex justify-between text-muted-foreground">
            <span>Total Items</span><span>{totalItems}</span>
          </div>
          {mrpTotal > 0 && mrpTotal !== saleTotal && (
            <>
              <div className="flex justify-between text-muted-foreground">
                <span>MRP Total</span><span className="line-through">₹{mrpTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Sale Total</span><span>₹{saleTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium text-primary">
                <span>🎉 You Save</span><span>₹{savings.toLocaleString()}</span>
              </div>
            </>
          )}
          {(currentOrder.packing_charges || 0) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Packing Charges</span><span>+₹{currentOrder.packing_charges}</span>
            </div>
          )}
          {(currentOrder.delivery_charges || 0) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Charges</span><span>+₹{currentOrder.delivery_charges}</span>
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
          {posSettings.posTermsText && <p className="italic mt-1">{posSettings.posTermsText}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-2 print:hidden flex-wrap">
          {isEditing ? (
            <>
              <Button variant="outline" className="flex-1 gap-2" onClick={cancelEdits}>Cancel</Button>
              <Button variant="hero" className="flex-1 gap-2" onClick={saveEdits}>
                <Check className="h-4 w-4" />Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-3.5 w-3.5" />Edit Bill
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />Print
              </Button>
              <Button variant="hero" className="flex-1 gap-2" onClick={onNewBill}>New Bill</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
