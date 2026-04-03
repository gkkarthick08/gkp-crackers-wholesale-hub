import { useState } from "react";
import {
  ShoppingCart, Trash2, Plus, Minus, X, Receipt,
  Phone, User, UserSearch, Banknote, Smartphone, CreditCard,
  PackageCheck, Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PosProduct {
  id: string;
  product_code: string;
  name: string;
  image_url: string | null;
  mrp: number;
  price: number;
  stock: number;
  category_name: string;
  brand_name: string;
  is_wholesale: boolean;
  case_qty?: number;
  case_price?: number;
}

interface PosCartItem extends PosProduct {
  quantity: number;
}

interface Props {
  cart: PosCartItem[];
  updateCartQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  paymentMethod: "cash" | "upi" | "card";
  setPaymentMethod: (v: "cash" | "upi" | "card") => void;
  packingCharges: number;
  setPackingCharges: (v: number) => void;
  deliveryCharges: number;
  setDeliveryCharges: (v: number) => void;
  isLookingUp: boolean;
  isOnline: boolean;
  onLookup: () => void;
  onGenerateBill: () => void;
  className?: string;
}

export default function POSCartPanel({
  cart, updateCartQty, removeFromCart, clearCart,
  customerName, setCustomerName, customerPhone, setCustomerPhone,
  paymentMethod, setPaymentMethod,
  packingCharges, setPackingCharges, deliveryCharges, setDeliveryCharges,
  isLookingUp, isOnline, onLookup, onGenerateBill,
  className = "",
}: Props) {
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [editQtyValue, setEditQtyValue] = useState("");

  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartMrpTotal = cart.reduce((s, i) => s + i.mrp * i.quantity, 0);
  const cartSaleTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartSavings = cartMrpTotal - cartSaleTotal;
  const subtotal = cartSaleTotal + packingCharges + deliveryCharges;
  const roundOff = Math.round(subtotal) - subtotal;
  const grandTotal = Math.round(subtotal);

  const startEditQty = (item: PosCartItem) => {
    setEditingQtyId(item.id);
    setEditQtyValue(String(item.quantity));
  };

  const commitEditQty = (item: PosCartItem) => {
    let val = parseInt(editQtyValue) || 0;
    if (item.is_wholesale && item.case_qty && item.case_qty > 1) {
      val = Math.max(item.case_qty, Math.round(val / item.case_qty) * item.case_qty);
    }
    if (val <= 0) val = item.is_wholesale && item.case_qty ? item.case_qty : 1;
    updateCartQty(item.id, val);
    setEditingQtyId(null);
  };

  return (
    <div className={`bg-card flex flex-col ${className}`}>
      {/* Cart Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-sm">Bill</h2>
          <Badge variant="secondary" className="text-[10px]">{cartItemCount} items</Badge>
        </div>
        {cart.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive text-xs h-7">
            <Trash2 className="h-3 w-3 mr-1" />Clear
          </Button>
        )}
      </div>

      {/* Customer Info */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onLookup()}
              className="pl-8 h-8 text-xs" />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs px-2"
            onClick={onLookup} disabled={isLookingUp || !isOnline}>
            <UserSearch className="h-3.5 w-3.5" />
            {isLookingUp ? "..." : "Lookup"}
          </Button>
        </div>
        <div className="relative">
          <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Customer name"
            value={customerName} onChange={(e) => setCustomerName(e.target.value)}
            className="pl-8 h-8 text-xs" />
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Tap products to add</p>
          </div>
        ) : (
          cart.map((item) => {
            const step = item.is_wholesale && item.case_qty ? item.case_qty : 1;
            const cases = item.is_wholesale && item.case_qty ? Math.round(item.quantity / item.case_qty) : null;
            const isEditing = editingQtyId === item.id;
            return (
              <div key={item.id} className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[11px] truncate">{item.name}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {item.is_wholesale && item.case_qty
                      ? `₹${item.case_price?.toLocaleString()}/cs • ${item.case_qty}pcs`
                      : `₹${item.price}/pc`}
                    {" • MRP ₹" + item.mrp}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="outline" size="icon" className="h-6 w-6"
                    onClick={() => updateCartQty(item.id, Math.max(0, item.quantity - step))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editQtyValue}
                      onChange={(e) => setEditQtyValue(e.target.value)}
                      onBlur={() => commitEditQty(item)}
                      onKeyDown={(e) => e.key === "Enter" && commitEditQty(item)}
                      className="w-12 h-6 text-center text-xs px-1"
                    />
                  ) : (
                    <button onClick={() => startEditQty(item)}
                      className="w-10 text-center hover:bg-muted rounded px-1 py-0.5">
                      <span className="text-xs font-bold">{item.quantity}</span>
                      {cases !== null && <p className="text-[7px] text-muted-foreground">{cases}cs</p>}
                    </button>
                  )}
                  <Button variant="outline" size="icon" className="h-6 w-6"
                    onClick={() => updateCartQty(item.id, item.quantity + step)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-bold text-xs w-14 text-right">₹{(item.price * item.quantity).toLocaleString()}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                  onClick={() => removeFromCart(item.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Payment & Billing */}
      {cart.length > 0 && (
        <div className="p-3 border-t border-border space-y-2.5">
          <div className="flex gap-1.5">
            {([
              { value: "cash" as const, icon: Banknote, label: "Cash" },
              { value: "upi" as const, icon: Smartphone, label: "UPI" },
              { value: "card" as const, icon: CreditCard, label: "Card" },
            ]).map((pm) => (
              <Button key={pm.value}
                variant={paymentMethod === pm.value ? "default" : "outline"}
                size="sm" className="flex-1 gap-1 text-[10px] h-7"
                onClick={() => setPaymentMethod(pm.value)}>
                <pm.icon className="h-3 w-3" />{pm.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                <PackageCheck className="h-3 w-3" />Packing ₹
              </label>
              <Input type="number" min={0} value={packingCharges || ""}
                onChange={(e) => setPackingCharges(Number(e.target.value) || 0)}
                className="h-7 text-xs" placeholder="0" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                <Truck className="h-3 w-3" />Delivery ₹
              </label>
              <Input type="number" min={0} value={deliveryCharges || ""}
                onChange={(e) => setDeliveryCharges(Number(e.target.value) || 0)}
                className="h-7 text-xs" placeholder="0" />
            </div>
          </div>

          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>MRP Total</span>
              <span className="line-through">₹{cartMrpTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Sale Total</span>
              <span>₹{cartSaleTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-accent font-medium">
              <span>You Save</span>
              <span>-₹{cartSavings.toLocaleString()}</span>
            </div>
            {packingCharges > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Packing</span><span>+₹{packingCharges}</span>
              </div>
            )}
            {deliveryCharges > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span><span>+₹{deliveryCharges}</span>
              </div>
            )}
            {roundOff !== 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Round Off</span>
                <span>{roundOff > 0 ? "+" : ""}₹{roundOff.toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between text-base font-bold">
              <span>Grand Total</span>
              <span className="text-primary">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <Button variant="hero" className="w-full h-11 gap-2 text-sm" onClick={onGenerateBill}>
            <Receipt className="h-4 w-4" />
            Generate Bill — ₹{grandTotal.toLocaleString()}
          </Button>
        </div>
      )}
    </div>
  );
}
