import { Building2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PreferencesSectionProps {
  profile: any;
  formData: {
    business_name: string;
    gst_number: string;
  };
  errors: Record<string, string>;
  updateField: (field: string, value: string) => void;
  isDealer: boolean;
  onCopyReferral: () => void;
}

export default function PreferencesSection({
  profile,
  formData,
  errors,
  updateField,
  isDealer,
  onCopyReferral,
}: PreferencesSectionProps) {
  return (
    <>
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
            <Button variant="outline" onClick={onCopyReferral}>
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this code with friends to earn wallet bonuses
          </p>
        </div>
      )}
    </>
  );
}
