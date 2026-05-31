import { useEffect, useState } from "react";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  Loader2, Save, Receipt, Store, FileText, Ruler, Percent
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface POSSettings {
  posStoreName: string;
  posGstNumber: string;
  posAddress: string;
  posPhone: string;
  posLogoUrl: string;
  posBillSize: "58mm" | "80mm";
  posFooterText: string;
  posTermsText: string;
  posShowLogo: boolean;
  posShowGst: boolean;
  posDefaultPackingPercent: number;
}

export const defaultPOSSettings: POSSettings = {
  posStoreName: "GKP Crackers",
  posGstNumber: "",
  posAddress: "",
  posPhone: "",
  posLogoUrl: "",
  posBillSize: "80mm",
  posFooterText: "Thank you for your purchase! 🎉",
  posTermsText: "Goods once sold will not be returned. Handle crackers with care.",
  posShowLogo: true,
  posShowGst: true,
  posDefaultPackingPercent: 0,
};

export function usePOSSettings() {
  const [settings, setSettings] = useState<POSSettings>(defaultPOSSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("key, value")
          .like("key", "pos%");
        if (data && data.length > 0) {
          const loaded: Record<string, unknown> = {};
          data.forEach((item) => {
            if (item.key in defaultPOSSettings) {
              loaded[item.key] = item.value;
            }
          });
          setSettings((prev) => ({ ...prev, ...(loaded as Partial<POSSettings>) }));

        }
      } catch (err) {
        console.error("Error fetching POS settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return { settings, isLoading };
}

export default function AdminPOSSettings() {
  const [settings, setSettings] = useState<POSSettings>(defaultPOSSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("key, value")
          .like("key", "pos%");
        if (data && data.length > 0) {
          const loaded: Partial<POSSettings> = {};
          data.forEach((item) => {
            if (item.key in defaultPOSSettings) {
              const key = item.key as keyof POSSettings;
              loaded[key] = item.value as POSSettings[typeof key];
            }
          });
          setSettings((prev) => ({ ...prev, ...loaded }));
        }
      } catch (err) {
        console.error("Error fetching POS settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const settingKey = key as keyof POSSettings;
        const { error } = await supabase
          .from("site_settings")
          .upsert(
            { key: settingKey, value: value as Json, updated_at: new Date().toISOString() },
            { onConflict: "key" }
          );
        if (error) throw error;
      }
      toast({ title: "POS Settings saved", description: "Changes applied to all future bills." });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const update = (key: keyof POSSettings, value: POSSettings[keyof POSSettings]) => {
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
          <h1 className="text-3xl font-bold mb-2">POS Settings</h1>
          <p className="text-muted-foreground">Configure your POS billing preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Business Details
            </CardTitle>
            <CardDescription>Shown on printed bills</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name on Bill</Label>
              <Input value={settings.posStoreName} onChange={(e) => update("posStoreName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input value={settings.posGstNumber} onChange={(e) => update("posGstNumber", e.target.value)} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div className="space-y-2">
              <Label>Store Address</Label>
              <Textarea value={settings.posAddress} onChange={(e) => update("posAddress", e.target.value)} rows={2} placeholder="Full store address for bill" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={settings.posPhone} onChange={(e) => update("posPhone", e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={settings.posLogoUrl} onChange={(e) => update("posLogoUrl", e.target.value)} placeholder="https://... or leave empty" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Logo on Bill</Label>
              <Switch checked={settings.posShowLogo} onCheckedChange={(v) => update("posShowLogo", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show GST on Bill</Label>
              <Switch checked={settings.posShowGst} onCheckedChange={(v) => update("posShowGst", v)} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Bill Format
            </CardTitle>
            <CardDescription>Layout and content settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Ruler className="h-4 w-4" />Paper Size</Label>
              <Select value={settings.posBillSize} onValueChange={(v) => update("posBillSize", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (Small Thermal)</SelectItem>
                  <SelectItem value="80mm">80mm (Standard Thermal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Percent className="h-4 w-4" />Default Packing Charge %</Label>
              <Input type="number" min={0} max={100} value={settings.posDefaultPackingPercent || ""}
                onChange={(e) => update("posDefaultPackingPercent", Number(e.target.value) || 0)} placeholder="0" />
              <p className="text-xs text-muted-foreground">Auto-applied when creating new bills</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><FileText className="h-4 w-4" />Footer Message</Label>
              <Input value={settings.posFooterText} onChange={(e) => update("posFooterText", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea value={settings.posTermsText} onChange={(e) => update("posTermsText", e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
