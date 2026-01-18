import { useEffect, useState } from "react";
import { 
  Settings, 
  Store, 
  Bell, 
  Palette, 
  Shield, 
  Loader2, 
  Save,
  Phone,
  MapPin,
  Mail,
  Clock,
  Globe,
  Percent
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SiteSettings {
  storeName: string;
  storeTagline: string;
  storeEmail: string;
  storePhone: string;
  storeWhatsApp: string;
  storeAddress: string;
  storeTimings: string;
  minOrderValue: number;
  minOrderValueDealer: number;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  dealerDiscount: number;
  retailDiscount: number;
  referralBonus: number;
  referralBonusReferred: number;
  enableNotifications: boolean;
  enableReferrals: boolean;
  enableWallet: boolean;
  maintenanceMode: boolean;
}

const defaultSettings: SiteSettings = {
  storeName: "GKP Crackers",
  storeTagline: "Premium Crackers at Best Prices",
  storeEmail: "info@gkpcrackers.com",
  storePhone: "+91 98765 43210",
  storeWhatsApp: "+91 98765 43210",
  storeAddress: "123 Main Street, Chennai, Tamil Nadu 600001",
  storeTimings: "9:00 AM - 9:00 PM",
  minOrderValue: 500,
  minOrderValueDealer: 1000,
  deliveryCharge: 50,
  freeDeliveryAbove: 2000,
  dealerDiscount: 10,
  retailDiscount: 5,
  referralBonus: 50,
  referralBonusReferred: 25,
  enableNotifications: true,
  enableReferrals: true,
  enableWallet: true,
  maintenanceMode: false,
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value");

        if (error) throw error;

        if (data && data.length > 0) {
          const loadedSettings: Partial<SiteSettings> = {};
          data.forEach((item) => {
            if (item.key in defaultSettings) {
              (loadedSettings as any)[item.key] = item.value;
            }
          });
          setSettings({ ...defaultSettings, ...loadedSettings });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save each setting individually using upsert
      const settingsEntries = Object.entries(settings);
      
      for (const [key, value] of settingsEntries) {
        const { error } = await supabase
          .from("site_settings")
          .upsert(
            { key, value: value as any, updated_at: new Date().toISOString() },
            { onConflict: "key" }
          );

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof SiteSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your store configuration</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="store" className="gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Store</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Pricing</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Store Settings */}
        <TabsContent value="store">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Information
                </CardTitle>
                <CardDescription>Basic store details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={settings.storeName}
                    onChange={(e) => updateSetting("storeName", e.target.value)}
                    placeholder="Your store name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeTagline">Tagline</Label>
                  <Input
                    id="storeTagline"
                    value={settings.storeTagline}
                    onChange={(e) => updateSetting("storeTagline", e.target.value)}
                    placeholder="Store tagline"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeTimings" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Store Timings
                  </Label>
                  <Input
                    id="storeTimings"
                    value={settings.storeTimings}
                    onChange={(e) => updateSetting("storeTimings", e.target.value)}
                    placeholder="9:00 AM - 9:00 PM"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Details
                </CardTitle>
                <CardDescription>How customers can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    value={settings.storeEmail}
                    onChange={(e) => updateSetting("storeEmail", e.target.value)}
                    placeholder="store@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Phone</Label>
                  <Input
                    id="storePhone"
                    value={settings.storePhone}
                    onChange={(e) => updateSetting("storePhone", e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeWhatsApp">WhatsApp</Label>
                  <Input
                    id="storeWhatsApp"
                    value={settings.storeWhatsApp}
                    onChange={(e) => updateSetting("storeWhatsApp", e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeAddress" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Textarea
                    id="storeAddress"
                    value={settings.storeAddress}
                    onChange={(e) => updateSetting("storeAddress", e.target.value)}
                    placeholder="Store address"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pricing Settings */}
        <TabsContent value="pricing">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Order Settings
                </CardTitle>
                <CardDescription>Minimum order and delivery charges</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="minOrderValue">Min Order - Retail (₹)</Label>
                  <Input
                    id="minOrderValue"
                    type="number"
                    value={settings.minOrderValue}
                    onChange={(e) => updateSetting("minOrderValue", parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minOrderValueDealer">Min Order - Dealer (₹)</Label>
                  <Input
                    id="minOrderValueDealer"
                    type="number"
                    value={settings.minOrderValueDealer}
                    onChange={(e) => updateSetting("minOrderValueDealer", parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryCharge">Delivery Charge (₹)</Label>
                  <Input
                    id="deliveryCharge"
                    type="number"
                    value={settings.deliveryCharge}
                    onChange={(e) => updateSetting("deliveryCharge", parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freeDeliveryAbove">Free Delivery Above (₹)</Label>
                  <Input
                    id="freeDeliveryAbove"
                    type="number"
                    value={settings.freeDeliveryAbove}
                    onChange={(e) => updateSetting("freeDeliveryAbove", parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Discount & Referral
                </CardTitle>
                <CardDescription>Configure discounts and referral bonuses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dealerDiscount">Dealer Discount (%)</Label>
                  <Input
                    id="dealerDiscount"
                    type="number"
                    value={settings.dealerDiscount}
                    onChange={(e) => updateSetting("dealerDiscount", parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retailDiscount">Retail Discount (%)</Label>
                  <Input
                    id="retailDiscount"
                    type="number"
                    value={settings.retailDiscount}
                    onChange={(e) => updateSetting("retailDiscount", parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referralBonus">Referral Bonus - Referrer (₹)</Label>
                  <Input
                    id="referralBonus"
                    type="number"
                    value={settings.referralBonus}
                    onChange={(e) => updateSetting("referralBonus", parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referralBonusReferred">Referral Bonus - Referred User (₹)</Label>
                  <Input
                    id="referralBonusReferred"
                    type="number"
                    value={settings.referralBonusReferred}
                    onChange={(e) => updateSetting("referralBonusReferred", parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Feature Toggles
              </CardTitle>
              <CardDescription>Enable or disable store features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable push notifications and announcements
                  </p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => updateSetting("enableNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Referral System</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to refer friends and earn bonuses
                  </p>
                </div>
                <Switch
                  checked={settings.enableReferrals}
                  onCheckedChange={(checked) => updateSetting("enableReferrals", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Wallet System</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable wallet balance for customers
                  </p>
                </div>
                <Switch
                  checked={settings.enableWallet}
                  onCheckedChange={(checked) => updateSetting("enableWallet", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Maintenance
              </CardTitle>
              <CardDescription>Critical security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium text-destructive">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, only admins can access the store
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
                />
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Security Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Regularly review admin access logs</li>
                  <li>• Keep referral bonuses at reasonable levels</li>
                  <li>• Monitor wallet transactions for anomalies</li>
                  <li>• Enable maintenance mode during updates</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
