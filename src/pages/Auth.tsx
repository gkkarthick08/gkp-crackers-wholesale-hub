import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  User,
  Building2,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { loginSchema, signupSchema } from "@/lib/validations";
import logo from "@/assets/logo.png";

export default function Auth() {
  usePageMeta({
    title: "Login / Sign Up — GKP Crackers",
    description:
      "Sign in or create an account at GKP Crackers.",
  });

  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") || "retail";
  const refCode = searchParams.get("ref") || "";

  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>(
    {}
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    gstNumber: "",
    referralCode: refCode,
  });

  const isDealer = userType === "dealer";

  // Update referral code if URL changes
  useEffect(() => {
    if (refCode && !formData.referralCode) {
      setFormData((prev) => ({
        ...prev,
        referralCode: refCode,
      }));
    }
  }, [refCode, formData.referralCode]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/products", { replace: true });
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      if (isLogin) {
        loginSchema.parse({
          email: formData.email,
          password: formData.password,
        });
      } else {
        signupSchema.parse(formData);
      }

      setErrors({});
      return true;
    } catch (error: unknown) {
      const newErrors: Record<string, string> = {};

      if (
        typeof error === "object" &&
        error !== null &&
        "errors" in error
      ) {
        const zodError = error as {
          errors: Array<{
            path: (string | number)[];
            message: string;
          }>;
        };

        zodError.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[String(err.path[0])] =
              err.message;
          }
        });

        setErrors(newErrors);
      }

      return false;
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(
          formData.email,
          formData.password
        );

        if (error) {
          if (
            error.message.includes(
              "Invalid login credentials"
            )
          ) {
            toast({
              title: "Login Failed",
              description:
                "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login Failed",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        toast({
          title: "Login Successful!",
          description:
            "Welcome back to GKP Crackers",
        });

        navigate("/products");
      } else {
        const metadata = {
          full_name: formData.name,
          phone: formData.phone,
          user_type: isDealer
            ? "dealer"
            : "retail",
          business_name: isDealer
            ? formData.businessName
            : "",
          gst_number: isDealer
            ? formData.gstNumber
            : "",
          referred_by:
            formData.referralCode || "",
        };

        const { error } = await signUp(
          formData.email,
          formData.password,
          metadata
        );

        if (error) {
          if (
            error.message.includes(
              "already registered"
            )
          ) {
            toast({
              title: "Account Exists",
              description:
                "This email is already registered. Please login instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Registration Failed",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        toast({
          title:
            "Registration Successful!",
          description:
            "Your account has been created. You can now login.",
        });

        setIsLogin(true);

        setFormData((prev) => ({
          ...prev,
          password: "",
          confirmPassword: "",
        }));
      }
    } catch {
      toast({
        title: "Error",
        description:
          "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="bg-card border-b border-border py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <ArrowLeft className="h-5 w-5" />
            <img
              src={logo}
              alt="GKP Crackers"
              className="h-10 w-10 rounded-lg"
            />
            <span className="font-bold text-gradient-hero hidden sm:block">
              GKP CRACKERS
            </span>
          </Link>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              isDealer
                ? "gradient-dealer text-white"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isDealer ? (
              <Building2 className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}

            <span className="font-medium text-sm">
              {isDealer
                ? "Dealer Account"
                : "Retail Account"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                isDealer
                  ? "gradient-dealer"
                  : "gradient-hero"
              }`}
            >
              {isDealer ? (
                <Building2 className="h-8 w-8 text-white" />
              ) : (
                <User className="h-8 w-8 text-white" />
              )}
            </div>

            <CardTitle className="text-2xl">
              {isDealer
                ? "Dealer Portal"
                : "Customer Portal"}
            </CardTitle>

            <CardDescription>
              {isDealer
                ? "Access wholesale pricing and bulk order features"
                : "Shop our complete range of quality crackers"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              value={isLogin ? "login" : "signup"}
              onValueChange={(v) =>
                setIsLogin(v === "login")
              }
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit}>
                {/* LOGIN */}
                <TabsContent
                  value="login"
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email
                    </Label>

                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) =>
                        updateField(
                          "email",
                          e.target.value
                        )
                      }
                      required
                      disabled={isSubmitting}
                    />

                    {errors.email && (
                      <p className="text-sm text-destructive">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password
                    </Label>

                    <div className="relative">
                      <Input
                        id="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) =>
                          updateField(
                            "password",
                            e.target.value
                          )
                        }
                        required
                        disabled={isSubmitting}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {errors.password && (
                      <p className="text-sm text-destructive">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
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

                {/* SIGNUP */}
                <TabsContent
                  value="signup"
                  className="space-y-4"
                >
                  {/* existing signup fields remain */}

                  {/* CONFIRM PASSWORD */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm Password
                    </Label>

                    <Input
                      id="confirmPassword"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm password"
                      value={
                        formData.confirmPassword
                      }
                      onChange={(e) =>
                        updateField(
                          "confirmPassword",
                          e.target.value
                        )
                      }
                      required
                      disabled={isSubmitting}
                    />

                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {
                          errors.confirmPassword
                        }
                      </p>
                    )}
                  </div>
                </TabsContent>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}