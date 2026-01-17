import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Users, ShoppingCart, TrendingUp, Wallet, Gift, Plus, Eye, Settings, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalReferrals: number;
  totalWalletBalance: number;
  pendingReferrals: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  final_amount: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalReferrals: 0,
    totalWalletBalance: 0,
    pendingReferrals: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, profiles, orders, referrals] = await Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id, wallet_balance"),
          supabase.from("orders").select("id, status, final_amount, order_number, customer_name, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("referrals").select("id, is_claimed"),
        ]);

        const pendingOrders = orders.data?.filter(o => o.status === "pending").length || 0;
        const totalRevenue = orders.data?.reduce((sum, o) => sum + (Number(o.final_amount) || 0), 0) || 0;
        const totalWalletBalance = profiles.data?.reduce((sum, p) => sum + (Number(p.wallet_balance) || 0), 0) || 0;
        const pendingReferrals = referrals.data?.filter(r => !r.is_claimed).length || 0;

        setStats({
          totalProducts: products.count || 0,
          totalCustomers: profiles.data?.length || 0,
          totalOrders: orders.data?.length || 0,
          pendingOrders,
          totalRevenue,
          totalReferrals: referrals.data?.length || 0,
          totalWalletBalance,
          pendingReferrals,
        });

        setRecentOrders(orders.data || []);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-primary/10 text-primary",
      link: "/admin/products",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "bg-dealer/10 text-dealer",
      link: "/admin/customers",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "bg-accent/10 text-accent-foreground",
      link: "/admin/orders",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: TrendingUp,
      color: "bg-yellow-500/10 text-yellow-600",
      link: "/admin/orders",
      badge: stats.pendingOrders > 0 ? "Action Required" : undefined,
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: Wallet,
      color: "bg-green-500/10 text-green-600",
      link: "/admin/orders",
    },
    {
      title: "Referrals",
      value: stats.totalReferrals,
      icon: Gift,
      color: "bg-primary/10 text-primary",
      link: "/admin/referrals",
      badge: stats.pendingReferrals > 0 ? `${stats.pendingReferrals} Pending` : undefined,
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to GKP Crackers Admin Panel</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/products">
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
          <Link to="/admin/announcements">
            <Button variant="outline" size="sm" className="gap-2">
              <Bell className="h-4 w-4" />
              Announcements
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {isLoading ? "..." : stat.value}
                  </div>
                  {stat.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {stat.badge}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest customer orders</CardDescription>
            </div>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm" className="gap-1">
                <Eye className="h-4 w-4" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.customer_name} • {format(new Date(order.created_at), "dd MMM")}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      ₹{Number(order.final_amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <Link to="/admin/products">
              <button className="w-full p-4 rounded-xl border border-border hover:bg-muted transition-colors text-left group">
                <Package className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium">Add Product</p>
                <p className="text-sm text-muted-foreground">Add new items to inventory</p>
              </button>
            </Link>
            <Link to="/admin/orders">
              <button className="w-full p-4 rounded-xl border border-border hover:bg-muted transition-colors text-left group">
                <ShoppingCart className="h-6 w-6 text-accent-foreground mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium">View Orders</p>
                <p className="text-sm text-muted-foreground">Manage pending orders</p>
              </button>
            </Link>
            <Link to="/admin/wallet">
              <button className="w-full p-4 rounded-xl border border-border hover:bg-muted transition-colors text-left group">
                <Wallet className="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium">Wallet Management</p>
                <p className="text-sm text-muted-foreground">Credit/Debit user wallets</p>
              </button>
            </Link>
            <Link to="/admin/referrals">
              <button className="w-full p-4 rounded-xl border border-border hover:bg-muted transition-colors text-left group">
                <Gift className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium">Referrals</p>
                <p className="text-sm text-muted-foreground">Manage referral bonuses</p>
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
