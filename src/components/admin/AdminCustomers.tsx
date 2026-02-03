import { useEffect, useState } from "react";
import { Search, Loader2, User, Building2, CheckCircle, Clock, Shield, Phone, Mail, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  user_type: "dealer" | "retail";
  business_name: string | null;
  gst_number: string | null;
  address: string | null;
  referral_code: string | null;
  wallet_balance: number;
  is_verified: boolean;
  created_at: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers((data as Customer[]) || []);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const toggleVerify = async (id: string, value: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: value })
      .eq("id", id);

    if (error) {
      toast({
        title: "Permission denied",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: value ? "Dealer verified successfully!" : "Verification removed",
        description: value ? "The dealer can now access wholesale prices." : undefined,
      });
      fetchCustomers();
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(prev => prev ? { ...prev, is_verified: value } : null);
      }
    }
  };

  const changeUserType = async (id: string, newType: "dealer" | "retail") => {
    const { error } = await supabase
      .from("profiles")
      .update({ 
        user_type: newType,
        is_verified: newType === "retail" ? false : false // Reset verification when changing type
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error changing user type",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "User type updated",
        description: `Customer is now a ${newType}${newType === "dealer" ? " (pending verification)" : ""}`,
      });
      fetchCustomers();
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(prev => prev ? { ...prev, user_type: newType, is_verified: false } : null);
      }
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (customer.phone?.includes(searchQuery) ?? false) ||
      (customer.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesType = typeFilter === "all" || customer.user_type === typeFilter;
    
    const matchesVerification = 
      verificationFilter === "all" || 
      (verificationFilter === "verified" && customer.is_verified) ||
      (verificationFilter === "pending" && !customer.is_verified);

    return matchesSearch && matchesType && matchesVerification;
  });

  const dealerCount = customers.filter((c) => c.user_type === "dealer").length;
  const retailCount = customers.filter((c) => c.user_type === "retail").length;
  const pendingDealers = customers.filter((c) => c.user_type === "dealer" && !c.is_verified).length;

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Customers</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your customer database and dealer verifications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{customers.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-lg bg-dealer/10">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-dealer" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{dealerCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Dealers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{retailCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Retail</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={pendingDealers > 0 ? "border-yellow-500/50 bg-yellow-50/50" : ""}>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{pendingDealers}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Dealers Alert */}
      {pendingDealers > 0 && (
        <Card className="mb-6 border-yellow-500/50 bg-yellow-50">
          <CardContent className="py-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <Shield className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-semibold text-yellow-800">
                    {pendingDealers} Dealer{pendingDealers > 1 ? 's' : ''} Awaiting Verification
                  </p>
                  <p className="text-sm text-yellow-700">
                    Review and verify dealer accounts to enable wholesale access
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="sm:ml-auto border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                onClick={() => setVerificationFilter("pending")}
              >
                View Pending
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[130px] h-10">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dealer">Dealers</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-full sm:w-[130px] h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No customers found
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((c) => (
            <Card 
              key={c.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedCustomer(c)}
            >
              <CardContent className="py-4 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{c.full_name || "No name"}</p>
                      <Badge
                        variant="outline"
                        className={c.user_type === "dealer" ? "gradient-dealer text-white text-[10px]" : "text-[10px]"}
                      >
                        {c.user_type}
                      </Badge>
                    </div>
                    {c.business_name && (
                      <p className="text-xs text-muted-foreground mb-1">{c.business_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{c.email || c.phone || "-"}</p>
                  </div>
                  <div className="text-right">
                    {c.user_type === "dealer" && (
                      <Badge 
                        className={c.is_verified ? "bg-green-600 text-white" : "bg-yellow-500 text-white"}
                      >
                        {c.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    )}
                    <p className="text-sm font-semibold mt-1">₹{c.wallet_balance}</p>
                  </div>
                </div>
                {c.user_type === "dealer" && !c.is_verified && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Verify Dealer</span>
                      <Switch
                        checked={c.is_verified}
                        onCheckedChange={(val) => {
                          toggleVerify(c.id, val);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden sm:block">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Customers ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verify</TableHead>
                  <TableHead className="text-right">Wallet</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((c) => (
                    <TableRow 
                      key={c.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{c.full_name || "-"}</p>
                          {c.business_name && (
                            <p className="text-xs text-muted-foreground">{c.business_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{c.email || "-"}</p>
                          <p className="text-muted-foreground">{c.phone || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={c.user_type === "dealer" ? "gradient-dealer text-white" : ""}
                        >
                          {c.user_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {c.user_type === "dealer" ? (
                          c.is_verified ? (
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {c.user_type === "dealer" ? (
                          <Switch
                            checked={c.is_verified}
                            onCheckedChange={(val) => toggleVerify(c.id, val)}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{c.wallet_balance}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View and manage customer information
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  {selectedCustomer.user_type === "dealer" ? (
                    <Building2 className="h-7 w-7 text-dealer" />
                  ) : (
                    <User className="h-7 w-7 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedCustomer.full_name || "No name"}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={selectedCustomer.user_type === "dealer" ? "gradient-dealer text-white" : ""}>
                      {selectedCustomer.user_type}
                    </Badge>
                    {selectedCustomer.user_type === "dealer" && (
                      <Badge className={selectedCustomer.is_verified ? "bg-green-600" : "bg-yellow-500"}>
                        {selectedCustomer.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-4 bg-muted/50 rounded-lg">
                {selectedCustomer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedCustomer.email}</span>
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedCustomer.phone}</span>
                  </div>
                )}
                {selectedCustomer.business_name && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedCustomer.business_name}</span>
                  </div>
                )}
                {selectedCustomer.gst_number && (
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">GST: {selectedCustomer.gst_number}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-2xl font-bold text-primary">₹{selectedCustomer.wallet_balance}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedCustomer.created_at), "dd MMM yyyy")}
                  </p>
                </div>
              </div>

              {/* User Type Change */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Change Customer Type
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Switch between retail and dealer account
                    </p>
                  </div>
                  <Select
                    value={selectedCustomer.user_type}
                    onValueChange={(val: "dealer" | "retail") => changeUserType(selectedCustomer.id, val)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="dealer">Dealer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedCustomer.user_type === "dealer" && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dealer Verification</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedCustomer.is_verified 
                          ? "This dealer is verified and has access to wholesale prices"
                          : "Verify this dealer to enable wholesale access"
                        }
                      </p>
                    </div>
                    <Switch
                      checked={selectedCustomer.is_verified}
                      onCheckedChange={(val) => toggleVerify(selectedCustomer.id, val)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
