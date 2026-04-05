import { useState, useEffect } from "react";
import {
  Search, Eye, Edit2, Printer, Receipt, Filter,
  ChevronDown, ChevronUp, Plus, Minus, X, Check, Save,
  IndianRupee, AlertCircle, CheckCircle2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePOSSettings } from "@/components/admin/AdminPOSSettings";

interface PosOrderItem {
  id: string;
  product_id: string | null;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  mrp: number;
  is_wholesale: boolean;
}

interface PosOrderRow {
  id: string;
  bill_number: string;
  created_at: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  billing_mode: string;
  payment_method: string;
  total_amount: number;
  mrp_total: number;
  savings: number;
  packing_charges: number;
  delivery_charges: number;
  payment_status: string;
  amount_paid: number;
  balance_due: number;
  notes: string | null;
  pos_order_items?: PosOrderItem[];
}

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  pending: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  paid: CheckCircle2,
  partial: Clock,
  pending: AlertCircle,
};

export default function AdminPOSHistory() {
  const [orders, setOrders] = useState<PosOrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<PosOrderRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<PosOrderItem[]>([]);
  const [editPaymentStatus, setEditPaymentStatus] = useState("paid");
  const [editAmountPaid, setEditAmountPaid] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { settings: posSettings } = usePOSSettings();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pos_orders")
        .select("*, pos_order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders((data as any[]) || []);
    } catch (err: any) {
      toast({ title: "Error loading bills", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || o.bill_number?.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.payment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openOrder = (order: PosOrderRow) => {
    setSelectedOrder(order);
    setEditItems(order.pos_order_items?.map(i => ({ ...i })) || []);
    setEditPaymentStatus(order.payment_status);
    setEditAmountPaid(order.amount_paid);
    setIsEditing(false);
  };

  const updateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setEditItems(prev => prev.filter((_, i) => i !== index));
      return;
    }
    setEditItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: newQty, total_price: item.unit_price * newQty } : item
    ));
  };

  const removeItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const saveChanges = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      const saleTotal = editItems.reduce((s, i) => s + i.total_price, 0);
      const mrpTotal = editItems.reduce((s, i) => s + i.mrp * i.quantity, 0);
      const newTotal = Math.round(saleTotal + (selectedOrder.packing_charges || 0) + (selectedOrder.delivery_charges || 0));
      const balanceDue = Math.max(0, newTotal - editAmountPaid);
      const paymentStatus = editAmountPaid >= newTotal ? "paid" : editAmountPaid > 0 ? "partial" : "pending";

      // Update order
      const { error: orderErr } = await supabase.from("pos_orders").update({
        total_amount: newTotal,
        mrp_total: mrpTotal,
        savings: mrpTotal - saleTotal,
        payment_status: paymentStatus,
        amount_paid: editAmountPaid,
        balance_due: balanceDue,
      }).eq("id", selectedOrder.id);
      if (orderErr) throw orderErr;

      // Delete old items and insert new
      await supabase.from("pos_order_items").delete().eq("pos_order_id", selectedOrder.id);
      if (editItems.length > 0) {
        const { error: itemsErr } = await supabase.from("pos_order_items").insert(
          editItems.map(i => ({
            pos_order_id: selectedOrder.id,
            product_id: i.product_id,
            product_code: i.product_code,
            product_name: i.product_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            total_price: i.total_price,
            mrp: i.mrp,
            is_wholesale: i.is_wholesale,
          }))
        );
        if (itemsErr) throw itemsErr;
      }

      toast({ title: "Bill updated successfully" });
      setIsEditing(false);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const printBill = (order: PosOrderRow) => {
    openOrder(order);
    setTimeout(() => window.print(), 500);
  };

  const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0);
  const totalPending = orders.filter(o => o.payment_status !== "paid").reduce((s, o) => s + o.balance_due, 0);
  const totalBills = orders.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">POS Bill History</h1>
          <p className="text-sm text-muted-foreground">View, edit, and reprint past POS bills</p>
        </div>
        <Button variant="outline" onClick={fetchOrders} className="gap-2">
          <Receipt className="h-4 w-4" />Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Bills</p>
              <p className="text-xl font-bold">{totalBills}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Dues</p>
              <p className="text-xl font-bold text-red-600">₹{totalPending.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by bill number, customer name or phone..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No POS bills found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((order) => {
            const StatusIcon = statusIcons[order.payment_status] || CheckCircle2;
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{order.bill_number}</span>
                        <Badge className={`text-[10px] ${statusColors[order.payment_status] || ""}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.payment_status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {order.billing_mode}
                        </Badge>
                      </div>
                      <p className="text-sm">{order.customer_name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                        {order.customer_phone && <span>📞 {order.customer_phone}</span>}
                        <span>{order.payment_method.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className="font-bold text-lg">₹{order.total_amount.toLocaleString()}</p>
                        {order.balance_due > 0 && (
                          <p className="text-xs text-red-600 font-medium">Due: ₹{order.balance_due.toLocaleString()}</p>
                        )}
                      </div>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { openOrder(order); setIsEditing(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => printBill(order)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setIsEditing(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Bill {selectedOrder.bill_number}</span>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" />Edit
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditItems(selectedOrder.pos_order_items?.map(i => ({ ...i })) || []); }}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveChanges} disabled={isSaving}>
                          <Save className="h-3.5 w-3.5 mr-1" />{isSaving ? "Saving..." : "Save"}
                        </Button>
                      </>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-medium">{selectedOrder.customer_phone || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Payment</p>
                  <p className="font-medium">{selectedOrder.payment_method.toUpperCase()} | {selectedOrder.billing_mode.toUpperCase()}</p>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h3 className="font-bold text-sm mb-2">Items</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-1.5">#</th>
                      <th className="text-left py-1.5">Item</th>
                      <th className="text-center py-1.5">Qty</th>
                      <th className="text-right py-1.5">Rate</th>
                      <th className="text-right py-1.5">Total</th>
                      {isEditing && <th className="w-8"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(isEditing ? editItems : (selectedOrder.pos_order_items || [])).map((item, i) => (
                      <tr key={item.id || i} className="border-b border-border/30">
                        <td className="py-1.5">{i + 1}</td>
                        <td className="py-1.5">
                          <span>{item.product_name}</span>
                          <span className="text-muted-foreground ml-1">({item.product_code})</span>
                        </td>
                        <td className="text-center py-1.5">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-0.5">
                              <button onClick={() => updateItemQty(i, item.quantity - 1)}
                                className="h-5 w-5 rounded border flex items-center justify-center hover:bg-muted">
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                              <Input value={item.quantity}
                                onChange={(e) => updateItemQty(i, parseInt(e.target.value) || 0)}
                                className="w-12 h-6 text-center text-xs px-1" />
                              <button onClick={() => updateItemQty(i, item.quantity + 1)}
                                className="h-5 w-5 rounded border flex items-center justify-center hover:bg-muted">
                                <Plus className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ) : item.quantity}
                        </td>
                        <td className="text-right py-1.5">₹{item.unit_price}</td>
                        <td className="text-right py-1.5 font-medium">₹{item.total_price.toLocaleString()}</td>
                        {isEditing && (
                          <td className="py-1.5">
                            <button onClick={() => removeItem(i)} className="text-destructive hover:bg-destructive/10 rounded p-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator />

              {/* Payment Tracking */}
              {isEditing ? (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm">Payment Tracking</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Payment Status</label>
                      <Select value={editPaymentStatus} onValueChange={setEditPaymentStatus}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Amount Paid (₹)</label>
                      <Input type="number" min={0} value={editAmountPaid || ""}
                        onChange={(e) => setEditAmountPaid(Number(e.target.value) || 0)}
                        className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  {selectedOrder.mrp_total > 0 && selectedOrder.savings > 0 && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>MRP Total</span>
                        <span className="line-through">₹{selectedOrder.mrp_total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>You Save</span>
                        <span>₹{selectedOrder.savings.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  {selectedOrder.packing_charges > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Packing</span><span>+₹{selectedOrder.packing_charges}</span>
                    </div>
                  )}
                  {selectedOrder.delivery_charges > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span><span>+₹{selectedOrder.delivery_charges}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-1 border-t">
                    <span>Total</span>
                    <span className="text-primary">₹{selectedOrder.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid</span>
                    <span className="font-medium">₹{selectedOrder.amount_paid.toLocaleString()}</span>
                  </div>
                  {selectedOrder.balance_due > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Balance Due</span>
                      <span>₹{selectedOrder.balance_due.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
