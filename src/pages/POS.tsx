import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, Minus, ShoppingCart, Trash2, Receipt, Wifi, WifiOff,
  Package, User, Phone, CreditCard, Banknote, Smartphone, Printer,
  RefreshCw, ToggleLeft, ToggleRight, ArrowLeft, X, Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  cacheProducts, getCachedProducts, savePosOrder, getUnsyncedOrders,
  markOrderSynced, getAllPosOrders, PosOrder, PosOrderItem
} from "@/lib/posDb";

interface PosProduct {
  id: string;
  product_code: string;
  name: string;
  image_url: string | null;
  mrp: number;
  price: number; // retail_price or sale_price
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
  const { isAdmin, user } = useAuth();

  const [billingMode, setBillingMode] = useState<"retail" | "wholesale">("retail");
  const [posMode, setPosMode] = useState<"admin" | "self">("admin");
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("cash");
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<PosOrder | null>(null);
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

  // Count unsynced
  useEffect(() => {
    getUnsyncedOrders().then((o) => setUnsyncedCount(o.length)).catch(() => {});
  }, [showReceipt]);

  // Load products
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
        // Offline: load from IndexedDB
        const storeName = billingMode === "wholesale" ? "wholesale_products" : "products";
        const cached = await getCachedProducts(storeName);
        setProducts(cached);
        const cats = [...new Set(cached.map((p: PosProduct) => p.category_name).filter(Boolean))];
        setCategories(cats as string[]);
      }
    } catch (err) {
      console.error("Error loading POS products:", err);
      // Fallback to offline cache
      const storeName = billingMode === "wholesale" ? "wholesale_products" : "products";
      const cached = await getCachedProducts(storeName);
      setProducts(cached);
    } finally {
      setIsLoading(false);
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

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartMrpTotal = useMemo(() => cart.reduce((s, i) => s + i.mrp * i.quantity, 0), [cart]);
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
      total_amount: cartTotal,
      payment_method: paymentMethod,
      billing_mode: billingMode,
      synced: false,
    };

    // Save to IndexedDB
    await savePosOrder(order);

    // Try to sync immediately if online
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
    toast({ title: "Bill generated!", description: `Order total: ₹${cartTotal.toLocaleString()}` });
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

  // Receipt print
  const printReceipt = () => {
    window.print();
  };

  // Redirect non-admins away (admins only for admin mode)
  if (!isAdmin && posMode === "admin") {
    // Allow self-checkout for non-admins
  }

  // Receipt view
  if (showReceipt) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-6 shadow-card print:shadow-none print:border-none" id="receipt">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">🎆 GKP Crackers</h1>
            <p className="text-sm text-muted-foreground">POS Receipt</p>
            <Separator className="my-3" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{new Date(showReceipt.created_at).toLocaleString()}</p>
              <p>Customer: {showReceipt.customer_name}</p>
              {showReceipt.customer_phone && <p>Phone: {showReceipt.customer_phone}</p>}
              <p>Payment: {showReceipt.payment_method.toUpperCase()} | {showReceipt.billing_mode.toUpperCase()}</p>
            </div>
          </div>
          <Separator className="mb-4" />
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {showReceipt.items.map((item, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-1.5 text-xs">{item.product_name}</td>
                  <td className="text-center py-1.5">{item.quantity}</td>
                  <td className="text-right py-1.5">₹{item.unit_price}</td>
                  <td className="text-right py-1.5 font-medium">₹{item.total_price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Separator className="mb-3" />
          <div className="flex justify-between text-lg font-bold">
            <span>TOTAL</span>
            <span className="text-primary">₹{showReceipt.total_amount.toLocaleString()}</span>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-4 mb-6">
            {showReceipt.synced ? "✅ Synced to server" : "⏳ Pending sync"}
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold hidden sm:block">POS System</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Billing Mode Toggle */}
          <Button
            variant={billingMode === "retail" ? "default" : "outline"}
            size="sm"
            onClick={() => { setBillingMode("retail"); setCart([]); }}
            className="text-xs"
          >
            Retail
          </Button>
          <Button
            variant={billingMode === "wholesale" ? "default" : "outline"}
            size="sm"
            onClick={() => { setBillingMode("wholesale"); setCart([]); }}
            className="text-xs"
          >
            Wholesale
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Online/Offline indicator */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground text-xs gap-1">
                <Wifi className="h-3 w-3" />Online
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs gap-1">
                <WifiOff className="h-3 w-3" />Offline
              </Badge>
            )}
          </div>

          {/* Sync button */}
          {unsyncedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={syncAllOrders}
              disabled={!isOnline || isSyncing}
              className="gap-1 text-xs"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
              Sync ({unsyncedCount})
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Product List (Left Panel) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search & Filter */}
          <div className="p-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search product or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
                autoFocus
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px] h-10">
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

          {/* Product Grid */}
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
                      className={`text-left p-3 rounded-xl border transition-all hover:shadow-md ${
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

        {/* Cart Panel (Right Panel) */}
        <div className="w-full sm:w-[360px] lg:w-[400px] border-l border-border bg-card flex flex-col max-sm:hidden">
          {/* Cart Header */}
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Bill</h2>
              <Badge variant="secondary" className="text-xs">{cartItemCount} items</Badge>
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive text-xs">
                <Trash2 className="h-3 w-3 mr-1" />Clear
              </Button>
            )}
          </div>

          {/* Customer Info */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <div className="relative flex-1">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Tap products to add</p>
              </div>
            ) : (
              cart.map((item) => {
                const step = item.is_wholesale && item.case_qty ? item.case_qty : 1;
                const cases = item.is_wholesale && item.case_qty ? Math.round(item.quantity / item.case_qty) : null;
                return (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.is_wholesale && item.case_qty
                          ? `₹${item.case_price?.toLocaleString()}/case • ${item.case_qty}pcs`
                          : `₹${item.price}/pc`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => updateCartQty(item.id, Math.max(0, item.quantity - step))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="w-10 text-center">
                        <span className="text-sm font-bold">{item.quantity}</span>
                        {cases !== null && <p className="text-[8px] text-muted-foreground">{cases}cs</p>}
                      </div>
                      <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => updateCartQty(item.id, item.quantity + step)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-bold text-sm w-16 text-right">₹{(item.price * item.quantity).toLocaleString()}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Payment & Total */}
          {cart.length > 0 && (
            <div className="p-3 border-t border-border space-y-3">
              {/* Payment Method */}
              <div className="flex gap-2">
                {[
                  { value: "cash" as const, icon: Banknote, label: "Cash" },
                  { value: "upi" as const, icon: Smartphone, label: "UPI" },
                  { value: "card" as const, icon: CreditCard, label: "Card" },
                ].map((pm) => (
                  <Button
                    key={pm.value}
                    variant={paymentMethod === pm.value ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-1 text-xs"
                    onClick={() => setPaymentMethod(pm.value)}
                  >
                    <pm.icon className="h-3.5 w-3.5" />{pm.label}
                  </Button>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>MRP Total</span>
                  <span className="line-through">₹{cartMrpTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-accent font-medium">
                  <span>Savings</span>
                  <span>-₹{(cartMrpTotal - cartTotal).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <Button variant="hero" className="w-full h-12 gap-2 text-base" onClick={generateBill}>
                <Receipt className="h-5 w-5" />
                Generate Bill — ₹{cartTotal.toLocaleString()}
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
                <p className="text-xs text-muted-foreground">{cartItemCount} items</p>
                <p className="text-lg font-bold text-primary">₹{cartTotal.toLocaleString()}</p>
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
