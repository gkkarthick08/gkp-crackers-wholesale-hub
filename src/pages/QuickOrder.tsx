import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Minus, ShoppingCart, Filter } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  mrp: number;
  retail_price: number;
  wholesale_price: number;
  stock: number;
  category: { name: string } | null;
  brand: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

export default function QuickOrder() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  const isDealer = profile?.user_type === "dealer";

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          supabase
            .from("products")
            .select(`
              *,
              category:categories(name),
              brand:brands(name)
            `)
            .eq("is_visible", true)
            .order("display_order"),
          supabase
            .from("categories")
            .select("id, name")
            .eq("is_active", true)
            .order("display_order")
        ]);

        if (productsRes.data) {
          setProducts(productsRes.data as Product[]);
        }
        if (categoriesRes.data) {
          setCategories(categoriesRes.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.product_code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category?.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const newValue = Math.max(0, current + delta);
      return { ...prev, [productId]: newValue };
    });
  };

  const setQuantity = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setQuantities(prev => ({ ...prev, [productId]: Math.max(0, numValue) }));
  };

  const getPrice = (product: Product) => {
    return isDealer ? product.wholesale_price : product.retail_price;
  };

  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  const totalAmount = products.reduce((sum, product) => {
    const qty = quantities[product.id] || 0;
    return sum + (qty * getPrice(product));
  }, 0);

  const addToEstimate = () => {
    const itemsToAdd = products.filter(p => quantities[p.id] > 0);
    if (itemsToAdd.length === 0) {
      toast({
        title: "No items selected",
        description: "Please add quantities to products you want to order.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Added to Estimate Cart!",
      description: `${totalItems} items worth ₹${totalAmount.toLocaleString()} added.`,
    });
  };

  // Emoji map for products
  const getProductEmoji = (categoryName: string | undefined) => {
    const emojiMap: Record<string, string> = {
      "Ground Chakkar": "🌀",
      "Flower Pots": "🎇",
      "Sky Shots": "🎆",
      "Rockets": "🚀",
      "Sparklers": "✨",
      "Bombs": "💥",
      "Fountains": "⛲",
      "Novelty": "🎭",
      "Gift Boxes": "🎁"
    };
    return emojiMap[categoryName || ""] || "🧨";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Quick Order <span className="text-gradient-hero">Table</span>
          </h1>
          <p className="text-muted-foreground">
            Add products quickly using our Excel-style order table. 
            {isDealer ? (
              <Badge variant="secondary" className="ml-2 gradient-dealer text-white">Wholesale Prices</Badge>
            ) : (
              <Badge variant="secondary" className="ml-2">Retail Prices</Badge>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or product ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="quick-order-table">
              <thead>
                <tr>
                  <th className="w-16">S.No</th>
                  <th className="w-20">Image</th>
                  <th>Product Name</th>
                  <th className="w-24">Brand</th>
                  <th className="w-28 text-right">MRP</th>
                  <th className="w-28 text-right">
                    {isDealer ? "Wholesale" : "Sale Price"}
                  </th>
                  <th className="w-36 text-center">Quantity</th>
                  <th className="w-28 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => {
                    const qty = quantities[product.id] || 0;
                    const amount = qty * getPrice(product);
                    return (
                      <tr key={product.id} className={qty > 0 ? "bg-primary/5" : ""}>
                        <td className="text-center text-muted-foreground">{index + 1}</td>
                        <td className="text-center text-3xl">
                          {getProductEmoji(product.category?.name)}
                        </td>
                        <td>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {product.product_code}</p>
                          </div>
                        </td>
                        <td>
                          <Badge variant="outline">{product.brand?.name || "N/A"}</Badge>
                        </td>
                        <td className="text-right text-muted-foreground line-through">
                          ₹{product.mrp}
                        </td>
                        <td className="text-right font-semibold text-primary">
                          ₹{getPrice(product)}
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(product.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) => setQuantity(product.id, e.target.value)}
                              className="w-16 h-8 text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(product.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="text-right font-bold">
                          {amount > 0 ? `₹${amount.toLocaleString()}` : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-md rounded-t-2xl shadow-lg border border-border p-4 -mx-4">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold">{totalItems}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold text-gradient-hero">₹{totalAmount.toLocaleString()}</p>
              </div>
            </div>
            <Button 
              variant="hero" 
              size="lg" 
              className="gap-2 w-full sm:w-auto"
              onClick={addToEstimate}
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Estimate Cart
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
