import { RefObject } from "react";
import { Search, Package, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface PosProduct {
  id: string;
  product_code: string;
  name: string;
  image_url: string | null;
  mrp: number;
  price: number;
  stock: number;
  category_name: string;
  brand_name: string;
  is_wholesale: boolean;
  case_qty?: number;
  case_price?: number;
}

interface PosCartItem extends PosProduct {
  quantity: number;
}

interface Props {
  products: PosProduct[];
  cart: PosCartItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  categories: string[];
  isLoading: boolean;
  searchRef: RefObject<HTMLInputElement>;
  onAddToCart: (product: PosProduct) => void;
}

export default function POSProductGrid({
  products, cart, searchQuery, setSearchQuery,
  selectedCategory, setSelectedCategory, categories,
  isLoading, searchRef, onAddToCart,
}: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input ref={searchRef} placeholder="Search product or scan barcode..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10" autoFocus />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[130px] h-10">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-3 pt-0">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-2.5 rounded-xl border border-border bg-card">
                <Skeleton className="w-full aspect-square rounded-lg mb-2" />
                <Skeleton className="h-3 w-3/4 mb-1" />
                <Skeleton className="h-2.5 w-1/2 mb-1" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Package className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {products.map((product) => {
              const inCart = cart.find((i) => i.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => onAddToCart(product)}
                  className={`text-left p-2.5 rounded-xl border transition-all hover:shadow-md ${
                    inCart
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden mb-2">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className="font-medium text-xs line-clamp-2 mb-1">{product.name}</p>
                  <p className="text-[10px] text-muted-foreground mb-1">{product.product_code}</p>
                  {product.is_wholesale && product.case_qty ? (
                    <div>
                      <p className="font-bold text-primary text-sm">₹{product.case_price?.toLocaleString()}/case</p>
                      <p className="text-[10px] text-muted-foreground">{product.case_qty}pcs • ₹{product.price}/pc</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-primary text-sm">₹{product.price}</p>
                      <p className="text-[10px] text-muted-foreground line-through">MRP ₹{product.mrp}</p>
                    </div>
                  )}
                  {inCart && (
                    <Badge className="mt-1 text-[10px]" variant="secondary">
                      {inCart.quantity} in cart
                      {product.is_wholesale && product.case_qty
                        ? ` (${Math.round(inCart.quantity / product.case_qty)} cs)`
                        : ""}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
