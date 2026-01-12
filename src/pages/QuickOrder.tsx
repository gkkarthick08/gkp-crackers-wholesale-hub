import { useState, useMemo } from "react";
import { Search, Plus, Minus, ShoppingCart, Filter } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Sample product data - will be replaced with database
const sampleProducts = [
  { id: "P001", name: "Lakshmi Bomb 10pcs", image: "🧨", brand: "Standard", category: "Ground Chakkar", mrp: 250, retailPrice: 200, wholesalePrice: 150, stock: 100 },
  { id: "P002", name: "Flower Pot Large", image: "🎇", brand: "Deluxe", category: "Flower Pots", mrp: 180, retailPrice: 140, wholesalePrice: 100, stock: 200 },
  { id: "P003", name: "Sky Shot 30pcs", image: "🎆", brand: "Premium", category: "Sky Shots", mrp: 1200, retailPrice: 950, wholesalePrice: 750, stock: 50 },
  { id: "P004", name: "Chakkar 10pcs", image: "🌀", brand: "Standard", category: "Ground Chakkar", mrp: 150, retailPrice: 120, wholesalePrice: 90, stock: 300 },
  { id: "P005", name: "Rocket 20pcs", image: "🚀", brand: "Deluxe", category: "Rockets", mrp: 400, retailPrice: 320, wholesalePrice: 240, stock: 150 },
  { id: "P006", name: "Sparklers 100pcs", image: "✨", brand: "Standard", category: "Sparklers", mrp: 200, retailPrice: 160, wholesalePrice: 120, stock: 500 },
  { id: "P007", name: "Atom Bomb 5pcs", image: "💥", brand: "Premium", category: "Bombs", mrp: 350, retailPrice: 280, wholesalePrice: 210, stock: 80 },
  { id: "P008", name: "Fancy Fountain", image: "⛲", brand: "Deluxe", category: "Fountains", mrp: 500, retailPrice: 400, wholesalePrice: 300, stock: 120 },
  { id: "P009", name: "Whistle Rocket 15pcs", image: "🎵", brand: "Standard", category: "Rockets", mrp: 280, retailPrice: 220, wholesalePrice: 165, stock: 200 },
  { id: "P010", name: "Color Smoke 6pcs", image: "💨", brand: "Deluxe", category: "Novelty", mrp: 180, retailPrice: 145, wholesalePrice: 110, stock: 400 },
];

const categories = ["All", "Ground Chakkar", "Flower Pots", "Sky Shots", "Rockets", "Sparklers", "Bombs", "Fountains", "Novelty"];

export default function QuickOrder() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isDealer] = useState(false); // Will be dynamic based on auth
  const { toast } = useToast();

  const filteredProducts = useMemo(() => {
    return sampleProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const newValue = Math.max(0, current + delta);
      return { ...prev, [productId]: newValue };
    });
  };

  const setQuantity = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setQuantities(prev => ({ ...prev, [productId]: Math.max(0, numValue) }));
  };

  const getPrice = (product: typeof sampleProducts[0]) => {
    return isDealer ? product.wholesalePrice : product.retailPrice;
  };

  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  const totalAmount = sampleProducts.reduce((sum, product) => {
    const qty = quantities[product.id] || 0;
    return sum + (qty * getPrice(product));
  }, 0);

  const addToEstimate = () => {
    const itemsToAdd = sampleProducts.filter(p => quantities[p.id] > 0);
    if (itemsToAdd.length === 0) {
      toast({
        title: "No items selected",
        description: "Please add quantities to products you want to order.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Added to Estimate Cart!",
      description: `${totalItems} items worth ₹${totalAmount.toLocaleString()} added.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Quick Order <span className="text-gradient-hero">Table</span>
          </h1>
          <p className="text-muted-foreground">
            Add products quickly using our Excel-style order table. 
            {isDealer ? (
              <Badge variant="secondary" className="ml-2 gradient-dealer text-white">Wholesale Prices</Badge>
            ) : (
              <Badge variant="secondary" className="ml-2">Retail Prices</Badge>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or product ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="quick-order-table">
              <thead>
                <tr>
                  <th className="w-16">S.No</th>
                  <th className="w-20">Image</th>
                  <th>Product Name</th>
                  <th className="w-24">Brand</th>
                  <th className="w-28 text-right">MRP</th>
                  <th className="w-28 text-right">
                    {isDealer ? "Wholesale" : "Sale Price"}
                  </th>
                  <th className="w-36 text-center">Quantity</th>
                  <th className="w-28 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => {
                  const qty = quantities[product.id] || 0;
                  const amount = qty * getPrice(product);
                  return (
                    <tr key={product.id} className={qty > 0 ? "bg-primary/5" : ""}>
                      <td className="text-center text-muted-foreground">{index + 1}</td>
                      <td className="text-center text-3xl">{product.image}</td>
                      <td>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                        </div>
                      </td>
                      <td>
                        <Badge variant="outline">{product.brand}</Badge>
                      </td>
                      <td className="text-right text-muted-foreground line-through">
                        ₹{product.mrp}
                      </td>
                      <td className="text-right font-semibold text-primary">
                        ₹{getPrice(product)}
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => setQuantity(product.id, e.target.value)}
                            className="w-16 h-8 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="text-right font-bold">
                        {amount > 0 ? `₹${amount.toLocaleString()}` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-md rounded-t-2xl shadow-lg border border-border p-4 -mx-4">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold">{totalItems}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold text-gradient-hero">₹{totalAmount.toLocaleString()}</p>
              </div>
            </div>
            <Button 
              variant="hero" 
              size="lg" 
              className="gap-2 w-full sm:w-auto"
              onClick={addToEstimate}
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Estimate Cart
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
