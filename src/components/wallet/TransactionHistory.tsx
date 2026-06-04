import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowDownLeft, ArrowUpRight, History, Receipt } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [limit, setLimit] = useState(20);
  const [hasMore, setHasMore] = useState(false);

  // Fix — fetchTransactions defined BEFORE useEffect ✅
  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(limit + 1);

      if (error) throw error;
      const rows = data || [];
      setHasMore(rows.length > limit);
      setTransactions(rows.slice(0, limit));
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, limit]);

  // Fix — useEffect now comes AFTER fetchTransactions ✅
  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, fetchTransactions]);

  const isCredit = (type: string) => type === "credit" || type === "referral_bonus";

  const getTransactionIcon = (type: string) => {
    if (isCredit(type)) {
      return (
        <div className="p-2 rounded-full bg-green-500/10">
          <ArrowDownLeft className="h-4 w-4 text-green-600" />
        </div>
      );
    }
    return (
      <div className="p-2 rounded-full bg-red-500/10">
        <ArrowUpRight className="h-4 w-4 text-red-500" />
      </div>
    );
  };

  const getTransactionBadge = (type: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      credit: { label: "Credit", className: "bg-green-500/10 text-green-600 border-green-500/20" },
      debit: { label: "Debit", className: "bg-red-500/10 text-red-600 border-red-500/20" },
      referral_bonus: { label: "Referral", className: "bg-primary/10 text-primary border-primary/20" },
      purchase: { label: "Purchase", className: "bg-dealer/10 text-dealer border-dealer/20" },
    };
    const config = variants[type] || { label: type, className: "bg-muted text-muted-foreground" };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] px-6 pb-6">
            <div className="space-y-2">
              {transactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-muted/50 ${
                    index === 0 ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {transaction.description || transaction.transaction_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 shrink-0 ml-2">
                    <p className={`font-bold ${
                      isCredit(transaction.transaction_type)
                        ? "text-green-600"
                        : "text-red-500"
                    }`}>
                      {isCredit(transaction.transaction_type) ? "+" : "-"}₹{Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    {getTransactionBadge(transaction.transaction_type)}
                  </div>
                </div>
              ))}
              {hasMore && (
                <button
                  onClick={() => setLimit((l) => l + 20)}
                  className="w-full text-sm text-primary hover:underline py-2"
                >
                  Load more transactions
                </button>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}