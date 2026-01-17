import { useEffect, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Package, 
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  orderGrowth: number;
  avgOrderValue: number;
  topCategories: { name: string; count: number }[];
  ordersByStatus: { status: string; count: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  customersByType: { type: string; count: number }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    avgOrderValue: 0,
    topCategories: [],
    ordersByStatus: [],
    revenueByDay: [],
    customersByType: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        let startDate: Date;
        let prevStartDate: Date;
        let prevEndDate: Date;

        if (period === "week") {
          startDate = startOfWeek(now);
          prevStartDate = startOfWeek(subDays(now, 7));
          prevEndDate = endOfWeek(subDays(now, 7));
        } else if (period === "month") {
          startDate = startOfMonth(now);
          prevStartDate = startOfMonth(subDays(now, 30));
          prevEndDate = endOfMonth(subDays(now, 30));
        } else {
          startDate = new Date(2020, 0, 1);
          prevStartDate = new Date(2020, 0, 1);
          prevEndDate = new Date(2020, 0, 1);
        }

        // Fetch all data in parallel
        const [ordersRes, profilesRes, productsRes, categoriesRes, prevOrdersRes] = await Promise.all([
          supabase
            .from("orders")
            .select("id, final_amount, status, created_at, user_type")
            .gte("created_at", startDate.toISOString()),
          supabase.from("profiles").select("id, user_type"),
          supabase.from("products").select("id, category_id"),
          supabase.from("categories").select("id, name"),
          period !== "all" 
            ? supabase
                .from("orders")
                .select("id, final_amount")
                .gte("created_at", prevStartDate.toISOString())
                .lte("created_at", prevEndDate.toISOString())
            : Promise.resolve({ data: [] }),
        ]);

        const orders = ordersRes.data || [];
        const profiles = profilesRes.data || [];
        const products = productsRes.data || [];
        const categories = categoriesRes.data || [];
        const prevOrders = prevOrdersRes.data || [];

        // Calculate metrics
        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.final_amount) || 0), 0);
        const prevRevenue = prevOrders.reduce((sum, o) => sum + (Number(o.final_amount) || 0), 0);
        const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const orderGrowth = prevOrders.length > 0 ? ((orders.length - prevOrders.length) / prevOrders.length) * 100 : 0;
        const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

        // Orders by status
        const statusCounts: Record<string, number> = {};
        orders.forEach((o) => {
          statusCounts[o.status || "pending"] = (statusCounts[o.status || "pending"] || 0) + 1;
        });
        const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count,
        }));

        // Customers by type
        const typeCounts: Record<string, number> = {};
        profiles.forEach((p) => {
          typeCounts[p.user_type] = (typeCounts[p.user_type] || 0) + 1;
        });
        const customersByType = Object.entries(typeCounts).map(([type, count]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          count,
        }));

        // Revenue by day (last 7 days)
        const revenueByDay: { date: string; revenue: number; orders: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const day = subDays(now, i);
          const dayStr = format(day, "yyyy-MM-dd");
          const dayOrders = orders.filter(
            (o) => format(new Date(o.created_at), "yyyy-MM-dd") === dayStr
          );
          revenueByDay.push({
            date: format(day, "EEE"),
            revenue: dayOrders.reduce((sum, o) => sum + (Number(o.final_amount) || 0), 0),
            orders: dayOrders.length,
          });
        }

        // Top categories
        const categoryCounts: Record<string, number> = {};
        products.forEach((p) => {
          if (p.category_id) {
            const category = categories.find((c) => c.id === p.category_id);
            if (category) {
              categoryCounts[category.name] = (categoryCounts[category.name] || 0) + 1;
            }
          }
        });
        const topCategories = Object.entries(categoryCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setData({
          totalRevenue,
          totalOrders: orders.length,
          totalCustomers: profiles.length,
          totalProducts: products.length,
          revenueGrowth,
          orderGrowth,
          avgOrderValue,
          topCategories,
          ordersByStatus,
          revenueByDay,
          customersByType,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    changeLabel,
    color,
  }: {
    title: string;
    value: string;
    icon: any;
    change?: number;
    changeLabel?: string;
    color: string;
  }) => (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{isLoading ? "..." : value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {change >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
            <span className={change >= 0 ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
              {Math.abs(change).toFixed(1)}%
            </span>
            {changeLabel && <span className="text-muted-foreground text-sm">{changeLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Track your business performance</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList>
            <TabsTrigger value="week" className="gap-2">
              <Calendar className="h-4 w-4" />
              This Week
            </TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`₹${data.totalRevenue.toLocaleString()}`}
          icon={Wallet}
          change={period !== "all" ? data.revenueGrowth : undefined}
          changeLabel="vs last period"
          color="bg-green-500/10 text-green-600"
        />
        <StatCard
          title="Total Orders"
          value={data.totalOrders.toString()}
          icon={ShoppingCart}
          change={period !== "all" ? data.orderGrowth : undefined}
          changeLabel="vs last period"
          color="bg-primary/10 text-primary"
        />
        <StatCard
          title="Avg Order Value"
          value={`₹${data.avgOrderValue.toFixed(0)}`}
          icon={TrendingUp}
          color="bg-accent/10 text-accent-foreground"
        />
        <StatCard
          title="Total Customers"
          value={data.totalCustomers.toString()}
          icon={Users}
          color="bg-dealer/10 text-dealer"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
            <CardDescription>Daily orders for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Status Distribution */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                  >
                    {data.ordersByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {data.ordersByStatus.map((item, index) => (
                <Badge
                  key={item.status}
                  variant="outline"
                  style={{ borderColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}
                >
                  {item.status}: {item.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Types */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Customer Types</CardTitle>
            <CardDescription>Distribution by user type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.customersByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="type"
                  >
                    {data.customersByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {data.customersByType.map((item, index) => (
                <Badge
                  key={item.type}
                  variant="outline"
                  style={{ borderColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}
                >
                  {item.type}: {item.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Products by category</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No category data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.topCategories.map((cat, index) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{cat.name}</span>
                        <span className="text-sm text-muted-foreground">{cat.count} products</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(cat.count / (data.topCategories[0]?.count || 1)) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
