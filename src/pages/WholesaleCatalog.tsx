import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, ShoppingCart, Star, Plus, Minus, Package, Lock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCart, CartItem } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

interface WholesaleProduct {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  mrp: number;
  purchase_price: number;
  sale_price: number;
  case_qty: number;
  case_price: number;
  stock: number;
  category: { name: string } | null;
  brand: { name: string } | null;
}

interface Category { id: string; name: string; }

export default function WholesaleCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState<WholesaleProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isVerifiedDealer, user } = useAuth();
  const { items: cartItems, addItem, updateQuantity: updateCartQuantity, removeItem, totalItems } = useCart();
  const navigate = useNavigate();

  const getCartQty = (productId: string): number => {
    const cartItem = cartItems.find((item: CartItem) => item.id === productId);
    return cartItem?.quantity || 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          (supabase as any)
            .from("wholesale_products")
            .select(`*, category:categories(name), brand:brands(name)`)
            .eq("is_visible", true)
            .order("display_order"),
          supabase
            .from("categories")
            .select("id, name")
            .eq("is_active", true)
            .order("display_order")
        ]);
        if (productsRes.data) setProducts(productsRes.data as WholesaleProduct[]);
        if (categoriesRes.data) setCategories(categoriesRes.data);
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

  const getDiscountPercent = (product: WholesaleProduct) => {
    return Math.round(((product.mrp - product.sale_price) / product.mrp) * 100);
  };

  const handleAddToCart = (product: WholesaleProduct) => {
    const qty = product.case_qty || 1;
    addItem({
      id: product.id,
      name: product.name,
      product_code: product.product_code,
      price: product.sale_price,
      mrp: product.mrp,
      image_url: product.image_url,
      is_wholesale: true
    }, qty);
    toast({ title: "Added to Estimate Cart!", description: `${product.name} (1 case = ${product.case_qty} pcs) added.` });
  };

  const handleUpdateQty = (product: WholesaleProduct, newQty: number) => {
    const step = product.case_qty || 1;
    const adjusted = Math.max(0, Math.round(newQty / step) * step);
    if (adjusted <= 0) removeItem(product.id);
    else updateCartQuantity(product.id, adjusted);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Dealer Access Only</h2>
          <p className="text-muted-foreground mb-6">Please login with a verified dealer account to access wholesale products.</p>
          <Button variant="hero" onClick={() => navigate("/auth")}>Login / Signup</Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isVerifiedDealer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Verified Dealers Only</h2>
          <p className="text-muted-foreground mb-6">Wholesale catalog is available only for verified dealer accounts.</p>
          <Button variant="outline" onClick={() => navigate("/products")}>Browse Retail Products</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-24">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              Wholesale <span className="text-gradient-hero">Catalog</span>
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Exclusive wholesale products for verified dealers
            <Badge variant="secondary" className="ml-2 gradient-dealer text-white text-xs">Dealer Prices</Badge>
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search wholesale products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11" />
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

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3 sm:p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No wholesale products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {filteredProducts.map((product) => {
              const discount = getDiscountPercent(product);
              const cartQty = getCartQty(product.id);
              const isInCart = cartQty > 0;

              return (
                <Card key={product.id} className={`group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 ${isInCart ? "ring-2 ring-primary/50 bg-primary/5" : ""}`}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Package className="h-10 w-10 text-muted-foreground" />
                      )}
                      {discount > 0 && (
                        <div className="absolute top-2 left-2 gradient-hero text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                          {discount}% OFF
                        </div>
                      )}
                      {product.brand?.name && (
                        <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-border/50">
                          {product.brand.name}
                        </div>
                      )}
                      {isInCart && (
                        <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />{cartQty} in cart
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">{product.name}</h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Code: {product.product_code}</p>

                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-lg sm:text-xl font-bold text-primary">₹{product.case_price.toLocaleString()}</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">/case</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.case_qty} pcs/case • ₹{product.sale_price.toLocaleString()}/pc
                        </div>
                        <div className="text-xs text-muted-foreground line-through">MRP ₹{product.mrp.toLocaleString()}/pc</div>
                        {discount > 0 && (
                          <div className="flex items-center gap-1 text-accent">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-[10px] sm:text-xs font-medium">
                              Save ₹{((product.mrp - product.sale_price) * product.case_qty).toLocaleString()}/case
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        {isInCart ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateQty(product, cartQty - (product.case_qty || 1))}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input type="number" min={product.case_qty} step={product.case_qty} value={cartQty} onChange={(e) => handleUpdateQty(product, parseInt(e.target.value) || 0)} className="w-14 h-8 text-center text-sm px-1" />
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateQty(product, cartQty + (product.case_qty || 1))}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="text-sm font-bold text-primary">₹{(product.sale_price * cartQty).toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground">{Math.round(cartQty / product.case_qty)} case(s) × {product.case_qty} pcs</p>
                            <Badge variant="secondary" className="w-full justify-center bg-primary/10 text-primary border-primary/20 text-xs py-1">
                              <ShoppingCart className="h-3 w-3 mr-1" /> Added to Estimate
                            </Badge>
                          </div>
                        ) : (
                          <Button variant="hero" size="sm" className="w-full h-9 text-xs sm:text-sm font-medium" onClick={() => handleAddToCart(product)}>
                            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" /> Add Case
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {totalItems > 0 && (
          <div className="fixed bottom-4 left-4 right-4 sm:hidden z-40">
            <Button variant="hero" size="lg" className="w-full gap-2 shadow-lg" onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-5 w-5" />
              View Estimate Cart ({totalItems} items)
            </Button>
          </div>
        )}
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
