import { Search, Filter, Clock, Badge as BadgeIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
}

interface QuickOrderFormProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
  isVerifiedDealer: boolean;
  isPendingDealer: boolean;
}

export default function QuickOrderForm({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  isVerifiedDealer,
  isPendingDealer,
}: QuickOrderFormProps) {
  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
          Quick Order <span className="text-gradient-hero">Table</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-muted-foreground text-sm sm:text-base">
            {isVerifiedDealer
              ? "Wholesale products — add quantities quickly"
              : "Add products quickly using our Excel-style order table"}
          </p>
          {isVerifiedDealer ? (
            <Badge variant="secondary" className="gradient-dealer text-white">
              Wholesale
            </Badge>
          ) : isPendingDealer ? (
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
              <Clock className="h-3 w-3 mr-1" />
              Verification Pending
            </Badge>
          ) : (
            <Badge variant="secondary">Retail</Badge>
          )}
        </div>
      </div>

      {/* Pending Dealer Alert */}
      {isPendingDealer && (
        <Alert className="mb-6 border-amber-500/30 bg-amber-500/10">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-700">Retail Products Displayed</AlertTitle>
          <AlertDescription className="text-amber-600">
            You're currently seeing retail products & prices. Once your dealer account is verified, you'll see exclusive wholesale products & pricing.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-11">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
