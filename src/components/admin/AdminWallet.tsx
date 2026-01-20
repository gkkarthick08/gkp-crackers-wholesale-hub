import { useEffect, useState } from "react";
import { Search, Plus, Minus, Loader2, Wallet, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserWithWallet {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  user_type: string;
  wallet_balance: number;
}

export default function AdminWallet() {
  const [users, setUsers] = useState<UserWithWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithWallet | null>(null);
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, user_type, wallet_balance")
        .order("full_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery)
  );

  const openTransactionDialog = (user: UserWithWallet, type: "credit" | "debit") => {
    setSelectedUser(user);
    setTransactionType(type);
    setAmount("");
    setDescription("");
    setIsDialogOpen(true);
  };

  const handleTransaction = async () => {
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const transAmount = parseFloat(amount);
    
    if (transactionType === "debit" && transAmount > selectedUser.wallet_balance) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const finalAmount = transactionType === "credit" ? transAmount : -transAmount;
      
      const { error } = await supabase.rpc("admin_wallet_transaction", {
        target_user_id: selectedUser.id,
        transaction_amount: finalAmount,
        trans_type: transactionType,
        trans_description: description || `Admin ${transactionType}`,
      });

      if (error) throw error;

      toast({
        title: "Transaction successful",
        description: `₹${transAmount} ${transactionType}ed to ${selectedUser.full_name}'s wallet`,
      });

      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Transaction failed", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalWalletBalance = users.reduce((sum, u) => sum + (u.wallet_balance || 0), 0);
  const usersWithBalance = users.filter(u => (u.wallet_balance || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Wallet className="h-7 w-7 text-primary" />
            Wallet Management
          </h1>
          <p className="text-muted-foreground mt-1">Credit or debit user wallets</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4 px-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Outstanding</p>
                  <p className="text-xl font-bold text-primary">₹{totalWalletBalance.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="py-4 px-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/10">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Users with Balance</p>
                  <p className="text-xl font-bold text-green-600">{usersWithBalance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* Users List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold truncate">{user.full_name}</p>
                          <Badge 
                            variant="outline"
                            className={user.user_type === "dealer" 
                              ? "bg-dealer/10 text-dealer border-dealer/20" 
                              : "bg-muted"
                            }
                          >
                            {user.user_type}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {user.email && <span className="truncate">{user.email}</span>}
                          {user.phone && <span>{user.phone}</span>}
                        </div>
                      </div>
                      
                      {/* Balance & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Balance</p>
                          <p className={`text-lg font-bold ${(user.wallet_balance || 0) > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                            ₹{(user.wallet_balance || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-500/30 hover:bg-green-500/10 h-9 px-3"
                            onClick={() => openTransactionDialog(user, "credit")}
                          >
                            <Plus className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Credit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-500/30 hover:bg-red-500/10 h-9 px-3"
                            onClick={() => openTransactionDialog(user, "debit")}
                          >
                            <Minus className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Debit</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {transactionType === "credit" ? (
                <Plus className="h-5 w-5 text-green-600" />
              ) : (
                <Minus className="h-5 w-5 text-red-600" />
              )}
              {transactionType === "credit" ? "Credit" : "Debit"} Wallet
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name} • Current Balance: ₹{selectedUser?.wallet_balance?.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Reason for transaction..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={transactionType === "credit" ? "default" : "destructive"}
              onClick={handleTransaction}
              disabled={isProcessing || !amount}
              className="gap-2"
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              {transactionType === "credit" ? "Credit" : "Debit"} ₹{amount || "0"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
