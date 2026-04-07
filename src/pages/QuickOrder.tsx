import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Minus, ShoppingCart, Filter, Package, Loader2, Clock, Eye } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { usePageMeta } from "@/hooks/usePageMeta";

interface NormalizedProduct {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  mrp: number;
  price: number;
  stock: number;
  category: { name: string } | null;
  brand: { name: string } | null;
  is_wholesale: boolean;
  case_qty?: number;
  case_price?: number;
}

interface Category {
  id: string;
  name: string;
}

type WholesaleProductRecord = Database["public"]["Tables"]["wholesale_products"]["Row"] & {
  category: { name: string } | null;
  brand: { name: string } | null;
};

type RetailProductRecord = Database["public"]["Tables"]["products"]["Row"] & {
  category: { name: string } | null;
  brand: { name: string } | null;
};

export default function QuickOrder() {
  usePageMeta({ title: "Quick Order — GKP Crackers", description: "Quickly order your favorite crackers with our streamlined ordering system." });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<NormalizedProduct | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isVerifiedDealer, isPendingDealer } = useAuth();
  const { items: cartItems, addItem, updateQuantity: updateCartQty, removeItem } = useCart();
  const navigate = useNavigate();

  const quantities: Record<string, number> = {};
  cartItems.forEach(item => { quantities[item.id] = item.quantity; });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const categoriesRes = await supabase
          .from("categories")
          .select("id, name")
          .eq("is_active", true)
          .order("display_order");

        if (categoriesRes.data) setCategories(categoriesRes.data);

        if (isVerifiedDealer) {
          const res = await supabase
            .from<WholesaleProductRecord>("wholesale_products")
            .select(`*, category:categories(name), brand:brands(name)`)
            .eq("is_visible", true)
            .order("display_order");

          if (res.data) {
            setProducts(res.data.map((p) => ({
              id: p.id,
              product_code: p.product_code,
              name: p.name,
              description: p.description,
              image_url: p.image_url,
              video_url: p.video_url,
              mrp: p.mrp,
              price: p.sale_price,
              stock: p.stock ?? 0,
              category: p.category,
              brand: p.brand,
              is_wholesale: true,
              case_qty: p.case_qty,
              case_price: p.case_price,
            })));
          }
        } else {
          const res = await supabase
            .from<RetailProductRecord>("products")
            .select(`*, category:categories(name), brand:brands(name)`)
            .eq("is_visible", true)
            .order("display_order");

          if (res.data) {
            setProducts(res.data.map((p) => ({
              id: p.id,
              product_code: p.product_code,
              name: p.name,
              description: p.description,
              image_url: p.image_url,
              video_url: p.video_url,
              mrp: p.mrp,
              price: p.retail_price,
              stock: p.stock ?? 0,
              category: p.category,
              brand: p.brand,
              is_wholesale: false,
            })));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isVerifiedDealer]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.product_code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category?.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const updateQuantity = (productId: string, delta: number) => {
    const current = quantities[productId] || 0;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const step = product.is_wholesale ? (product.case_qty || 1) : 1;
    const actualDelta = delta > 0 ? step : -step;
    const newValue = Math.max(0, current + actualDelta);
    // Ensure wholesale qty is always a multiple of case_qty
    const adjusted = product.is_wholesale ? Math.round(newValue / step) * step : newValue;
    if (adjusted <= 0) {
      removeItem(productId);
    } else if (current === 0) {
      addItem({
        id: product.id, name: product.name, product_code: product.product_code,
        price: product.price, mrp: product.mrp, image_url: product.image_url,
        is_wholesale: product.is_wholesale, case_qty: product.case_qty, case_price: product.case_price,
      }, adjusted);
    } else {
      updateCartQty(productId, adjusted);
    }
  };

  const setQuantity = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const step = product.is_wholesale ? (product.case_qty || 1) : 1;
    const adjusted = product.is_wholesale ? Math.round(numValue / step) * step : numValue;
    if (adjusted <= 0) {
      removeItem(productId);
    } else if ((quantities[productId] || 0) === 0) {
      addItem({
        id: product.id, name: product.name, product_code: product.product_code,
        price: product.price, mrp: product.mrp, image_url: product.image_url,
        is_wholesale: product.is_wholesale, case_qty: product.case_qty, case_price: product.case_price,
      }, adjusted);
    } else {
      updateCartQty(productId, adjusted);
    }
  };

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToEstimate = () => {
    if (totalItemsCount === 0) {
      toast({ title: "No items selected", description: "Please add quantities to products you want to order.", variant: "destructive" });
      return;
    }
    toast({ title: "View Estimate Cart", description: `${totalItemsCount} items worth ₹${totalAmount.toLocaleString()} in cart.` });
    navigate("/cart");
  };

  const addSingleToCart = (product: NormalizedProduct, qty?: number) => {
    const quantity = qty || 1;
    addItem({
      id: product.id, name: product.name, product_code: product.product_code,
      price: product.price, mrp: product.mrp, image_url: product.image_url,
      is_wholesale: product.is_wholesale, case_qty: product.case_qty, case_price: product.case_price,
    }, quantity);
    toast({ title: "Added to Estimate Cart!", description: `${product.name} x${quantity} added.` });
  };

  const openProductDetail = (product: NormalizedProduct) => {
    setSelectedProduct(product);
    setDetailDialogOpen(true);
  };

  const getProductEmoji = (categoryName: string | undefined) => {
    const emojiMap: Record<string, string> = {
      "Ground Chakkar": "🌀", "Flower Pots": "🎇", "Sky Shots": "🎆",
      "Rockets": "🚀", "Sparklers": "✨", "Bombs": "💥",
      "Fountains": "⛲", "Novelty": "🎭", "Gift Boxes": "🎁"
    };
    return emojiMap[categoryName || ""] || "🧨";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-32">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            Quick Order <span className="text-gradient-hero">Table</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground text-sm sm:text-base">
              {isVerifiedDealer
                ? "Wholesale products — add quantities quickly"
                : "Add products quickly using our Excel-style order table"}
            </p>
            {isVerifiedDealer ? (
              <Badge variant="secondary" className="gradient-dealer text-white">Wholesale</Badge>
            ) : isPendingDealer ? (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                <Clock className="h-3 w-3 mr-1" />Verification Pending
              </Badge>
            ) : (
              <Badge variant="secondary">Retail</Badge>
            )}
          </div>
        </div>

        {/* Pending Dealer Alert */}
        {isPendingDealer && (
          <Alert className="mb-6 border-amber-500/30 bg-amber-500/10">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-700">Retail Products Displayed</AlertTitle>
            <AlertDescription className="text-amber-600">
              You're currently seeing retail products & prices. Once your dealer account is verified, you'll see exclusive wholesale products & pricing.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11" />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px] h-11">
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

        {/* Desktop Table View */}
        <div className="hidden md:block bg-card rounded-2xl shadow-card border border-border overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="quick-order-table">
              <thead>
                <tr>
                  <th className="w-14">#</th>
                  <th className="w-16">Image</th>
                  <th>Product</th>
                  <th className="w-24">Brand</th>
                  <th className="w-24 text-right">MRP</th>
                  <th className="w-28 text-right">{isVerifiedDealer ? "Price/pc" : "Price"}</th>
                  {isVerifiedDealer && <th className="w-24 text-center">Case Qty</th>}
                  {isVerifiedDealer && <th className="w-28 text-right">Case Price</th>}
                  <th className="w-40 text-center">{isVerifiedDealer ? "Cases" : "Quantity"}</th>
                  <th className="w-28 text-right">Amount</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={isVerifiedDealer ? 11 : 9} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground mt-2">Loading products...</p>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={isVerifiedDealer ? 11 : 9} className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No products found</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => {
                    const qty = quantities[product.id] || 0;
                    const amount = qty * product.price;
                    const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
                    const isOutOfStock = product.stock !== null && product.stock === 0;
                    return (
                      <tr key={product.id} className={`${qty > 0 ? "bg-primary/5" : ""} ${isOutOfStock ? "opacity-60" : ""}`}>
                        <td className="text-center text-muted-foreground text-sm">{index + 1}</td>
                        <td className="text-center">
                          <div
                            className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                            onClick={() => openProductDetail(product)}
                          >
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg">{getProductEmoji(product.category?.name)}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="cursor-pointer hover:text-primary transition-colors" onClick={() => openProductDetail(product)}>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {product.product_code}</p>
                          </div>
                        </td>
                        <td>
                          <Badge variant="outline" className="text-xs">{product.brand?.name || "N/A"}</Badge>
                        </td>
                        <td className="text-right text-muted-foreground line-through text-sm">₹{product.mrp}</td>
                        <td className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-primary">₹{product.price}</span>
                            <span className="text-xs text-green-600 font-medium">{discount}% OFF</span>
                          </div>
                        </td>
                        {isVerifiedDealer && (
                          <td className="text-center text-sm text-muted-foreground">
                            {product.case_qty || "-"} pcs
                          </td>
                        )}
                        {isVerifiedDealer && (
                          <td className="text-right font-bold text-primary text-sm">
                            ₹{product.case_price?.toLocaleString() || "-"}
                          </td>
                        )}
                        <td>
                          {isOutOfStock ? (
                            <div className="text-center text-xs text-destructive font-medium">Out of Stock</div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, -1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input type="number" min="0" step={product.is_wholesale ? (product.case_qty || 1) : 1} value={qty} onChange={(e) => setQuantity(product.id, e.target.value)} className="w-16 h-8 text-center" />
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                              {product.is_wholesale && qty > 0 && product.case_qty ? (
                                <span className="text-[10px] text-muted-foreground ml-1">{Math.round(qty / product.case_qty)}cs</span>
                              ) : null}
                            </div>
                          )}
                        </td>
                        <td className="text-right font-bold text-primary">
                          {amount > 0 ? `₹${amount.toLocaleString()}` : "-"}
                        </td>
                        <td>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openProductDetail(product)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 mb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-2">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const qty = quantities[product.id] || 0;
              const amount = qty * product.price;
              const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
              const isOutOfStock = product.stock !== null && product.stock === 0;
              return (
                <Card key={product.id} className={`overflow-hidden transition-all ${qty > 0 ? "border-primary/50 bg-primary/5" : ""} ${isOutOfStock ? "opacity-60" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div
                        className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden cursor-pointer relative"
                        onClick={() => openProductDetail(product)}
                      >
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{getProductEmoji(product.category?.name)}</span>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-destructive-foreground bg-destructive px-1 rounded">OOS</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0 cursor-pointer" onClick={() => openProductDetail(product)}>
                            <p className="font-semibold text-sm truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.product_code}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="outline" className="text-xs">{product.brand?.name || "N/A"}</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openProductDetail(product)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-primary">₹{product.price}</span>
                          <span className="text-xs text-muted-foreground line-through">₹{product.mrp}</span>
                          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                            {discount}% OFF
                          </Badge>
                        </div>
                        {product.is_wholesale && product.case_qty ? (
                          <p className="text-xs text-muted-foreground mb-2">
                            {product.case_qty} pcs/case • ₹{product.case_price?.toLocaleString()}/case
                          </p>
                        ) : null}

                        {/* Quantity Controls */}
                        {isOutOfStock ? (
                          <p className="text-xs font-medium text-destructive">Out of Stock</p>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQuantity(product.id, -1)}>
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input type="number" min="0" step={product.is_wholesale ? (product.case_qty || 1) : 1} value={qty} onChange={(e) => setQuantity(product.id, e.target.value)} className="w-16 h-9 text-center font-medium" />
                              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQuantity(product.id, 1)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-right">
                              {amount > 0 && <p className="font-bold text-primary">₹{amount.toLocaleString()}</p>}
                              {product.is_wholesale && qty > 0 && product.case_qty ? (
                                <p className="text-[10px] text-muted-foreground">{Math.round(qty / product.case_qty)} case(s)</p>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-4 z-40">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground">Items</p>
              <p className="text-xl font-bold">{totalItemsCount}</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-gradient-hero">₹{totalAmount.toLocaleString()}</p>
            </div>
          </div>
          <Button variant="hero" size="lg" className="gap-2 w-full sm:w-auto h-12" onClick={addToEstimate} disabled={totalItemsCount === 0}>
            <ShoppingCart className="h-5 w-5" />View Estimate Cart ({totalItemsCount})
          </Button>
        </div>
      </div>

      <Footer />
      <FloatingButtons />

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onAddToCart={addSingleToCart}
      />
    </div>
  );
}
