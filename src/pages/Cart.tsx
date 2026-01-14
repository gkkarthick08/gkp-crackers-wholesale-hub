import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Send, MapPin, User, Phone, Wallet } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, totalAmount, totalItems } = useCart();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [customerDetails, setCustomerDetails] = useState({
    name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    notes: ""
  });
  const [useWallet, setUseWallet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const walletBalance = profile?.wallet_balance || 0;
  const walletDiscount = useWallet ? Math.min(walletBalance, totalAmount) : 0;
  const finalAmount = totalAmount - walletDiscount;

  const sendToWhatsApp = () => {
    if (!customerDetails.name || !customerDetails.phone || !customerDetails.address) {
      toast({
        title: "Please fill all details",
        description: "Name, phone and address are required.",
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
      message += `${index + 1}. ${item.name}\n`;
      message += `   Qty: ${item.quantity} × ₹${item.price} = ₹${(item.quantity * item.price).toLocaleString()}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━\n`;
    message += `📊 *TOTAL ITEMS:* ${totalItems}\n`;
    message += `💰 *SUBTOTAL:* ₹${totalAmount.toLocaleString()}\n`;
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
    if (!customerDetails.name || !customerDetails.phone || !customerDetails.address) {
      toast({
        title: "Please fill all details",
        description: "Name, phone and address are required.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get price based on user type
      const price = profile?.user_type === "dealer" ? "wholesale" : "retail";

      // Create order
      const orderData = {
        customer_id: user?.id || null,
        customer_name: customerDetails.name,
        customer_phone: customerDetails.phone,
        customer_address: customerDetails.address,
        notes: customerDetails.notes || null,
        total_items: totalItems,
        total_amount: totalAmount,
        discount_amount: walletDiscount,
        final_amount: finalAmount,
        user_type: (profile?.user_type || "retail") as "dealer" | "retail",
        status: "pending" as const
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
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

      // Deduct wallet balance if used
      if (useWallet && walletDiscount > 0 && user) {
        const { error: walletError } = await supabase.rpc("admin_wallet_transaction", {
          target_user_id: user.id,
          transaction_amount: -walletDiscount,
          trans_type: "purchase",
          trans_description: `Used for order ${order.order_number}`
        });

        if (walletError) {
          console.error("Wallet deduction error:", walletError);
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
            <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Add products from our quick order page to get started.
            </p>
            <Link to="/quick-order">
              <Button variant="hero" size="lg" className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                Start Shopping
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
          <Link to="/quick-order">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Your Cart</h1>
            <p className="text-muted-foreground">{totalItems} items in your cart</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <Card key={item.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">Code: {item.product_code}</p>
                      <p className="font-bold text-primary">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right w-24">
                      <p className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+91 XXXXXXXXXX"
                      className="pl-10"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      placeholder="Enter complete address"
                      className="pl-10 min-h-[80px]"
                      value={customerDetails.address}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions..."
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

            {/* Order Summary */}
            <Card className="shadow-card border-primary/20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Items</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
                {walletDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Wallet Discount</span>
                    <span>-₹{walletDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-gradient-hero">₹{finalAmount.toLocaleString()}</span>
                  </div>
                </div>

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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Placing Order..." : "Place Order"}
                    </Button>
                  ) : (
                    <Link to="/auth" className="block">
                      <Button variant="hero" size="lg" className="w-full">
                        Login to Place Order
                      </Button>
                    </Link>
                  )}
                  
                  <Button 
                    variant="whatsapp" 
                    size="lg" 
                    className="w-full gap-2"
                    onClick={sendToWhatsApp}
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
