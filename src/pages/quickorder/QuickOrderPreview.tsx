import { Plus, Minus, Eye, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface NormalizedProduct {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  mrp: number;
  price: number;
  stock: number;
  category?: { name: string } | null;
  brand?: { name: string } | null;
  is_wholesale: boolean;
  case_qty?: number;
  case_price?: number;
}

interface QuickOrderPreviewProps {
  filteredProducts: NormalizedProduct[];
  quantities: Record<string, number>;
  isLoading: boolean;
  isVerifiedDealer: boolean;
  onQuantityChange: (productId: string, delta: number) => void;
  onSetQuantity: (productId: string, value: string) => void;
  onOpenDetail: (product: NormalizedProduct) => void;
  getProductEmoji: (categoryName: string | undefined) => string;
}

export default function QuickOrderPreview({
  filteredProducts,
  quantities,
  isLoading,
  isVerifiedDealer,
  onQuantityChange,
  onSetQuantity,
  onOpenDetail,
  getProductEmoji,
}: QuickOrderPreviewProps) {
  // Desktop Table View
  const DesktopTableView = () => (
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
                  <tr
                    key={product.id}
                    className={`${qty > 0 ? "bg-primary/5" : ""} ${isOutOfStock ? "opacity-60" : ""}`}
                  >
                    <td className="text-center text-muted-foreground text-sm">{index + 1}</td>
                    <td className="text-center">
                      <div
                        className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => onOpenDetail(product)}
                      >
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">{getProductEmoji(product.category?.name)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="cursor-pointer hover:text-primary transition-colors" onClick={() => onOpenDetail(product)}>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {product.product_code}</p>
                      </div>
                    </td>
                    <td>
                      <Badge variant="outline" className="text-xs">
                        {product.brand?.name || "N/A"}
                      </Badge>
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
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onQuantityChange(product.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            step={product.is_wholesale ? product.case_qty || 1 : 1}
                            value={qty}
                            onChange={(e) => onSetQuantity(product.id, e.target.value)}
                            className="w-16 h-8 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onQuantityChange(product.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          {product.is_wholesale && qty > 0 && product.case_qty ? (
                            <span className="text-[10px] text-muted-foreground ml-1">
                              {Math.round(qty / product.case_qty)}cs
                            </span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="text-right font-bold text-primary">
                      {amount > 0 ? `₹${amount.toLocaleString()}` : "-"}
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onOpenDetail(product)}
                      >
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
  );

  // Mobile Card View
  const MobileCardView = () => (
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
            <Card
              key={product.id}
              className={`overflow-hidden transition-all ${qty > 0 ? "border-primary/50 bg-primary/5" : ""} ${
                isOutOfStock ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div
                    className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden cursor-pointer relative"
                    onClick={() => onOpenDetail(product)}
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{getProductEmoji(product.category?.name)}</span>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-destructive-foreground bg-destructive px-1 rounded">
                          OOS
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 cursor-pointer" onClick={() => onOpenDetail(product)}>
                        <p className="font-semibold text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.product_code}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {product.brand?.name || "N/A"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onOpenDetail(product)}
                        >
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
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => onQuantityChange(product.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            step={product.is_wholesale ? product.case_qty || 1 : 1}
                            value={qty}
                            onChange={(e) => onSetQuantity(product.id, e.target.value)}
                            className="w-16 h-9 text-center font-medium"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => onQuantityChange(product.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          {amount > 0 && <p className="font-bold text-primary">₹{amount.toLocaleString()}</p>}
                          {product.is_wholesale && qty > 0 && product.case_qty ? (
                            <p className="text-[10px] text-muted-foreground">
                              {Math.round(qty / product.case_qty)} case(s)
                            </p>
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
  );

  return (
    <>
      <DesktopTableView />
      <MobileCardView />
    </>
  );
}
