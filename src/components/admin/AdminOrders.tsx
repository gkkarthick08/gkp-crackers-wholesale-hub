import { useEffect, useState } from "react";
import { Search, Eye, Loader2, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  user_type: "dealer" | "retail";
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  total_items: number;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  created_at: string;
  notes: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
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

const PAGE_SIZE = 50;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: data || [] } : o));
    } catch (error) {
      console.error("Error fetching order items:", error);
    }
  };

  const toggleExpand = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      const order = orders.find(o => o.id === orderId);
      if (!order?.items) fetchOrderItems(orderId);
    }
  };

  const updateStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Restore stock on cancellation
      if (newStatus === "cancelled") {
        await supabase.rpc("restore_stock", { p_order_id: orderId });
      }

      toast({ title: "Order status updated" });
      fetchOrders();
    } catch {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const orderDate = new Date(order.created_at);
    const matchesFrom = !dateFrom || orderDate >= new Date(dateFrom);
    const matchesTo = !dateTo || orderDate <= new Date(`${dateTo}T23:59:59`);
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      {/* Filters */}
      <Card className="shadow-card mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order #, name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <>
                      <TableRow key={order.id} className={expandedOrder === order.id ? "border-b-0" : ""}>
                        <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{order.customer_phone}</TableCell>
                        <TableCell>
                          <Badge variant={order.user_type === "dealer" ? "secondary" : "outline"}>
                            {order.user_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{order.total_items}</TableCell>
                        <TableCell className="text-right font-bold">₹{order.final_amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Select value={order.status} onValueChange={(v: Order["status"]) => updateStatus(order.id, v)}>
                            <SelectTrigger className={`w-[130px] ${statusColors[order.status]}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => toggleExpand(order.id)}>
                            {expandedOrder === order.id ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedOrder === order.id && (
                        <TableRow key={`${order.id}-detail`}>
                          <TableCell colSpan={9} className="bg-muted/30 p-4">
                            <div className="space-y-4">
                              {/* Customer details */}
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground font-medium">Delivery Address</p>
                                  <p>{order.customer_address}</p>
                                </div>
                                {order.notes && (
                                  <div>
                                    <p className="text-muted-foreground font-medium">Notes</p>
                                    <p>{order.notes}</p>
                                  </div>
                                )}
                              </div>

                              {/* Order items */}
                              <div className="border rounded-lg overflow-hidden">
                                <div className="bg-muted/50 px-4 py-2 font-medium text-sm">Order Items</div>
                                {order.items ? (
                                  <div className="divide-y">
                                    {order.items.map((item) => (
                                      <div key={item.id} className="px-4 py-3 flex items-center justify-between text-sm">
                                        <div>
                                          <p className="font-medium">{item.product_name}</p>
                                          <p className="text-muted-foreground text-xs">{item.product_code} • Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-semibold">₹{item.total_price?.toLocaleString()}</p>
                                          <p className="text-xs text-muted-foreground">₹{item.unit_price} each</p>
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

                              {/* Totals */}
                              <div className="flex flex-wrap gap-4 text-sm justify-end">
                                <span>Subtotal: ₹{order.total_amount?.toLocaleString()}</span>
                                {(order.discount_amount || 0) > 0 && (
                                  <span className="text-green-600">Wallet: -₹{order.discount_amount?.toLocaleString()}</span>
                                )}
                                <span className="font-bold">Final: ₹{order.final_amount?.toLocaleString()}</span>
                              </div>

                              {/* Cancellation */}
                              {order.status === "cancelled" && order.cancellation_reason && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                                  <p className="font-medium text-destructive">Cancellation Reason</p>
                                  <p className="text-destructive/80">{order.cancellation_reason}</p>
                                  {order.cancelled_at && (
                                    <p className="text-xs text-destructive/70 mt-1">
                                      Cancelled on {new Date(order.cancelled_at).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
