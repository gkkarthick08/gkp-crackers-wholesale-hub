import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface POSHeaderProps {
  billingMode: "retail" | "wholesale";
  setBillingMode: (mode: "retail" | "wholesale") => void;
  clearCart: () => void;
  isOnline: boolean;
  unsyncedCount: number;
  isSyncing: boolean;
  onSync: () => void;
}

export default function POSHeader({
  billingMode, setBillingMode, clearCart,
  isOnline, unsyncedCount, isSyncing, onSync,
}: POSHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-card border-b border-border px-3 py-2.5 flex items-center justify-between gap-2 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Store className="h-5 w-5 text-primary" />
        <h1 className="text-sm font-bold hidden sm:block">POS System</h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant={billingMode === "retail" ? "default" : "outline"}
          size="sm"
          onClick={() => { setBillingMode("retail"); clearCart(); }}
          className="text-xs h-8 px-2.5"
        >
          Retail
        </Button>
        <Button
          variant={billingMode === "wholesale" ? "default" : "outline"}
          size="sm"
          onClick={() => { setBillingMode("wholesale"); clearCart(); }}
          className="text-xs h-8 px-2.5"
        >
          Wholesale
        </Button>

        <Separator orientation="vertical" className="h-5" />

        {isOnline ? (
          <Badge variant="secondary" className="bg-accent/20 text-accent-foreground text-[10px] gap-1 px-1.5">
            <Wifi className="h-3 w-3" />Online
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-[10px] gap-1 px-1.5">
            <WifiOff className="h-3 w-3" />Offline
          </Badge>
        )}

        {unsyncedCount > 0 && (
          <Button variant="outline" size="sm" onClick={onSync}
            disabled={!isOnline || isSyncing} className="gap-1 text-xs h-8">
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
            Sync ({unsyncedCount})
          </Button>
        )}
      </div>
    </div>
  );
}
