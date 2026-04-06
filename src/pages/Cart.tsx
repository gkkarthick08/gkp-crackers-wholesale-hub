import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Send, MapPin, User, Phone, Wallet, AlertTriangle, Tag, TrendingDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { validateCustomerDetails } from "@/lib/validations";

interface SiteSettings {
  minOrderValue: number;
  minOrderValueDealer: number;
}

export default function Cart() {
  usePageMeta({ title: "Cart — GKP Crackers", description: "Review your cart and place your order." });
  const { items, updateQuantity, removeItem, clearCart, totalAmount, totalItems, totalMrp, totalSavings } = useCart();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [customerDetails, setCustomerDetails] = useState({
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
        const { data, error } = await supabase
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
      } catch (error) {
        console.error("Error fetching settings:", error);
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

  const sendToWhatsApp = () => {
    // Validate customer details using schema
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
    // Validate customer details using schema
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

      let priceMap: Record<string, number> = {};

      if (retailIds.length > 0) {
        const { data: retailProducts } = await supabase
          .from("products")
          .select("id, retail_price, wholesale_price")
          .in("id", retailIds);

        if (retailProducts) {
          const isDealer = profile?.user_type === "dealer" && profile?.is_verified;
          retailProducts.forEach(p => {
            priceMap[p.id] = isDealer ? p.wholesale_price : p.retail_price;
          });
        }
      }

      if (wholesaleIds.length > 0) {
        const { data: wholesaleProducts } = await (supabase as any)
          .from("wholesale_products")
          .select("id, sale_price")
          .in("id", wholesaleIds);

        if (wholesaleProducts) {
          wholesaleProducts.forEach((p: any) => {
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
      let wholesaleIdMap: Record<string, string> = {};
      const wholesaleCodes = freshItems.filter(i => i.is_wholesale).map(i => i.product_code);
      if (wholesaleCodes.length > 0) {
        const { data: wpData } = await (supabase as any)
          .from("wholesale_products")
          .select("id, product_code")
          .in("product_code", wholesaleCodes);
        if (wpData) {
          wpData.forEach((wp: any) => { wholesaleIdMap[wp.product_code] = wp.id; });
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

      // Bug 6: Block stock after order items inserted
      await supabase.rpc("block_stock", { p_order_id: order.id });

      // Deduct wallet balance if used (using secure user_wallet_purchase function)
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
    } catch (error: any) {
      console.error("Order error:", error);
      toast({
        title: "Failed to place order",
        description: error.message,
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
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => {
              const itemSaving = (item.mrp - item.price) * item.quantity;
              const discountPercent = Math.round(((item.mrp - item.price) / item.mrp) * 100);
              const step = item.is_wholesale && item.case_qty ? item.case_qty : 1;
              const cases = item.is_wholesale && item.case_qty ? Math.round(item.quantity / item.case_qty) : null;
              
              return (
                <Card key={item.id} className="shadow-card">
                  <CardContent className="p-3 sm:p-4">
                    {/* Mobile: stacked layout */}
                    <div className="flex gap-3 sm:gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                        )}
                        {discountPercent > 0 && (
                          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1 rounded">
                            {discountPercent}%
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                            <p className="text-xs text-muted-foreground">Code: {item.product_code}</p>
                            {item.is_wholesale && item.case_qty && (
                              <p className="text-xs text-muted-foreground">
                                {item.case_qty} pcs/case • ₹{item.case_price?.toLocaleString()}/case
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 h-7 w-7 flex-shrink-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground line-through">₹{item.mrp}/pc</span>
                          <span className="font-bold text-primary text-sm">₹{item.price}/pc</span>
                          {discountPercent > 0 && (
                            <span className="text-[10px] sm:text-xs text-accent font-medium">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - step))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="w-12 sm:w-14 text-center">
                              <span className="font-semibold text-sm">{item.quantity}</span>
                              {cases !== null && <p className="text-[9px] text-muted-foreground">{cases} case(s)</p>}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + step)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm sm:text-base">₹{(item.price * item.quantity).toLocaleString()}</p>
                            {itemSaving > 0 && (
                              <p className="text-[10px] sm:text-xs text-accent">Save ₹{itemSaving.toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Summary & Customer Details */}
          <div className="space-y-6">
            {/* Customer Details */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    maxLength={100}
                    value={customerDetails.name}
                    onChange={(e) => {
                      setCustomerDetails(prev => ({ ...prev, name: e.target.value }));
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: "" }));
                    }}
                    className={fieldErrors.name ? "border-destructive" : ""}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-destructive">{fieldErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+91 XXXXXXXXXX"
                      className={`pl-10 ${fieldErrors.phone ? "border-destructive" : ""}`}
                      maxLength={15}
                      value={customerDetails.phone}
                      onChange={(e) => {
                        setCustomerDetails(prev => ({ ...prev, phone: e.target.value }));
                        if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: "" }));
                      }}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-sm text-destructive">{fieldErrors.phone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      placeholder="Enter complete address"
                      className={`pl-10 min-h-[80px] ${fieldErrors.address ? "border-destructive" : ""}`}
                      maxLength={500}
                      value={customerDetails.address}
                      onChange={(e) => {
                        setCustomerDetails(prev => ({ ...prev, address: e.target.value }));
                        if (fieldErrors.address) setFieldErrors(prev => ({ ...prev, address: "" }));
                      }}
                    />
                  </div>
                  {fieldErrors.address && (
                    <p className="text-sm text-destructive">{fieldErrors.address}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions..."
                    maxLength={1000}
                    value={customerDetails.notes}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Wallet Section */}
            {user && walletBalance > 0 && (
              <Card className="shadow-card border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Use Wallet Balance</p>
                        <p className="text-sm text-muted-foreground">
                          Available: ₹{walletBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={useWallet}
                      onCheckedChange={setUseWallet}
                    />
                  </div>
                  {useWallet && walletDiscount > 0 && (
                    <p className="text-sm text-green-600 mt-3">
                      You'll save ₹{walletDiscount.toFixed(2)} on this order!
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Estimate Summary */}
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

                <div className="space-y-3">
                  {user ? (
                    <Button 
                      variant="hero" 
                      size="lg" 
                      className="w-full"
                      onClick={placeOrder}
                      disabled={isSubmitting || !isMinOrderMet}
                    >
                      {isSubmitting ? "Submitting Estimate..." : "Submit Order Estimate"}
                    </Button>
                  ) : (
                    <Link to="/auth" className="block">
                      <Button variant="hero" size="lg" className="w-full">
                        Login to Submit Estimate
                      </Button>
                    </Link>
                  )}
                  
                  <Button 
                    variant="whatsapp" 
                    size="lg" 
                    className="w-full gap-2"
                    onClick={sendToWhatsApp}
                    disabled={!isMinOrderMet}
                  >
                    <Send className="h-5 w-5" />
                    Send via WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}