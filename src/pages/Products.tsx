import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, ShoppingCart, Grid3X3, Star, Clock, Eye, Plus, Minus, Package } from "lucide-react";
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
import { useCart, CartItem } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";

interface NormalizedProduct {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  mrp: number;
  price: number; // retail_price or sale_price
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

export default function Products() {
  usePageMeta({ title: "Products — GKP Crackers", description: "Browse our premium collection of Diwali crackers at best wholesale and retail prices." });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<NormalizedProduct | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isVerifiedDealer, isPendingDealer } = useAuth();
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
        const categoriesRes = await supabase
          .from("categories")
          .select("id, name")
          .eq("is_active", true)
          .order("display_order");

        if (categoriesRes.data) setCategories(categoriesRes.data);

        if (isVerifiedDealer) {
          // Fetch wholesale products for verified dealers
          const res = await (supabase as any)
            .from("wholesale_products")
            .select(`*, category:categories(name), brand:brands(name)`)
            .eq("is_visible", true)
            .order("display_order");

          if (res.data) {
            setProducts(res.data.map((p: any) => ({
              id: p.id,
              product_code: p.product_code,
              name: p.name,
              description: p.description,
              image_url: p.image_url,
              video_url: p.video_url,
              mrp: p.mrp,
              price: p.sale_price,
              stock: p.stock,
              category: p.category,
              brand: p.brand,
              is_wholesale: true,
              case_qty: p.case_qty,
              case_price: p.case_price,
            })));
          }
        } else {
          // Fetch retail products for retail / unverified users
          const res = await supabase
            .from("products")
            .select(`*, category:categories(name), brand:brands(name)`)
            .eq("is_visible", true)
            .order("display_order");

          if (res.data) {
            setProducts(res.data.map((p: any) => ({
              id: p.id,
              product_code: p.product_code,
              name: p.name,
              description: p.description,
              image_url: p.image_url,
              video_url: p.video_url,
              mrp: p.mrp,
              price: p.retail_price,
              stock: p.stock,
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

  const getDiscountPercent = (product: NormalizedProduct) => {
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  };

  const getSavings = (product: NormalizedProduct) => {
    return product.mrp - product.price;
  };

  const handleAddToEstimate = (product: NormalizedProduct) => {
    const qty = product.is_wholesale ? (product.case_qty || 1) : 1;
    addItem({
      id: product.id,
      name: product.name,
      product_code: product.product_code,
      price: product.price,
      mrp: product.mrp,
      image_url: product.image_url,
      is_wholesale: product.is_wholesale,
      case_qty: product.case_qty,
      case_price: product.case_price,
    }, qty);
    toast({ title: "Added to Estimate Cart!", description: `${product.name} ${product.is_wholesale ? `(1 case = ${product.case_qty} pcs)` : ""} added.` });
  };

  const handleUpdateQty = (product: NormalizedProduct, newQty: number) => {
    const step = product.is_wholesale ? (product.case_qty || 1) : 1;
    // Ensure wholesale qty is always a multiple of case_qty
    const adjusted = product.is_wholesale ? Math.max(0, Math.round(newQty / step) * step) : newQty;
    if (adjusted <= 0) removeItem(product.id);
    else updateCartQuantity(product.id, adjusted);
  };

  const addToCart = (product: NormalizedProduct, qty: number = 1) => {
    addItem({
      id: product.id,
      name: product.name,
      product_code: product.product_code,
      price: product.price,
      mrp: product.mrp,
      image_url: product.image_url,
      is_wholesale: product.is_wholesale,
      case_qty: product.case_qty,
      case_price: product.case_price,
    }, qty);
    toast({ title: "Added to Estimate Cart!", description: `${product.name} x${qty} added.` });
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
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-24">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            {isVerifiedDealer ? (
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            ) : (
              <Grid3X3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {isVerifiedDealer ? "Wholesale" : "Product"}{" "}
              <span className="text-gradient-hero">Catalog</span>
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isVerifiedDealer
              ? "Exclusive wholesale products with dealer pricing"
              : "Browse our premium collection of crackers."}
            {isVerifiedDealer ? (
              <Badge variant="secondary" className="ml-2 gradient-dealer text-white text-xs">Wholesale Prices</Badge>
            ) : isPendingDealer ? (
              <Badge variant="secondary" className="ml-2 bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                <Clock className="h-3 w-3 mr-1 inline" />
                Verification Pending
              </Badge>
            ) : (
              <Badge variant="secondary" className="ml-2 text-xs">Retail Prices</Badge>
            )}
          </p>
        </div>

        {/* Pending Dealer Alert */}
        {isPendingDealer && (
          <Alert className="mb-6 border-amber-500/30 bg-amber-500/10">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-700">Retail Prices Displayed</AlertTitle>
            <AlertDescription className="text-amber-600">
              You're currently seeing retail products & prices. Once your dealer account is verified, you'll see exclusive wholesale products & pricing.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
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
            <div className="text-6xl mb-4">🧨</div>
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {filteredProducts.map((product) => {
              const discount = getDiscountPercent(product);
              const savings = getSavings(product);
              const cartQty = getCartQty(product.id);
              const isInCart = cartQty > 0;

              return (
                <Card
                  key={product.id}
                  className={`group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 ${isInCart ? "ring-2 ring-primary/50 bg-primary/5" : ""}`}
                >
                  <CardContent className="p-3 sm:p-4">
                    {/* Product Image */}
                    <div
                      className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl mb-3 flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => openProductDetail(product)}
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <span className="text-4xl sm:text-5xl">{getProductEmoji(product.category?.name)}</span>
                      )}
                      {discount > 0 && (
                        <div className="absolute top-2 left-2 gradient-hero text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                          {discount}% OFF
                        </div>
                      )}
                      {isInCart && (
                        <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />{cartQty} in cart
                        </div>
                      )}
                      <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-background/90 rounded-full p-2">
                          <Eye className="h-5 w-5 text-foreground" />
                        </div>
                      </div>
                      {product.brand?.name && (
                        <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-border/50">
                          {product.brand.name}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <h3
                        className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem] sm:min-h-[3rem] cursor-pointer"
                        onClick={() => openProductDetail(product)}
                      >
                        {product.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Code: {product.product_code}</p>

                      {/* Price Section */}
                      <div className="space-y-1">
                        {product.is_wholesale && product.case_qty && product.case_price ? (
                          <>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-lg sm:text-xl font-bold text-primary">₹{product.case_price.toLocaleString()}</span>
                              <span className="text-[10px] sm:text-xs text-muted-foreground">/case</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {product.case_qty} pcs/case • ₹{product.price.toLocaleString()}/pc
                            </div>
                            <div className="text-xs text-muted-foreground line-through">MRP ₹{product.mrp.toLocaleString()}/pc</div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-lg sm:text-xl font-bold text-primary">₹{product.price.toLocaleString()}</span>
                              <span className="text-xs sm:text-sm text-muted-foreground line-through">₹{product.mrp.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                        {savings > 0 && (
                          <div className="flex items-center gap-1 text-accent">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-[10px] sm:text-xs font-medium">
                              {product.is_wholesale ? `Save ₹${((product.mrp - product.price) * (product.case_qty || 1)).toLocaleString()}/case` : `You save ₹${savings.toLocaleString()}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Section */}
                      <div className="pt-2">
                        {isInCart ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleUpdateQty(product, cartQty - (product.is_wholesale ? (product.case_qty || 1) : 1)); }}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input type="number" min={product.is_wholesale ? (product.case_qty || 1) : 1} step={product.is_wholesale ? (product.case_qty || 1) : 1} value={cartQty} onChange={(e) => { handleUpdateQty(product, parseInt(e.target.value) || 0); }} onClick={(e) => e.stopPropagation()} className="w-14 h-8 text-center text-sm px-1" />
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleUpdateQty(product, cartQty + (product.is_wholesale ? (product.case_qty || 1) : 1)); }}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="text-sm font-bold text-primary">₹{(product.price * cartQty).toLocaleString()}</span>
                            </div>
                            {product.is_wholesale && product.case_qty ? (
                              <p className="text-[10px] text-center text-muted-foreground">{Math.round(cartQty / product.case_qty)} case(s) × {product.case_qty} pcs</p>
                            ) : null}
                            <Badge variant="secondary" className="w-full justify-center bg-primary/10 text-primary border-primary/20 text-xs py-1">
                              <ShoppingCart className="h-3 w-3 mr-1" />Added to Estimate
                            </Badge>
                          </div>
                        ) : (
                          <Button variant="hero" size="sm" className="w-full h-9 text-xs sm:text-sm font-medium" onClick={(e) => { e.stopPropagation(); handleAddToEstimate(product); }}>
                            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />{product.is_wholesale ? "Add Case" : "Add to Estimate"}
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

        {/* Floating Cart Button - Mobile */}
        {totalItems > 0 && (
          <div className="fixed bottom-4 left-4 right-4 sm:hidden z-40">
            <Button variant="hero" size="lg" className="w-full gap-2 shadow-lg" onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-5 w-5" />View Estimate Cart ({totalItems} items)
            </Button>
          </div>
        )}
      </main>
      <Footer />
      <FloatingButtons />

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onAddToCart={addToCart}
      />
    </div>
  );
}
