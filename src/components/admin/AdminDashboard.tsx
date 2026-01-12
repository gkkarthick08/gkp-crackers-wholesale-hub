import { useEffect, useState } from "react";
import { Package, Users, ShoppingCart, TrendingUp, Wallet, Gift } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalReferrals: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalReferrals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, profiles, orders, referrals] = await Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("id, status, final_amount"),
          supabase.from("referrals").select("id", { count: "exact", head: true }),
        ]);

        const pendingOrders = orders.data?.filter(o => o.status === "pending").length || 0;
        const totalRevenue = orders.data?.reduce((sum, o) => sum + (Number(o.final_amount) || 0), 0) || 0;

        setStats({
          totalProducts: products.count || 0,
          totalCustomers: profiles.count || 0,
          totalOrders: orders.data?.length || 0,
          pendingOrders,
          totalRevenue,
          totalReferrals: referrals.count || 0,
        });
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
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "bg-dealer/10 text-dealer",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "bg-accent/10 text-accent",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: TrendingUp,
      color: "bg-secondary/20 text-secondary-foreground",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: Wallet,
      color: "bg-success/10 text-success",
    },
    {
      title: "Referrals",
      value: stats.totalReferrals,
      icon: Gift,
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to GKP Crackers Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? "..." : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 rounded-xl border border-border hover:bg-muted transition-colors text-left">
            <Package className="h-6 w-6 text-primary mb-2" />
            <p className="font-medium">Add Product</p>
            <p className="text-sm text-muted-foreground">Add new items to inventory</p>
          </button>
          <button className="p-4 rounded-xl border border-border hover:bg-muted transition-colors text-left">
            <ShoppingCart className="h-6 w-6 text-accent mb-2" />
            <p className="font-medium">View Orders</p>
            <p className="text-sm text-muted-foreground">Manage pending orders</p>
          </button>
          <button className="p-4 rounded-xl border border-border hover:bg-muted transition-colors text-left">
            <Users className="h-6 w-6 text-dealer mb-2" />
            <p className="font-medium">Customers</p>
            <p className="text-sm text-muted-foreground">View customer list</p>
          </button>
          <button className="p-4 rounded-xl border border-border hover:bg-muted transition-colors text-left">
            <TrendingUp className="h-6 w-6 text-success mb-2" />
            <p className="font-medium">Reports</p>
            <p className="text-sm text-muted-foreground">View business analytics</p>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
