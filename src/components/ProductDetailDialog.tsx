import { useState } from "react";
import { X, ShoppingCart, Plus, Minus, Play, Star, Tag, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";

interface Product {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url?: string | null;
  mrp: number;
  retail_price: number;
  wholesale_price: number;
  stock: number;
  category: { name: string } | null;
  brand: { name: string } | null;
}

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showWholesalePrice: boolean;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  showWholesalePrice,
  onAddToCart
}: ProductDetailDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [showVideo, setShowVideo] = useState(false);

  if (!product) return null;

  const price = showWholesalePrice ? product.wholesale_price : product.retail_price;
  const discount = Math.round(((product.mrp - price) / product.mrp) * 100);
  const savings = product.mrp - price;

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
    onOpenChange(false);
  };

  const getEmbedUrl = (url: string) => {
    // Convert YouTube watch URL to embed URL
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
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
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 rounded-t-lg flex items-center justify-center">
                  <span className="text-8xl">{getProductEmoji(product.category?.name)}</span>
                </div>
              )}
            </AspectRatio>
          )}

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-4 left-4 gradient-hero text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
              {discount}% OFF
            </div>
          )}

          {/* Video Toggle Button */}
          {product.video_url && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 gap-2 shadow-lg"
              onClick={() => setShowVideo(!showVideo)}
            >
              {showVideo ? (
                <>
                  <Package className="h-4 w-4" />
                  View Image
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Watch Video
                </>
              )}
            </Button>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold leading-tight">{product.name}</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {product.product_code}
              </Badge>
              {product.category?.name && (
                <Badge variant="secondary" className="text-xs">
                  {product.category.name}
                </Badge>
              )}
              {product.brand?.name && (
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                  {product.brand.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          <Separator />

          {/* Pricing */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">₹{price}</span>
              <span className="text-lg text-muted-foreground line-through">₹{product.mrp}</span>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                {showWholesalePrice ? "Wholesale" : "Retail"}
              </Badge>
            </div>
            
            {savings > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium">You save ₹{savings} on this purchase!</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Add to Cart Section */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex items-center justify-center gap-3 bg-muted rounded-xl p-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-xl font-bold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="flex-1 gap-2 h-12"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart - ₹{(price * quantity).toLocaleString()}
            </Button>
          </div>

          {/* Stock Info */}
          {product.stock !== null && product.stock > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {product.stock > 10 ? "✓ In Stock" : `Only ${product.stock} left in stock!`}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
