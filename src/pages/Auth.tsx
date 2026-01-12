import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Building2, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import { z } from "zod";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number").max(15),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  referralCode: z.string().optional(),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") || "retail";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  // Redirect if already logged in
  if (user) {
    navigate("/quick-order");
    return null;
  }

  const validateForm = () => {
    try {
      if (isLogin) {
        loginSchema.parse({ email: formData.email, password: formData.password });
      } else {
        signupSchema.parse(formData);
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Login Failed",
              description: error.message,
              variant: "destructive"
            });
          }
          return;
        }
        
        toast({
          title: "Login Successful!",
          description: "Welcome back to GKP Crackers",
        });
        navigate("/quick-order");
      } else {
        const metadata = {
          full_name: formData.name,
          phone: formData.phone,
          user_type: isDealer ? "dealer" : "retail",
          business_name: isDealer ? formData.businessName : "",
          referred_by: formData.referralCode || "",
        };

        const { error } = await signUp(formData.email, formData.password, metadata);
        
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please login instead.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Registration Failed",
              description: error.message,
              variant: "destructive"
            });
          }
          return;
        }
        
        toast({
          title: "Registration Successful!",
          description: "Your account has been created. You can now login.",
        });
        setIsLogin(true);
        setFormData(prev => ({ ...prev, password: "" }));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
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
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  <Button 
                    type="submit" 
                    variant={isDealer ? "dealer" : "hero"} 
                    size="lg" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
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
                      disabled={isSubmitting}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
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
                      disabled={isSubmitting}
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
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
                      disabled={isSubmitting}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
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
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                        <Input
                          id="gstNumber"
                          placeholder="Enter GST number"
                          value={formData.gstNumber}
                          onChange={(e) => updateField("gstNumber", e.target.value)}
                          disabled={isSubmitting}
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
                        placeholder="Create a password (min 6 chars)"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referral">Referral Code (Optional)</Label>
                    <Input
                      id="referral"
                      placeholder="Enter referral code"
                      value={formData.referralCode}
                      onChange={(e) => updateField("referralCode", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    variant={isDealer ? "dealer" : "hero"} 
                    size="lg" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
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
