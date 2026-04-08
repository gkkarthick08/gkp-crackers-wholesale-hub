import { User, Building2, CheckCircle, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AccountInfoProps {
  profile: any;
  user: any;
  isDealer: boolean;
}

export default function AccountInfo({ profile, user, isDealer }: AccountInfoProps) {
  return (
    <Card className="shadow-card mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isDealer ? "gradient-dealer" : "gradient-hero"
              }`}
            >
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

        {/* Verification Status for Dealers */}
        {isDealer && (
          <div
            className={`mt-4 p-4 rounded-xl ${
              profile?.is_verified
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-amber-500/10 border border-amber-500/20"
            }`}
          >
            <div className="flex items-start gap-3">
              {profile?.is_verified ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      Account Verified Successfully!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Your dealer account is active. Enjoy wholesale prices on all products.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-700 dark:text-amber-400">
                      Account Under Verification
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-500">
                      Your dealer account is being reviewed. You'll receive wholesale pricing once verified.
                      This usually takes 24-48 hours.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Verified badge for non-dealers */}
        {!isDealer && profile?.is_verified && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
            <Shield className="h-4 w-4" />
            <span>Verified Account</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
