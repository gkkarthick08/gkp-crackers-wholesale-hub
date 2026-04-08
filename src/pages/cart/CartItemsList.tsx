import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CartItem {
  id: string;
  name: string;
  product_code: string;
  price: number;
  mrp: number;
  quantity: number;
  image_url?: string;
  is_wholesale: boolean;
  case_qty?: number;
  case_price?: number;
}

interface CartItemsListProps {
  items: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
}

export default function CartItemsList({ items, updateQuantity, removeItem }: CartItemsListProps) {
  return (
    <div className="space-y-4">
      {items.map(item => {
        const itemSaving = (item.mrp - item.price) * item.quantity;
        const discountPercent = Math.round(((item.mrp - item.price) / item.mrp) * 100);
        const step = item.is_wholesale && item.case_qty ? item.case_qty : 1;
        const cases = item.is_wholesale && item.case_qty ? Math.round(item.quantity / item.case_qty) : null;

        return (
          <Card key={item.id} className="shadow-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  )}
                  {discountPercent > 0 && (
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1 rounded">
                      {discountPercent}%
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">Code: {item.product_code}</p>
                      {item.is_wholesale && item.case_qty && (
                        <p className="text-xs text-muted-foreground">
                          {item.case_qty} pcs/case • ₹{item.case_price?.toLocaleString()}/case
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 h-7 w-7 flex-shrink-0"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground line-through">₹{item.mrp}/pc</span>
                    <span className="font-bold text-primary text-sm">₹{item.price}/pc</span>
                    {discountPercent > 0 && (
                      <span className="text-[10px] sm:text-xs text-accent font-medium">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - step))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="w-12 sm:w-14 text-center">
                        <span className="font-semibold text-sm">{item.quantity}</span>
                        {cases !== null && <p className="text-[9px] text-muted-foreground">{cases} case(s)</p>}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + step)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm sm:text-base">₹{(item.price * item.quantity).toLocaleString()}</p>
                      {itemSaving > 0 && (
                        <p className="text-[10px] sm:text-xs text-accent">Save ₹{itemSaving.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
