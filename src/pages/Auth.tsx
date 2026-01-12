import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Building2, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") || "retail";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    businessName: "",
    gstNumber: "",
    referralCode: ""
  });

  const isDealer = userType === "dealer";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This will be connected to Supabase auth
    toast({
      title: isLogin ? "Login Successful!" : "Registration Successful!",
      description: "Redirecting to your dashboard...",
    });
    setTimeout(() => navigate("/quick-order"), 1500);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <ArrowLeft className="h-5 w-5" />
            <img src={logo} alt="GKP Crackers" className="h-10 w-10 rounded-lg" />
            <span className="font-bold text-gradient-hero hidden sm:block">GKP CRACKERS</span>
          </Link>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isDealer ? 'gradient-dealer text-white' : 'bg-primary text-primary-foreground'}`}>
            {isDealer ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
            <span className="font-medium text-sm">{isDealer ? "Dealer Account" : "Retail Account"}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isDealer ? 'gradient-dealer' : 'gradient-hero'}`}>
              {isDealer ? <Building2 className="h-8 w-8 text-white" /> : <User className="h-8 w-8 text-white" />}
            </div>
            <CardTitle className="text-2xl">
              {isDealer ? "Dealer Portal" : "Customer Portal"}
            </CardTitle>
            <CardDescription>
              {isDealer 
                ? "Access wholesale pricing and bulk order features"
                : "Shop our complete range of quality crackers"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit}>
                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email or Phone</Label>
                    <Input
                      id="email"
                      type="text"
                      placeholder="Enter email or phone"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    variant={isDealer ? "dealer" : "hero"} 
                    size="lg" 
                    className="w-full"
                  >
                    Login
                  </Button>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 XXXXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      required
                    />
                  </div>

                  {isDealer && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          placeholder="Your business/shop name"
                          value={formData.businessName}
                          onChange={(e) => updateField("businessName", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                        <Input
                          id="gstNumber"
                          placeholder="Enter GST number"
                          value={formData.gstNumber}
                          onChange={(e) => updateField("gstNumber", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referral">Referral Code (Optional)</Label>
                    <Input
                      id="referral"
                      placeholder="Enter referral code"
                      value={formData.referralCode}
                      onChange={(e) => updateField("referralCode", e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    variant={isDealer ? "dealer" : "hero"} 
                    size="lg" 
                    className="w-full"
                  >
                    Create Account
                  </Button>
                </TabsContent>
              </form>
            </Tabs>

            {/* Switch Account Type */}
            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {isDealer ? "Not a dealer?" : "Are you a dealer?"}
              </p>
              <Link to={isDealer ? "/auth?type=retail" : "/auth?type=dealer"}>
                <Button variant="outline" size="sm" className="gap-2">
                  {isDealer ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                  Switch to {isDealer ? "Retail" : "Dealer"} Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legal Notice */}
      <div className="bg-card border-t border-border py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-3 w-3" />
            This website is for estimation purposes only. No online sale or payment.
            <Sparkles className="h-3 w-3" />
          </p>
        </div>
      </div>
    </div>
  );
}
