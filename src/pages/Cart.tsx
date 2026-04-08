import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, AlertTriangle, TrendingDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { usePageMeta } from "@/hooks/usePageMeta";
import { validateCustomerDetails } from "@/lib/validations";
import CartItemsList from "@/pages/cart/CartItemsList";
import CartSummary from "@/pages/cart/CartSummary";
import PaymentSection from "@/pages/cart/PaymentSection";
import CartCheckout from "@/pages/cart/CartCheckout";

interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

export default function Cart() {
  usePageMeta({ title: "Cart — GKP Crackers", description: "Review your cart and place your order." });
  const { items, updateQuantity, removeItem, clearCart, totalAmount, totalItems, totalMrp, totalSavings } = useCart();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    notes: ""
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [useWallet, setUseWallet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minOrderValue, setMinOrderValue] = useState(500);

  const isDealer = profile?.user_type === "dealer";

  // Fetch min order value from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["minOrderValue", "minOrderValueDealer"]);

        if (data && data.length > 0) {
          const minOrderSetting = data.find(s => s.key === "minOrderValue");
          const minOrderDealerSetting = data.find(s => s.key === "minOrderValueDealer");

          if (isDealer && minOrderDealerSetting?.value) {
            setMinOrderValue(Number(minOrderDealerSetting.value) || 1000);
          } else if (minOrderSetting?.value) {
            setMinOrderValue(Number(minOrderSetting.value) || 500);
          }
        }
      } catch (_error) {
        console.error("Error fetching settings:", _error);
      }
    };

    fetchSettings();
  }, [isDealer]);

  // Update customer details when profile changes
  useEffect(() => {
    if (profile) {
      setCustomerDetails(prev => ({
        ...prev,
        name: prev.name || profile.full_name || "",
        phone: prev.phone || profile.phone || "",
        address: prev.address || profile.address || "",
      }));
    }
  }, [profile]);

  const walletBalance = profile?.wallet_balance || 0;
  const walletDiscount = useWallet ? Math.min(walletBalance, totalAmount) : 0;
  const finalAmount = totalAmount - walletDiscount;
  const isMinOrderMet = totalAmount >= minOrderValue;
  const amountNeeded = minOrderValue - totalAmount;
  const savingsPercentage = totalMrp > 0 ? Math.round((totalSavings / totalMrp) * 100) : 0;

  const handleCustomerDetailsChange = (field: string, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const sendToWhatsApp = () => {
    const validation = validateCustomerDetails(customerDetails);
    if (!validation.success) {
      setFieldErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      toast({
        title: "Please check your details",
        description: firstError,
        variant: "destructive"
      });
      return;
    }
    setFieldErrors({});

    if (!isMinOrderMet) {
      toast({
        title: "Minimum order not met",
        description: `Add ₹${amountNeeded.toLocaleString()} more to proceed.`,
        variant: "destructive"
      });
      return;
    }

    // Build WhatsApp message
    let message = `🎆 *NEW ORDER ESTIMATE - GKP CRACKERS*\n\n`;
    message += `👤 *Customer:* ${customerDetails.name}\n`;
    message += `📞 *Phone:* ${customerDetails.phone}\n`;
    message += `📍 *Address:* ${customerDetails.address}\n`;
    if (customerDetails.notes) {
      message += `📝 *Notes:* ${customerDetails.notes}\n`;
    }
    message += `\n━━━━━━━━━━━━━━━━\n`;
    message += `📦 *ORDER DETAILS:*\n\n`;

    items.forEach((item, index) => {
      const itemSaving = (item.mrp - item.price) * item.quantity;
      const cases = item.is_wholesale && item.case_qty ? Math.round(item.quantity / item.case_qty) : null;
      message += `${index + 1}. ${item.name}\n`;
      message += `   MRP: ₹${item.mrp}/pc → Sale: ₹${item.price}/pc\n`;
      if (item.is_wholesale && item.case_qty) {
        message += `   Case: ${item.case_qty} pcs × ₹${item.price} = ₹${item.case_price?.toLocaleString()}/case\n`;
        message += `   Qty: ${cases} case(s) = ${item.quantity} pcs → ₹${(item.quantity * item.price).toLocaleString()}\n`;
      } else {
        message += `   Qty: ${item.quantity} × ₹${item.price} = ₹${(item.quantity * item.price).toLocaleString()}\n`;
      }
      if (itemSaving > 0) {
        message += `   💰 Saving: ₹${itemSaving.toLocaleString()}\n`;
      }
      message += `\n`;
    });

    message += `━━━━━━━━━━━━━━━━\n`;
    message += `📊 *TOTAL ITEMS:* ${totalItems}\n`;
    message += `💵 *MRP TOTAL:* ₹${totalMrp.toLocaleString()}\n`;
    message += `🎉 *YOUR SAVINGS:* ₹${totalSavings.toLocaleString()} (${savingsPercentage}% OFF)\n`;
    message += `💰 *SALE TOTAL:* ₹${totalAmount.toLocaleString()}\n`;
    if (walletDiscount > 0) {
      message += `🎁 *WALLET DISCOUNT:* -₹${walletDiscount.toLocaleString()}\n`;
    }
    message += `💵 *FINAL TOTAL:* ₹${finalAmount.toLocaleString()}\n\n`;
    message += `⚠️ _This is an estimate. Final price may vary._`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/918610153961?text=${encodedMessage}`, "_blank");

    toast({
      title: "Order sent to WhatsApp!",
      description: "We'll contact you shortly to confirm your order.",
    });
  };

  const placeOrder = async () => {
    const validation = validateCustomerDetails(customerDetails);
    if (!validation.success) {
      setFieldErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      toast({
        title: "Please check your details",
        description: firstError,
        variant: "destructive"
      });
      return;
    }
    setFieldErrors({});

    if (!isMinOrderMet) {
      toast({
        title: "Minimum order not met",
        description: `Add ₹${amountNeeded.toLocaleString()} more to proceed.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Refresh prices from DB to prevent stale price rejection
      const retailIds = items.filter(i => !i.is_wholesale).map(i => i.id);
      const wholesaleIds = items.filter(i => i.is_wholesale).map(i => i.id);

      const priceMap: Record<string, number> = {};

      if (retailIds.length > 0) {
        const { data: retailProducts } = await supabase
          .from("products")
          .select("id, retail_price, wholesale_price")
          .in("id", retailIds);

        if (retailProducts) {
          const isDealerVerified = profile?.user_type === "dealer" && profile?.is_verified;
          retailProducts.forEach(p => {
            priceMap[p.id] = isDealerVerified ? p.wholesale_price : p.retail_price;
          });
        }
      }

      if (wholesaleIds.length > 0) {
        const { data: wholesaleProducts } = await supabase
          .from("wholesale_products")
          .select("id, sale_price")
          .in("id", wholesaleIds);

        if (wholesaleProducts) {
          wholesaleProducts.forEach((p: Database["public"]["Tables"]["wholesale_products"]["Row"]) => {
            priceMap[p.id] = p.sale_price;
          });
        }
      }

      // Generate order number
      const { data: orderNumber, error: orderNumError } = await supabase.rpc("generate_order_number");
      if (orderNumError) throw orderNumError;

      // Recalculate totals with fresh prices
      let freshTotal = 0;
      const freshItems = items.map(item => {
        const freshPrice = priceMap[item.id] ?? item.price;
        freshTotal += freshPrice * item.quantity;
        return { ...item, price: freshPrice };
      });

      const freshWalletDiscount = useWallet ? Math.min(walletBalance, freshTotal) : 0;
      const freshFinal = freshTotal - freshWalletDiscount;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          order_number: orderNumber,
          customer_id: user?.id || null,
          customer_name: customerDetails.name,
          customer_phone: customerDetails.phone,
          customer_address: customerDetails.address,
          notes: customerDetails.notes || null,
          total_items: totalItems,
          total_amount: freshTotal,
          discount_amount: freshWalletDiscount,
          final_amount: freshFinal,
          user_type: (profile?.user_type || "retail") as "dealer" | "retail",
          status: "pending" as const
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items - look up wholesale product IDs by product_code
      const wholesaleIdMap: Record<string, string> = {};
      const wholesaleCodes = freshItems.filter(i => i.is_wholesale).map(i => i.product_code);
      if (wholesaleCodes.length > 0) {
        const { data: wpData } = await supabase
          .from("wholesale_products")
          .select("id, product_code")
          .in("product_code", wholesaleCodes);
        if (wpData) {
          wpData.forEach((wp: Database["public"]["Tables"]["wholesale_products"]["Row"]) => { wholesaleIdMap[wp.product_code] = wp.id; });
        }
      }

      const orderItems = freshItems.map(item => ({
        order_id: order.id,
        product_id: item.is_wholesale ? (wholesaleIdMap[item.product_code] || null) : item.id,
        product_code: item.product_code,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Block stock after order items inserted
      await supabase.rpc("block_stock", { p_order_id: order.id });

      // Deduct wallet balance if used
      if (useWallet && freshWalletDiscount > 0 && user) {
        const { error: walletError } = await supabase.rpc("user_wallet_purchase", {
          order_id: order.id,
          purchase_amount: freshWalletDiscount
        });

        if (walletError) {
          console.error("Wallet deduction error:", walletError);
          toast({
            title: "Wallet deduction failed",
            description: walletError.message,
            variant: "destructive"
          });
        } else {
          await refreshProfile();
        }
      }

      toast({
        title: "Order placed successfully!",
        description: `Order #${order.order_number} has been created.`,
      });

      clearCart();
      navigate("/orders");
    } catch (error: unknown) {
      console.error("Order error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Failed to place order",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Your Estimate Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Add products from our catalog to get your order estimate.
            </p>
            <Link to="/products">
              <Button variant="hero" size="lg" className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                Browse Products
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Estimate Cart</h1>
            <p className="text-muted-foreground">{totalItems} items in your estimate</p>
          </div>
        </div>

        {/* Min Order Warning */}
        {!isMinOrderMet && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Minimum order is ₹{minOrderValue.toLocaleString()}. Add ₹{amountNeeded.toLocaleString()} more to proceed.
              </span>
              <Link to="/quick-order">
                <Button variant="outline" size="sm">Add More Items</Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Savings Banner */}
        {totalSavings > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <TrendingDown className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">
                You're saving ₹{totalSavings.toLocaleString()} ({savingsPercentage}% OFF from MRP)
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                MRP Total: ₹{totalMrp.toLocaleString()} → Your Price: ₹{totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <CartItemsList
              items={items}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
            />
          </div>

          {/* Order Summary & Customer Details */}
          <div className="space-y-6">
            <CartCheckout
              customerDetails={customerDetails}
              fieldErrors={fieldErrors}
              onCustomerDetailsChange={handleCustomerDetailsChange}
              isSubmitting={isSubmitting}
              user={user}
              isMinOrderMet={isMinOrderMet}
              onPlaceOrder={placeOrder}
              onSendToWhatsApp={sendToWhatsApp}
            />

            <PaymentSection
              user={user}
              useWallet={useWallet}
              onUseWalletChange={setUseWallet}
              walletBalance={walletBalance}
              walletDiscount={walletDiscount}
            />

            <CartSummary
              totalItems={totalItems}
              totalMrp={totalMrp}
              totalAmount={totalAmount}
              totalSavings={totalSavings}
              savingsPercentage={savingsPercentage}
              walletDiscount={walletDiscount}
              finalAmount={finalAmount}
              minOrderValue={minOrderValue}
              amountNeeded={amountNeeded}
              isMinOrderMet={isMinOrderMet}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
