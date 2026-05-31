import { useEffect, useState } from "react";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type SiteSettingsValue = string | number | boolean | null;

export interface SiteSettings {
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
  countdownEnabled: boolean;
  countdownTitle: string;
  countdownTargetDate: string;
}

export const defaultSiteSettings: SiteSettings = {
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
  countdownEnabled: true,
  countdownTitle: "🎆 DIWALI SALE - Special Prices Ending Soon!",
  countdownTargetDate: new Date(new Date().getFullYear(), 10, 1).toISOString().split("T")[0],
};

const parseValue = (value: SiteSettingsValue, defaultValue: SiteSettingsValue): SiteSettingsValue => {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof defaultValue === "boolean") {
    if (typeof value === "boolean") return value;
    return value === "true" || value === "1";
  }

  if (typeof defaultValue === "number") {
    if (typeof value === "number") return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  return String(value);
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("site_settings")
          .select("key, value");

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          const loaded: Partial<SiteSettings> = {};
          data.forEach((item) => {
            const key = item.key as keyof SiteSettings;
            if (key in defaultSiteSettings) {
              (loaded as Record<string, unknown>)[key] = parseValue(item.value as SiteSettingsValue, defaultSiteSettings[key]);
            }
          });
          setSettings({ ...defaultSiteSettings, ...loaded });
        }
      } catch (fetchError: unknown) {
        setError(fetchError instanceof Error ? fetchError : new Error("Failed to load site settings"));
        console.error("useSiteSettings error:", fetchError);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, isLoading, error };
}

export const normalizePhoneNumber = (value: string) => {
  return String(value || "").replace(/[^0-9]/g, "");
};

export const formatTelLink = (phone: string) => {
  const digits = normalizePhoneNumber(phone);
  return digits ? `tel:+${digits}` : "";
};

export const formatWhatsAppUrl = (phone: string, text?: string) => {
  const digits = normalizePhoneNumber(phone);
  if (!digits) return "";
  const encodedText = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${encodedText}`;
};
