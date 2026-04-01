import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Search, Plus, Minus, ShoppingCart, Trash2, Receipt, Wifi, WifiOff,
  Package, User, Phone, CreditCard, Banknote, Smartphone, Printer,
  RefreshCw, ArrowLeft, X, Store, Edit3, UserSearch, Truck, PackageCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  cacheProducts, getCachedProducts, savePosOrder, getUnsyncedOrders,
  markOrderSynced, PosOrder, PosOrderItem
} from "@/lib/posDb";

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

export default function POS() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: authLoading, user } = useAuth();

  const [billingMode, setBillingMode] = useState<"retail" | "wholesale">("retail");
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("cash");
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<PosOrder | null>(null);
  const [packingCharges, setPackingCharges] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [editQtyValue, setEditQtyValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    getUnsyncedOrders().then((o) => setUnsyncedCount(o.length)).catch(() => {});
  }, [showReceipt]);

  useEffect(() => {
    loadProducts();
  }, [billingMode]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      if (isOnline) {
        if (billingMode === "wholesale") {
          const { data } = await (supabase as any)
            .from("wholesale_products")
            .select("*, category:categories(name), brand:brands(name)")
            .eq("is_visible", true)
            .order("name");
          if (data) {
            const mapped = data.map((p: any) => ({
              id: p.id, product_code: p.product_code, name: p.name,
              image_url: p.image_url, mrp: p.mrp, price: p.sale_price,
              stock: p.stock || 0, category_name: p.category?.name || "",
              brand_name: p.brand?.name || "", is_wholesale: true,
              case_qty: p.case_qty, case_price: p.case_price,
            }));
            setProducts(mapped);
            await cacheProducts(mapped, "wholesale_products");
            const cats = [...new Set(mapped.map((p: PosProduct) => p.category_name).filter(Boolean))];
            setCategories(cats as string[]);
          }
        } else {
          const { data } = await supabase
            .from("products")
            .select("*, category:categories(name), brand:brands(name)")
            .eq("is_visible", true)
            .order("name");
          if (data) {
            const mapped = data.map((p: any) => ({
              id: p.id, product_code: p.product_code, name: p.name,
              image_url: p.image_url, mrp: p.mrp, price: p.retail_price,
              stock: p.stock || 0, category_name: p.category?.name || "",
              brand_name: p.brand?.name || "", is_wholesale: false,
            }));
            setProducts(mapped);
            await cacheProducts(mapped, "products");
            const cats = [...new Set(mapped.map((p: PosProduct) => p.category_name).filter(Boolean))];
            setCategories(cats as string[]);
          }
        }
      } else {
        const storeName = billingMode === "wholesale" ? "wholesale_products" : "products";
        const cached = await getCachedProducts(storeName);
        setProducts(cached);
        const cats = [...new Set(cached.map((p: PosProduct) => p.category_name).filter(Boolean))];
        setCategories(cats as string[]);
      }
    } catch (err) {
      console.error("Error loading POS products:", err);
      const storeName = billingMode === "wholesale" ? "wholesale_products" : "products";
      const cached = await getCachedProducts(storeName);
      setProducts(cached);
    } finally {
      setIsLoading(false);
    }
  };

  // Customer lookup by phone
  const lookupCustomer = async () => {
    if (!customerPhone || customerPhone.length < 10 || !isOnline) return;
    setIsLookingUp(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, address, business_name, user_type")
        .eq("phone", customerPhone)
        .maybeSingle();
      if (data) {
        setCustomerName(data.full_name || "");
        setCustomerAddress(data.address || "");
        toast({ title: "Customer found!", description: `${data.full_name}${data.business_name ? ` — ${data.business_name}` : ""}` });
        if (data.user_type === "dealer" && billingMode === "retail") {
          setBillingMode("wholesale");
          setCart([]);
          toast({ title: "Switched to wholesale", description: "Customer is a dealer" });
        }
      } else {
        toast({ title: "Customer not found", description: "No profile with this phone number", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lookup failed", variant: "destructive" });
    } finally {
      setIsLookingUp(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === "All" || p.category_name === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart operations
  const addToCart = useCallback((product: PosProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const step = product.is_wholesale && product.case_qty ? product.case_qty : 1;
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + step } : i
        );
      }
      return [...prev, { ...product, quantity: step }];
    });
  }, []);

  const updateCartQty = useCallback((productId: string, newQty: number) => {
    setCart((prev) => {
      if (newQty <= 0) return prev.filter((i) => i.id !== productId);
      return prev.map((i) => (i.id === productId ? { ...i, quantity: newQty } : i));
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // Qty edit handlers
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

  // Billing calculations
  const cartMrpTotal = useMemo(() => cart.reduce((s, i) => s + i.mrp * i.quantity, 0), [cart]);
  const cartSaleTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartSavings = cartMrpTotal - cartSaleTotal;
  const subtotal = cartSaleTotal + packingCharges + deliveryCharges;
  const roundOff = Math.round(subtotal) - subtotal;
  const grandTotal = Math.round(subtotal);
  const cartItemCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  // Generate bill
  const generateBill = async () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }

    const orderId = crypto.randomUUID();
    const order: PosOrder = {
      id: orderId,
      created_at: new Date().toISOString(),
      customer_name: customerName || "Walk-in Customer",
      customer_phone: customerPhone || "",
      items: cart.map((i) => ({
        product_id: i.is_wholesale ? null : i.id,
        product_code: i.product_code,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        total_price: i.price * i.quantity,
        is_wholesale: i.is_wholesale,
      })),
      total_amount: grandTotal,
      payment_method: paymentMethod,
      billing_mode: billingMode,
      synced: false,
    };

    await savePosOrder(order);

    if (isOnline) {
      try {
        await syncSingleOrder(order);
        order.synced = true;
        await markOrderSynced(orderId);
      } catch (err) {
        console.error("Failed to sync order:", err);
      }
    }

    setShowReceipt(order);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setPackingCharges(0);
    setDeliveryCharges(0);
    toast({ title: "Bill generated!", description: `Order total: ₹${grandTotal.toLocaleString()}` });
  };

  const syncSingleOrder = async (order: PosOrder) => {
    const { data: orderNumber } = await supabase.rpc("generate_order_number");
    if (!orderNumber) throw new Error("Failed to generate order number");

    const { data: dbOrder, error: orderErr } = await supabase.from("orders").insert([{
      order_number: orderNumber,
      customer_id: user?.id || null,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || "POS",
      customer_address: "POS - In-Store",
      notes: `POS ${order.billing_mode} | ${order.payment_method}`,
      total_items: order.items.reduce((s, i) => s + i.quantity, 0),
      total_amount: order.total_amount,
      final_amount: order.total_amount,
      user_type: order.billing_mode === "wholesale" ? "dealer" as const : "retail" as const,
      status: "confirmed" as const,
    }]).select().single();

    if (orderErr) throw orderErr;

    const orderItems = order.items.map((i) => ({
      order_id: dbOrder.id,
      product_id: i.is_wholesale ? null : i.product_id,
      product_code: i.product_code,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.total_price,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) throw itemsErr;
  };

  const syncAllOrders = async () => {
    setIsSyncing(true);
    try {
      const unsynced = await getUnsyncedOrders();
      let synced = 0;
      for (const order of unsynced) {
        try {
          await syncSingleOrder(order);
          await markOrderSynced(order.id);
          synced++;
        } catch (err) {
          console.error("Failed to sync order:", order.id, err);
        }
      }
      setUnsyncedCount((prev) => prev - synced);
      toast({ title: `Synced ${synced}/${unsynced.length} orders` });
    } finally {
      setIsSyncing(false);
    }
  };

  const printReceipt = () => window.print();

  // ==================== RECEIPT VIEW ====================
  if (showReceipt) {
    const receiptMrpTotal = showReceipt.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-6 shadow-card print:shadow-none print:border-none" id="receipt">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">🎆 GKP Crackers</h1>
            <p className="text-xs text-muted-foreground">Tax Invoice / Bill of Supply</p>
            <Separator className="my-3" />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>{new Date(showReceipt.created_at).toLocaleString()}</p>
              <p className="font-medium text-foreground">Customer: {showReceipt.customer_name}</p>
              {showReceipt.customer_phone && <p>Phone: {showReceipt.customer_phone}</p>}
              <p>Payment: {showReceipt.payment_method.toUpperCase()} | Mode: {showReceipt.billing_mode.toUpperCase()}</p>
            </div>
          </div>

          <table className="w-full text-xs mb-3">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-1.5">#</th>
                <th className="text-left py-1.5">Item</th>
                <th className="text-center py-1.5">Qty</th>
                <th className="text-right py-1.5">MRP</th>
                <th className="text-right py-1.5">Rate</th>
                <th className="text-right py-1.5">Total</th>
              </tr>
            </thead>
            <tbody>
              {showReceipt.items.map((item, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-1">{i + 1}</td>
                  <td className="py-1">{item.product_name}</td>
                  <td className="text-center py-1">{item.quantity}</td>
                  <td className="text-right py-1 text-muted-foreground">₹{(item.unit_price * 1.2).toFixed(0)}</td>
                  <td className="text-right py-1">₹{item.unit_price}</td>
                  <td className="text-right py-1 font-medium">₹{item.total_price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 text-xs border-t border-border pt-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Sale Total</span>
              <span>₹{receiptMrpTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-1 border-t border-border">
              <span>GRAND TOTAL</span>
              <span className="text-primary">₹{showReceipt.total_amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-muted-foreground mt-4 mb-4 space-y-0.5">
            <p>{showReceipt.synced ? "✅ Synced" : "⏳ Pending sync"}</p>
            <p>Thank you for your purchase! 🎉</p>
          </div>

          <div className="flex gap-3 print:hidden">
            <Button variant="outline" className="flex-1 gap-2" onClick={printReceipt}>
              <Printer className="h-4 w-4" />Print
            </Button>
            <Button variant="hero" className="flex-1 gap-2" onClick={() => setShowReceipt(null)}>
              New Bill
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN POS VIEW ====================
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="bg-card border-b border-border px-3 py-2.5 flex items-center justify-between gap-2 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Store className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-bold hidden sm:block">POS System</h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant={billingMode === "retail" ? "default" : "outline"}
            size="sm"
            onClick={() => { setBillingMode("retail"); setCart([]); }}
            className="text-xs h-8 px-2.5"
          >
            Retail
          </Button>
          <Button
            variant={billingMode === "wholesale" ? "default" : "outline"}
            size="sm"
            onClick={() => { setBillingMode("wholesale"); setCart([]); }}
            className="text-xs h-8 px-2.5"
          >
            Wholesale
          </Button>

          <Separator orientation="vertical" className="h-5" />

          {isOnline ? (
            <Badge variant="secondary" className="bg-accent/20 text-accent-foreground text-[10px] gap-1 px-1.5">
              <Wifi className="h-3 w-3" />Online
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px] gap-1 px-1.5">
              <WifiOff className="h-3 w-3" />Offline
            </Badge>
          )}

          {unsyncedCount > 0 && (
            <Button variant="outline" size="sm" onClick={syncAllOrders}
              disabled={!isOnline || isSyncing} className="gap-1 text-xs h-8">
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
              Sync ({unsyncedCount})
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Product List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input ref={searchRef} placeholder="Search product or scan barcode..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10" autoFocus />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[130px] h-10">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto p-3 pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {filteredProducts.map((product) => {
                  const inCart = cart.find((i) => i.id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`text-left p-2.5 rounded-xl border transition-all hover:shadow-md ${
                        inCart
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden mb-2">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <p className="font-medium text-xs line-clamp-2 mb-1">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground mb-1">{product.product_code}</p>
                      {product.is_wholesale && product.case_qty ? (
                        <div>
                          <p className="font-bold text-primary text-sm">₹{product.case_price?.toLocaleString()}/case</p>
                          <p className="text-[10px] text-muted-foreground">{product.case_qty}pcs • ₹{product.price}/pc</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-primary text-sm">₹{product.price}</p>
                          <p className="text-[10px] text-muted-foreground line-through">MRP ₹{product.mrp}</p>
                        </div>
                      )}
                      {inCart && (
                        <Badge className="mt-1 text-[10px]" variant="secondary">
                          {inCart.quantity} in cart
                          {product.is_wholesale && product.case_qty
                            ? ` (${Math.round(inCart.quantity / product.case_qty)} cs)`
                            : ""}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ==================== CART PANEL ==================== */}
        <div className="w-full sm:w-[360px] lg:w-[400px] border-l border-border bg-card flex flex-col max-sm:hidden">
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

          {/* Customer Info with lookup */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lookupCustomer()}
                  className="pl-8 h-8 text-xs" />
              </div>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs px-2"
                onClick={lookupCustomer} disabled={isLookingUp || !isOnline}>
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
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
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

          {/* Payment & Detailed Billing */}
          {cart.length > 0 && (
            <div className="p-3 border-t border-border space-y-2.5">
              {/* Payment Method */}
              <div className="flex gap-1.5">
                {[
                  { value: "cash" as const, icon: Banknote, label: "Cash" },
                  { value: "upi" as const, icon: Smartphone, label: "UPI" },
                  { value: "card" as const, icon: CreditCard, label: "Card" },
                ].map((pm) => (
                  <Button key={pm.value}
                    variant={paymentMethod === pm.value ? "default" : "outline"}
                    size="sm" className="flex-1 gap-1 text-[10px] h-7"
                    onClick={() => setPaymentMethod(pm.value)}>
                    <pm.icon className="h-3 w-3" />{pm.label}
                  </Button>
                ))}
              </div>

              {/* Extra Charges */}
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

              {/* Detailed Totals */}
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>MRP Total</span>
                  <span className="line-through">₹{cartMrpTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Sale Total</span>
                  <span>₹{cartSaleTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>You Save</span>
                  <span>-₹{cartSavings.toLocaleString()}</span>
                </div>
                {packingCharges > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Packing</span>
                    <span>+₹{packingCharges}</span>
                  </div>
                )}
                {deliveryCharges > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span>+₹{deliveryCharges}</span>
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

              <Button variant="hero" className="w-full h-11 gap-2 text-sm" onClick={generateBill}>
                <Receipt className="h-4 w-4" />
                Generate Bill — ₹{grandTotal.toLocaleString()}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Bottom Sheet */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 z-40">
        {cart.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{cartItemCount} items • Save ₹{cartSavings.toLocaleString()}</p>
                <p className="text-lg font-bold text-primary">₹{grandTotal.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearCart}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="hero" size="sm" className="gap-1" onClick={generateBill}>
                  <Receipt className="h-4 w-4" />Bill
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Tap products to add to bill</p>
        )}
      </div>
    </div>
  );
}
