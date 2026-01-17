import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Share2, Users, Check, Gift, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export function ReferralCard() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

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
          text: `Use my referral code ${referralCode} to sign up and get ₹25 bonus! 🎉`,
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
      `🎆 Hey! Join GKP Crackers and get ₹25 bonus!\n\nUse my referral code: ${referralCode}\n\nSign up here: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Refer & Earn</h3>
            <p className="text-sm text-muted-foreground">Earn ₹50 for each referral!</p>
          </div>
        </div>
      </div>
      
      <CardContent className="space-y-4 pt-4">
        {/* Referral Code */}
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Your Referral Code
          </p>
          <div className="flex gap-2">
            <Input
              value={referralCode}
              readOnly
              className="font-mono text-xl font-bold text-center bg-background"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(referralCode, "Referral code")}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Share with friends</p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={shareReferral} variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share Link
            </Button>
            <Button onClick={shareOnWhatsApp} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-muted/50 p-4 rounded-xl">
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            How it works
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <p className="text-sm text-muted-foreground">
                Share your unique referral code with friends
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <p className="text-sm text-muted-foreground">
                They sign up using your code
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                3
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">You earn ₹50</span> and they get <span className="text-foreground font-medium">₹25</span>!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
