import { User, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddressManagementProps {
  formData: {
    full_name: string;
    phone: string;
    address: string;
  };
  errors: Record<string, string>;
  updateField: (field: string, value: string) => void;
  userEmail: string;
}

export default function AddressManagement({
  formData,
  errors,
  updateField,
  userEmail,
}: AddressManagementProps) {
  return (
    <div className="space-y-6">
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
            value={userEmail}
            className="pl-10 bg-muted"
            disabled
          />
        </div>
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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
    </div>
  );
}
