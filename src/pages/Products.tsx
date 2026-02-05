import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, ShoppingCart, Grid3X3, Star, Clock, Eye } from "lucide-react";
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

interface Product {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
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

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { toast } = useToast();
  const { profile, isVerifiedDealer, isPendingDealer } = useAuth();
  const { addItem, totalItems } = useCart();
  const navigate = useNavigate();

  // Only verified dealers see wholesale prices
  const showWholesalePrice = isVerifiedDealer;

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

  const getPrice = (product: Product) => {
    return showWholesalePrice ? product.wholesale_price : product.retail_price;
  };

  const getDiscountPercent = (product: Product) => {
    const salePrice = getPrice(product);
    return Math.round(((product.mrp - salePrice) / product.mrp) * 100);
  };

  const getSavings = (product: Product) => {
    return product.mrp - getPrice(product);
  };

  const addToCart = (product: Product, qty: number = 1) => {
    addItem({
      id: product.id,
      name: product.name,
      product_code: product.product_code,
      price: getPrice(product),
      mrp: product.mrp,
      image_url: product.image_url
    }, qty);

    toast({
      title: "Added to Cart!",
      description: `${product.name} x${qty} added.`,
    });
  };

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setDetailDialogOpen(true);
  };

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
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Grid3X3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              Product <span className="text-gradient-hero">Catalog</span>
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Browse our premium collection of crackers. 
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
              You're currently seeing retail prices. Once your dealer account is verified, you'll have access to exclusive wholesale pricing. Your verification is under process.
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
              
              return (
                <Card 
                  key={product.id} 
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 cursor-pointer"
                  onClick={() => openProductDetail(product)}
                >
                  <CardContent className="p-3 sm:p-4">
                    {/* Product Image/Emoji */}
                    <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-4xl sm:text-5xl">{getProductEmoji(product.category?.name)}</span>
                      )}
                      
                      {/* Discount Badge */}
                      {discount > 0 && (
                        <div className="absolute top-2 left-2 gradient-hero text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                          {discount}% OFF
                        </div>
                      )}
                      
                      {/* View Details Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/90 rounded-full p-2">
                          <Eye className="h-5 w-5 text-foreground" />
                        </div>
                      </div>
                      
                      {/* Brand Badge */}
                      {product.brand?.name && (
                        <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-border/50">
                          {product.brand.name}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem] sm:min-h-[3rem]">
                        {product.name}
                      </h3>
                      
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Code: {product.product_code}
                      </p>

                      {/* Price Section */}
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-lg sm:text-xl font-bold text-primary">
                            ₹{getPrice(product)}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground line-through">
                            ₹{product.mrp}
                          </span>
                        </div>
                        
                        {savings > 0 && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-[10px] sm:text-xs font-medium">
                              You save ₹{savings}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      {/* Add to Cart Button */}
                      <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="hero"
                          size="sm"
                          className="w-full h-9 text-xs sm:text-sm font-medium"
                          onClick={() => addToCart(product, 1)}
                        >
                          <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                          Add to Cart
                        </Button>
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
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full gap-2 shadow-lg"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="h-5 w-5" />
              View Cart ({totalItems} items)
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
        showWholesalePrice={showWholesalePrice}
        onAddToCart={addToCart}
      />
    </div>
  );
}