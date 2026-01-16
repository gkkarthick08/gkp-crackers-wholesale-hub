import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, MapPin, Building2, FileText, Save, Loader2, Shield } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15, "Phone too long").optional().or(z.literal("")),
  address: z.string().max(500, "Address too long").optional().or(z.literal("")),
  business_name: z.string().max(200, "Business name too long").optional().or(z.literal("")),
  gst_number: z.string().max(50, "GST number too long").optional().or(z.literal("")),
});

export default function Account() {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    business_name: "",
    gst_number: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        business_name: profile.business_name || "",
        gst_number: profile.gst_number || "",
      });
    }
  }, [profile]);

  const validateForm = () => {
    try {
      profileSchema.parse(formData);
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

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          address: formData.address || null,
          business_name: formData.business_name || null,
          gst_number: formData.gst_number || null,
        })
        .eq("id", user?.id);

      if (error) throw error;

      await refreshProfile();
      
      toast({
        title: "Profile Updated",
        description: "Your account details have been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isDealer = profile?.user_type === "dealer";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground">
              Manage your profile and account settings
            </p>
          </div>

          {/* Account Type Badge */}
          <Card className="shadow-card mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    isDealer ? "gradient-dealer" : "gradient-hero"
                  }`}>
                    {isDealer ? (
                      <Building2 className="h-7 w-7 text-white" />
                    ) : (
                      <User className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">{profile?.full_name}</h2>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Badge 
                  variant={isDealer ? "secondary" : "default"}
                  className={`${isDealer ? "bg-dealer/10 text-dealer border-dealer/20" : ""}`}
                >
                  {isDealer ? "Dealer Account" : "Retail Account"}
                </Badge>
              </div>
              
              {profile?.is_verified && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                  <Shield className="h-4 w-4" />
                  <span>Verified Account</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    placeholder="Enter your full name"
                    className="pl-10"
                    value={formData.full_name}
                    onChange={(e) => updateField("full_name", e.target.value)}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name}</p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user.email || ""}
                    className="pl-10 bg-muted"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 XXXXXXXXXX"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    placeholder="Enter your complete address"
                    className="pl-10 min-h-[100px]"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                  />
                </div>
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address}</p>
                )}
              </div>

              {/* Business Details (Dealer only) */}
              {isDealer && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-dealer" />
                      Business Details
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="business_name"
                        placeholder="Your business/shop name"
                        className="pl-10"
                        value={formData.business_name}
                        onChange={(e) => updateField("business_name", e.target.value)}
                      />
                    </div>
                    {errors.business_name && (
                      <p className="text-sm text-destructive">{errors.business_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gst_number">GST Number</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="gst_number"
                        placeholder="Enter GST number"
                        className="pl-10"
                        value={formData.gst_number}
                        onChange={(e) => updateField("gst_number", e.target.value)}
                      />
                    </div>
                    {errors.gst_number && (
                      <p className="text-sm text-destructive">{errors.gst_number}</p>
                    )}
                  </div>
                </>
              )}

              {/* Referral Code (Read-only) */}
              {profile?.referral_code && (
                <div className="space-y-2 border-t pt-6">
                  <Label>Your Referral Code</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={profile.referral_code}
                      className="bg-muted font-mono"
                      disabled
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(profile.referral_code || "");
                        toast({
                          title: "Copied!",
                          description: "Referral code copied to clipboard.",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this code with friends to earn wallet bonuses
                  </p>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-4">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card className="shadow-card">
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-primary">
                  ₹{(profile?.wallet_balance || 0).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile?.referral_code || "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">Referral Code</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}