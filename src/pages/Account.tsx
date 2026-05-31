import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import AccountInfo from "@/pages/account/AccountInfo";
import AddressManagement from "@/pages/account/AddressManagement";
import PreferencesSection from "@/pages/account/PreferencesSection";
import AccountSettings from "@/pages/account/AccountSettings";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15, "Phone too long").optional().or(z.literal("")),
  address: z.string().max(500, "Address too long").optional().or(z.literal("")),
  business_name: z.string().max(200, "Business name too long").optional().or(z.literal("")),
  gst_number: z.string().max(50, "GST number too long").optional().or(z.literal("")),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Account() {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    business_name: "",
    gst_number: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

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

  const validatePassword = () => {
    try {
      passwordSchema.parse(passwordData);
      setPasswordErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setPasswordErrors(newErrors);
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

    // Validate user ID exists to prevent accidental bulk update (Issue #51)
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID not found. Please log in again.",
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
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Profile Updated",
        description: "Your account details have been saved successfully.",
      });
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile. Please try again.";
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!validatePassword()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // Use updateUser directly - Supabase handles verification in the current session
      // Do NOT use signInWithPassword as it creates a duplicate session (Issue #52)
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        // If error indicates current password is wrong, show appropriate message
        if (error.message.includes("password")) {
          toast({
            title: "Password Update Failed",
            description: error.message || "Please try again.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        setIsChangingPassword(false);
        return;
      }

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: unknown) {
      console.error("Error changing password:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to change password. Please try again.";
      toast({
        title: "Password Change Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const updatePasswordField = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleTogglePassword = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(profile?.referral_code || "");
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard.",
    });
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

          {/* Account Info Card */}
          <AccountInfo profile={profile} user={user} isDealer={isDealer} />

          {/* Profile and Security Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <AddressManagement
                    formData={{
                      full_name: formData.full_name,
                      phone: formData.phone,
                      address: formData.address,
                    }}
                    errors={errors}
                    updateField={updateField}
                    userEmail={user.email || ""}
                  />

                  <PreferencesSection
                    profile={profile}
                    formData={{
                      business_name: formData.business_name,
                      gst_number: formData.gst_number,
                    }}
                    errors={errors}
                    updateField={updateField}
                    isDealer={isDealer}
                    onCopyReferral={handleCopyReferral}
                  />

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
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <AccountSettings
                passwordData={passwordData}
                passwordErrors={passwordErrors}
                showPasswords={showPasswords}
                isChangingPassword={isChangingPassword}
                onPasswordChange={updatePasswordField}
                onTogglePassword={handleTogglePassword}
                onSubmit={handlePasswordChange}
                profile={profile}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}