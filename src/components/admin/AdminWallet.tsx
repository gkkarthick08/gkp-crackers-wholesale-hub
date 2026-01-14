import { useEffect, useState } from "react";
import { Search, Plus, Minus, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Wallet Management</h1>
          <p className="text-muted-foreground">Credit or debit user wallets</p>
        </div>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="py-4 px-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-bold text-primary">₹{totalWalletBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-card mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Wallet Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{user.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={user.user_type === "dealer" ? "secondary" : "outline"}>
                        {user.user_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{(user.wallet_balance || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => openTransactionDialog(user, "credit")}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Credit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => openTransactionDialog(user, "debit")}
                        >
                          <Minus className="h-4 w-4 mr-1" />
                          Debit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionType === "credit" ? "Credit" : "Debit"} Wallet
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name} - Current Balance: ₹{selectedUser?.wallet_balance?.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Reason for transaction..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={transactionType === "credit" ? "default" : "destructive"}
              onClick={handleTransaction}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {transactionType === "credit" ? "Credit" : "Debit"} ₹{amount || "0"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
