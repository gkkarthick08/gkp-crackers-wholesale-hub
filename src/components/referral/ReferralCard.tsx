import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Copy, Share2, Users, Check, Gift, Sparkles, MessageCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export function ReferralCard() {
  const { profile } = useAuth();
  const { settings } = useSiteSettings();
  const [copied, setCopied] = useState(false);

  const referrerBonus = settings.referralBonus;
  const referredBonus = settings.referralBonusReferred;
  const referralCode = profile?.referral_code || "";
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join GKP Crackers!",
          text: `Use my referral code ${referralCode} to sign up and get ₹${referredBonus} bonus! 🎉`,
          url: referralLink,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    } else {
      copyToClipboard(referralLink, "Referral link");
    }
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(
      `🎆 Hey! Join GKP Crackers and get ₹${referredBonus} bonus!\n\nUse my referral code: ${referralCode}\n\nSign up here: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-primary via-accent to-secondary p-5 relative overflow-hidden">
        <div className="absolute top-2 right-2">
          <Sparkles className="h-8 w-8 text-white/20 animate-sparkle" />
        </div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
            <Gift className="h-7 w-7 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-white">Refer & Earn</h3>
            <p className="text-sm text-white/80">Earn ₹{referrerBonus} for each referral!</p>
          </div>
        </div>
      </div>
      
      <CardContent className="space-y-5 pt-5">
        {/* Referral Code Display */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-4 rounded-2xl border border-primary/10">
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Your Referral Code
          </p>
          <div className="flex gap-2">
            <Input
              value={referralCode}
              readOnly
              className="font-mono text-xl font-bold text-center bg-background border-2 border-dashed border-primary/30"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(referralCode, "Referral code")}
              className="shrink-0 h-11 w-11 border-primary/30 hover:bg-primary/10"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5 text-primary" />
              )}
            </Button>
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Share with friends</p>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={shareReferral} 
              variant="outline" 
              className="gap-2 h-12 border-2 hover:bg-muted"
            >
              <Share2 className="h-5 w-5" />
              Share Link
            </Button>
            <Button 
              onClick={shareOnWhatsApp} 
              className="gap-2 h-12 bg-[#25D366] hover:bg-[#128C7E] text-white border-0"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-muted/50 p-4 rounded-2xl">
          <p className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            How it works
          </p>
          <div className="space-y-3">
            {[
              "Share your unique referral code",
              "Friends sign up using your code",
              `You earn ₹${referrerBonus}, they get ₹${referredBonus}!`
            ].map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm text-muted-foreground flex-1">{step}</p>
                {index < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
