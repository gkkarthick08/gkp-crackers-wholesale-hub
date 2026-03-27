import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, Play, Star, Tag, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";

interface NormalizedProduct {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url?: string | null;
  mrp: number;
  price: number;
  stock: number;
  category: { name: string } | null;
  brand: { name: string } | null;
  is_wholesale: boolean;
  case_qty?: number;
  case_price?: number;
}

interface ProductDetailDialogProps {
  product: NormalizedProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (product: NormalizedProduct, quantity: number) => void;
  showWholesalePrice?: boolean; // kept for backward compat, but now uses product.is_wholesale
}

export default function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onAddToCart
}: ProductDetailDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setShowVideo(false);
    }
  }, [product?.id]);

  if (!product) return null;

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const savings = product.mrp - product.price;

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
    onOpenChange(false);
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtube.com/shorts/')) {
      const videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        {/* Image/Video Section */}
        <div className="relative">
          {showVideo && product.video_url ? (
            <AspectRatio ratio={16 / 9}>
              <iframe
                src={getEmbedUrl(product.video_url)}
                className="w-full h-full rounded-t-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </AspectRatio>
          ) : (
            <AspectRatio ratio={16 / 9}>
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-t-lg" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 rounded-t-lg flex items-center justify-center">
                  <span className="text-8xl">{getProductEmoji(product.category?.name)}</span>
                </div>
              )}
            </AspectRatio>
          )}
          {discount > 0 && (
            <div className="absolute top-4 left-4 gradient-hero text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
              {discount}% OFF
            </div>
          )}
          {product.video_url && (
            <Button variant="secondary" size="sm" className="absolute top-4 right-4 gap-2 shadow-lg" onClick={() => setShowVideo(!showVideo)}>
              {showVideo ? (<><Package className="h-4 w-4" />View Image</>) : (<><Play className="h-4 w-4" />Watch Video</>)}
            </Button>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold leading-tight">{product.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />{product.product_code}
              </Badge>
              {product.category?.name && <Badge variant="secondary" className="text-xs">{product.category.name}</Badge>}
              {product.brand?.name && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">{product.brand.name}</Badge>}
            </div>
          </div>

          {product.description && <p className="text-muted-foreground leading-relaxed">{product.description}</p>}

          <Separator />

          {/* Pricing */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-primary">₹{product.price.toLocaleString()}</span>
              <span className="text-base sm:text-lg text-muted-foreground line-through">₹{product.mrp.toLocaleString()}</span>
              <Badge variant="secondary" className="bg-accent/50 text-accent-foreground border-accent text-xs">
                {product.is_wholesale ? "Wholesale" : "Retail"}
              </Badge>
            </div>

            {/* Wholesale case info */}
            {product.is_wholesale && product.case_qty && product.case_price ? (
              <div className="flex items-center gap-3 text-sm bg-muted/50 p-2 rounded-lg">
                <span>Case: <strong>{product.case_qty} pcs</strong></span>
                <span>Case Price: <strong className="text-primary">₹{product.case_price.toLocaleString()}</strong></span>
              </div>
            ) : null}

            {savings > 0 && (
              <div className="flex items-center gap-2 text-primary bg-primary/5 p-2 rounded-lg">
                <Star className="h-4 w-4 fill-current flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">You save ₹{savings.toLocaleString()} on this purchase!</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Add to Cart */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 sticky bottom-0 bg-background pt-4 border-t border-border/50">
            <div className="flex items-center justify-center gap-3 bg-muted rounded-xl p-2 flex-shrink-0">
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-xl font-bold">{quantity}</span>
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="hero" size="lg" className="flex-1 gap-2 h-12" onClick={handleAddToCart}>
              <ShoppingCart className="h-5 w-5" />
              Add to Estimate - ₹{(product.price * quantity).toLocaleString()}
            </Button>
          </div>

          {product.stock !== null && (
            <div className="text-center pb-2">
              {product.stock > 10 ? (
                <p className="text-sm text-primary font-medium">✓ In Stock</p>
              ) : product.stock > 0 ? (
                <p className="text-sm text-amber-600 font-medium">⚠️ Only {product.stock} left in stock!</p>
              ) : (
                <p className="text-sm text-destructive font-medium">Out of Stock</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
