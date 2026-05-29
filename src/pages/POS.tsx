import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Navigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  cacheProducts, getCachedProducts, savePosOrder, getUnsyncedOrders,
  markOrderSynced, PosOrder
} from "@/lib/posDb";

import POSHeader from "@/components/pos/POSHeader";
import POSProductGrid from "@/components/pos/POSProductGrid";
import POSCartPanel from "@/components/pos/POSCartPanel";
import POSReceipt from "@/components/pos/POSReceipt";

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

type WholesaleProductRow = Database["public"]["Tables"]["wholesale_products"]["Row"] & {
  category: { name: string } | null;
  brand: { name: string } | null;
};

type RetailProductRow = Database["public"]["Tables"]["products"]["Row"] & {
  category: { name: string } | null;
  brand: { name: string } | null;
};

interface PosCartItem extends PosProduct {
  quantity: number;
}

export default function POS() {
  usePageMeta({ title: "POS System — GKP Crackers", description: "Point of Sale billing system" });
  const { toast } = useToast();
  const { isAdmin, isStaff, isLoading: authLoading, user } = useAuth();

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
  const [packingPercent, setPackingPercent] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Online/offline
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  useEffect(() => {
    getUnsyncedOrders().then((o) => setUnsyncedCount(o.length)).catch(() => {});
  }, [showReceipt]);

  useEffect(() => { loadProducts(); }, [billingMode, loadProducts]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isOnline) {
        if (billingMode === "wholesale") {
          const { data } = await supabase
            .from("wholesale_products")
            .select("*, category:categories(name), brand:brands(name)")
            .eq("is_visible", true)
            .order("name");
          if (data) {
            const mapped = data.map((p) => ({
              id: p.id,
              product_code: p.product_code,
              name: p.name,
              image_url: p.image_url,
              mrp: p.mrp,
              price: p.sale_price,
              stock: p.stock ?? 0,
              category_name: p.category?.name || "",
              brand_name: p.brand?.name || "",
              is_wholesale: true,
              case_qty: p.case_qty,
              case_price: p.case_price,
            }));
            setProducts(mapped);
            const storeName: "products" | "wholesale_products" = "wholesale_products";
            await cacheProducts(mapped, storeName);
            setCategories([...new Set(mapped.map((p: PosProduct) => p.category_name).filter(Boolean))] as string[]);
          }
        } else {
          const { data } = await supabase
            .from("products")
            .select("*, category:categories(name), brand:brands(name)")
            .eq("is_visible", true)
            .order("name");
          if (data) {
            const mapped = data.map((p) => ({
              id: p.id,
              product_code: p.product_code,
              name: p.name,
              image_url: p.image_url,
              mrp: p.mrp,
              price: p.retail_price,
              stock: p.stock ?? 0,
              category_name: p.category?.name || "",
              brand_name: p.brand?.name || "",
              is_wholesale: false,
              case_qty: p.case_qty,
              case_price: p.case_price,
            }));
            setProducts(mapped);
            const storeName: "products" | "wholesale_products" = "products";
            await cacheProducts(mapped, storeName);
            setCategories([...new Set(mapped.map((p: PosProduct) => p.category_name).filter(Boolean))] as string[]);
          }
        }
      } else {
        const storeName: "products" | "wholesale_products" = billingMode === "wholesale" ? "wholesale_products" : "products";
        const cached = await getCachedProducts(storeName);
        setProducts(cached);
        setCategories([...new Set(cached.map((p: PosProduct) => p.category_name).filter(Boolean))] as string[]);
      }
    } catch (err) {
      console.error("Error loading POS products:", err);
      const storeName: "products" | "wholesale_products" = billingMode === "wholesale" ? "wholesale_products" : "products";
      const cached = await getCachedProducts(storeName);
      setProducts(cached);
    } finally {
      setIsLoading(false);
    }
  }, [billingMode, isOnline]);

  const lookupCustomer = async () => {
    if (!customerPhone || customerPhone.length < 10 || !isOnline) return;
    setIsLookingUp(true);
    try {
      const { data } = await supabase
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
      const q = searchQuery.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q);
      const matchesCat = selectedCategory === "All" || p.category_name === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = useCallback((product: PosProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const step = product.is_wholesale && product.case_qty ? product.case_qty : 1;
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + step } : i);
      return [...prev, { ...product, quantity: step }];
    });
  }, []);

  const updateCartQty = useCallback((productId: string, newQty: number) => {
    setCart((prev) => newQty <= 0 ? prev.filter((i) => i.id !== productId) : prev.map((i) => i.id === productId ? { ...i, quantity: newQty } : i));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // Billing
  const cartSaleTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const subtotal = cartSaleTotal + packingCharges + deliveryCharges;
  const grandTotal = Math.round(subtotal);
  const cartItemCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const syncSingleOrder = async (order: PosOrder) => {
    // Save to pos_orders table
    const { data: posOrder, error: posErr } = await supabase.from("pos_orders").insert([{
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || null,
      customer_address: order.customer_address || null,
      billing_mode: order.billing_mode,
      payment_method: order.payment_method,
      total_amount: order.total_amount,
      mrp_total: order.mrp_total,
      savings: order.savings,
      packing_charges: order.packing_charges,
      delivery_charges: order.delivery_charges,
      payment_status: "paid",
      amount_paid: order.total_amount,
      balance_due: 0,
      created_by: user?.id || null,
    }]).select().single();
    if (posErr) throw posErr;

    // Save pos_order_items
    if (posOrder) {
      const posItems = order.items.map((i) => ({
        pos_order_id: posOrder.id,
        product_id: i.is_wholesale ? null : i.product_id,
        product_code: i.product_code,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
        mrp: i.mrp,
        is_wholesale: i.is_wholesale,
      }));
      await supabase.from("pos_order_items").insert(posItems);
    }

    // Also sync to orders table for legacy compatibility
    const { data: orderNumber } = await supabase.rpc("generate_order_number");
    if (!orderNumber) throw new Error("Failed to generate order number");
    const { data: dbOrder, error: orderErr } = await supabase.from("orders").insert([{
      order_number: orderNumber,
      customer_id: user?.id || null,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || "POS",
      customer_address: order.customer_address || "POS - In-Store",
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

  const cartMrpTotal = useMemo(() => cart.reduce((s, i) => s + i.mrp * i.quantity, 0), [cart]);

  const generateBill = async () => {
    if (cart.length === 0) { toast({ title: "Cart is empty", variant: "destructive" }); return; }
    const orderId = crypto.randomUUID();
    const savings = cartMrpTotal - cartSaleTotal;
    const order: PosOrder = {
      id: orderId,
      created_at: new Date().toISOString(),
      customer_name: customerName || "Walk-in Customer",
      customer_phone: customerPhone || "",
      customer_address: customerAddress || "",
      items: cart.map((i) => ({
        product_id: i.is_wholesale ? null : i.id,
        product_code: i.product_code,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        total_price: i.price * i.quantity,
        mrp: i.mrp,
        is_wholesale: i.is_wholesale,
      })),
      total_amount: grandTotal,
      mrp_total: cartMrpTotal,
      savings: savings,
      packing_charges: packingCharges,
      delivery_charges: deliveryCharges,
      payment_method: paymentMethod,
      billing_mode: billingMode,
      synced: false,
    };
    await savePosOrder(order);
    if (isOnline) {
      try { await syncSingleOrder(order); order.synced = true; await markOrderSynced(orderId); }
      catch (err) { console.error("Failed to sync order:", err); }
    }
    setShowReceipt(order);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setPackingCharges(0);
    setDeliveryCharges(0);
    setPackingPercent(0);
    setMobileCartOpen(false);
    toast({ title: "Bill generated!", description: `Order total: ₹${grandTotal.toLocaleString()}` });
  };

  const syncAllOrders = async () => {
    setIsSyncing(true);
    try {
      const unsynced = await getUnsyncedOrders();
      let synced = 0;
      for (const order of unsynced) {
        try { await syncSingleOrder(order); await markOrderSynced(order.id); synced++; }
        catch (err) { console.error("Failed to sync order:", order.id, err); }
      }
      setUnsyncedCount((prev) => prev - synced);
      toast({ title: `Synced ${synced}/${unsynced.length} orders` });
    } finally { setIsSyncing(false); }
  };

  // Auth guard
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user || (!isAdmin && !isStaff)) return <Navigate to="/" replace />;

  // Receipt view
  if (showReceipt) return (
    <POSReceipt
      order={showReceipt}
      onNewBill={() => setShowReceipt(null)}
      onUpdateOrder={(updated) => setShowReceipt(updated)}
    />
  );

  // Main POS view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <POSHeader
        billingMode={billingMode}
        setBillingMode={setBillingMode}
        clearCart={clearCart}
        isOnline={isOnline}
        unsyncedCount={unsyncedCount}
        isSyncing={isSyncing}
        onSync={syncAllOrders}
      />

      <div className="flex flex-1 overflow-hidden">
        <POSProductGrid
          products={filteredProducts}
          cart={cart}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          isLoading={isLoading}
          searchRef={searchRef}
          onAddToCart={addToCart}
        />

        {/* Desktop Cart Panel */}
        <POSCartPanel
          className="w-[360px] lg:w-[400px] border-l border-border max-sm:hidden"
          cart={cart}
          updateCartQty={updateCartQty}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          packingCharges={packingCharges}
          setPackingCharges={setPackingCharges}
          packingPercent={packingPercent}
          setPackingPercent={setPackingPercent}
          deliveryCharges={deliveryCharges}
          setDeliveryCharges={setDeliveryCharges}
          isLookingUp={isLookingUp}
          isOnline={isOnline}
          onLookup={lookupCustomer}
          onGenerateBill={generateBill}
        />
      </div>

      {/* Mobile Cart Bottom Bar + Sheet */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 z-40">
        {cart.length > 0 ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{cartItemCount} items</p>
              <p className="text-lg font-bold text-primary">₹{grandTotal.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ShoppingCart className="h-4 w-4" />View Cart
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-2xl">
                  <POSCartPanel
                    className="h-full"
                    cart={cart}
                    updateCartQty={updateCartQty}
                    removeFromCart={removeFromCart}
                    clearCart={clearCart}
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    customerPhone={customerPhone}
                    setCustomerPhone={setCustomerPhone}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    packingCharges={packingCharges}
                    setPackingCharges={setPackingCharges}
                    packingPercent={packingPercent}
                    setPackingPercent={setPackingPercent}
                    deliveryCharges={deliveryCharges}
                    setDeliveryCharges={setDeliveryCharges}
                    isLookingUp={isLookingUp}
                    isOnline={isOnline}
                    onLookup={lookupCustomer}
                    onGenerateBill={generateBill}
                  />
                </SheetContent>
              </Sheet>
              <Button variant="hero" size="sm" className="gap-1" onClick={generateBill}>
                <Receipt className="h-4 w-4" />Bill
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Tap products to add to bill</p>
        )}
      </div>
    </div>
  );
}
