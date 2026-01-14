import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Package, ChevronDown, ChevronUp, Loader2, ShoppingBag } from "lucide-react";
import { format } from "date-fns";

interface OrderItem {
  id: string;
  product_name: string;
  product_code: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  final_amount: number;
  discount_amount: number;
  total_items: number;
  created_at: string;
  customer_address: string;
  notes: string | null;
  items?: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Orders() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, items: data || [] } : order
        )
      );
    } catch (error) {
      console.error("Error fetching order items:", error);
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      const order = orders.find((o) => o.id === orderId);
      if (!order?.items) {
        fetchOrderItems(orderId);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-4">
                You haven't placed any orders yet. Start shopping!
              </p>
              <Button onClick={() => navigate("/quick-order")} variant="hero">
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-card">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{order.order_number}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{order.final_amount?.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{order.total_items} items</p>
                      </div>
                      <Badge className={statusColors[order.status || "pending"]}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </Badge>
                      {expandedOrder === order.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedOrder === order.id && (
                  <CardContent className="border-t pt-4">
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Delivery Address</p>
                          <p className="font-medium">{order.customer_address}</p>
                        </div>
                        {order.notes && (
                          <div>
                            <p className="text-muted-foreground">Notes</p>
                            <p className="font-medium">{order.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 px-4 py-2 font-medium">Order Items</div>
                        {order.items ? (
                          <div className="divide-y">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="px-4 py-3 flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-medium">{item.product_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.product_code} • Qty: {item.quantity}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">₹{item.total_price}</p>
                                  <p className="text-sm text-muted-foreground">
                                    ₹{item.unit_price} each
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-4 text-sm">
                        <div>Subtotal: ₹{order.total_amount?.toLocaleString()}</div>
                        {order.discount_amount > 0 && (
                          <div className="text-green-600">
                            Discount: -₹{order.discount_amount?.toLocaleString()}
                          </div>
                        )}
                        <div className="font-bold">
                          Total: ₹{order.final_amount?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
