import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { usePageMeta } from "@/hooks/usePageMeta";
import QuickOrderForm from "@/pages/quickorder/QuickOrderForm";
import QuickOrderPreview from "@/pages/quickorder/QuickOrderPreview";
import QuickOrderSummary from "@/pages/quickorder/QuickOrderSummary";

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
  cartItems.forEach(item => {
    quantities[item.id] = item.quantity;
  });

  // Fetch products and categories
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
            setProducts(
              res.data.map((p) => ({
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
              }))
            );
          }
        } else {
          const res = await supabase
            .from<RetailProductRecord>("products")
            .select(`*, category:categories(name), brand:brands(name)`)
            .eq("is_visible", true)
            .order("display_order");

          if (res.data) {
            setProducts(
              res.data.map((p) => ({
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
              }))
            );
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
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.product_code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category?.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const updateQuantity = (productId: string, delta: number) => {
    const current = quantities[productId] || 0;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const step = product.is_wholesale ? product.case_qty || 1 : 1;
    const actualDelta = delta > 0 ? step : -step;
    const newValue = Math.max(0, current + actualDelta);
    // Ensure wholesale qty is always a multiple of case_qty
    const adjusted = product.is_wholesale ? Math.round(newValue / step) * step : newValue;

    if (adjusted <= 0) {
      removeItem(productId);
    } else if (current === 0) {
      addItem(
        {
          id: product.id,
          name: product.name,
          product_code: product.product_code,
          price: product.price,
          mrp: product.mrp,
          image_url: product.image_url,
          is_wholesale: product.is_wholesale,
          case_qty: product.case_qty,
          case_price: product.case_price,
        },
        adjusted
      );
    } else {
      updateCartQty(productId, adjusted);
    }
  };

  const setQuantity = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const step = product.is_wholesale ? product.case_qty || 1 : 1;
    const adjusted = product.is_wholesale ? Math.round(numValue / step) * step : numValue;

    if (adjusted <= 0) {
      removeItem(productId);
    } else if ((quantities[productId] || 0) === 0) {
      addItem(
        {
          id: product.id,
          name: product.name,
          product_code: product.product_code,
          price: product.price,
          mrp: product.mrp,
          image_url: product.image_url,
          is_wholesale: product.is_wholesale,
          case_qty: product.case_qty,
          case_price: product.case_price,
        },
        adjusted
      );
    } else {
      updateCartQty(productId, adjusted);
    }
  };

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleViewEstimate = () => {
    if (totalItemsCount === 0) {
      toast({
        title: "No items selected",
        description: "Please add quantities to products you want to order.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "View Estimate Cart",
      description: `${totalItemsCount} items worth ₹${totalAmount.toLocaleString()} in cart.`,
    });
    navigate("/cart");
  };

  const handleOpenProductDetail = (product: NormalizedProduct) => {
    setSelectedProduct(product);
    setDetailDialogOpen(true);
  };

  const handleAddSingleToCart = (product: NormalizedProduct, qty?: number) => {
    const quantity = qty || 1;
    addItem(
      {
        id: product.id,
        name: product.name,
        product_code: product.product_code,
        price: product.price,
        mrp: product.mrp,
        image_url: product.image_url,
        is_wholesale: product.is_wholesale,
        case_qty: product.case_qty,
        case_price: product.case_price,
      },
      quantity
    );
    toast({
      title: "Added to Estimate Cart!",
      description: `${product.name} x${quantity} added.`,
    });
  };

  const getProductEmoji = (categoryName: string | undefined): string => {
    const emojiMap: Record<string, string> = {
      "Ground Chakkar": "🌀",
      "Flower Pots": "🎇",
      "Sky Shots": "🎆",
      Rockets: "🚀",
      Sparklers: "✨",
      Bombs: "💥",
      Fountains: "⛲",
      Novelty: "🎭",
      "Gift Boxes": "🎁",
    };
    return emojiMap[categoryName || ""] || "🧨";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-32">
        <QuickOrderForm
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          isVerifiedDealer={isVerifiedDealer}
          isPendingDealer={isPendingDealer}
        />

        <QuickOrderPreview
          filteredProducts={filteredProducts}
          quantities={quantities}
          isLoading={isLoading}
          isVerifiedDealer={isVerifiedDealer}
          onQuantityChange={updateQuantity}
          onSetQuantity={setQuantity}
          onOpenDetail={handleOpenProductDetail}
          getProductEmoji={getProductEmoji}
        />
      </main>

      <QuickOrderSummary
        totalItems={totalItemsCount}
        totalAmount={totalAmount}
        onViewEstimate={handleViewEstimate}
        disabled={totalItemsCount === 0}
      />

      <Footer />
      <FloatingButtons />

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onAddToCart={handleAddSingleToCart}
      />
    </div>
  );
}
