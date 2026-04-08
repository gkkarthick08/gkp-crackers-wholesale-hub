import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AccountSettingsProps {
  passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  passwordErrors: Record<string, string>;
  showPasswords: {
    current: boolean;
    new: boolean;
    confirm: boolean;
  };
  isChangingPassword: boolean;
  onPasswordChange: (field: string, value: string) => void;
  onTogglePassword: (field: string) => void;
  onSubmit: () => void;
  profile: any;
}

export default function AccountSettings({
  passwordData,
  passwordErrors,
  showPasswords,
  isChangingPassword,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  profile,
}: AccountSettingsProps) {
  return (
    <>
      <Card className="shadow-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                placeholder="Enter your current password"
                className="pl-10 pr-10"
                value={passwordData.currentPassword}
                onChange={(e) => onPasswordChange("currentPassword", e.target.value)}
              />
              <button
                type="button"
                onClick={() => onTogglePassword("current")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                placeholder="Enter new password (min 6 characters)"
                className="pl-10 pr-10"
                value={passwordData.newPassword}
                onChange={(e) => onPasswordChange("newPassword", e.target.value)}
              />
              <button
                type="button"
                onClick={() => onTogglePassword("new")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                placeholder="Confirm your new password"
                className="pl-10 pr-10"
                value={passwordData.confirmPassword}
                onChange={(e) => onPasswordChange("confirmPassword", e.target.value)}
              />
              <button
                type="button"
                onClick={() => onTogglePassword("confirm")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          {/* Change Password Button */}
          <div className="pt-4">
            <Button
              variant="hero"
              size="lg"
              className="w-full gap-2"
              onClick={onSubmit}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </div>

          {/* Security Tips */}
          <div className="bg-muted/50 rounded-xl p-4 mt-6">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Password Tips
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use at least 6 characters</li>
              <li>• Mix letters, numbers, and symbols</li>
              <li>• Avoid using personal information</li>
              <li>• Don't reuse passwords from other sites</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <div className="grid grid-cols-2 gap-4">
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
    </>
  );
}
