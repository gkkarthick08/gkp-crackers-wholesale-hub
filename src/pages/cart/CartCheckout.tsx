import { Link } from "react-router-dom";
import { User, Phone, MapPin, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

interface CartCheckoutProps {
  customerDetails: CustomerDetails;
  fieldErrors: Record<string, string>;
  onCustomerDetailsChange: (field: string, value: string) => void;
  isSubmitting: boolean;
  user: any;
  isMinOrderMet: boolean;
  onPlaceOrder: () => void;
  onSendToWhatsApp: () => void;
}

export default function CartCheckout({
  customerDetails,
  fieldErrors,
  onCustomerDetailsChange,
  isSubmitting,
  user,
  isMinOrderMet,
  onPlaceOrder,
  onSendToWhatsApp,
}: CartCheckoutProps) {
  return (
    <>
      {/* Customer Details */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Your Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              maxLength={100}
              value={customerDetails.name}
              onChange={(e) => onCustomerDetailsChange("name", e.target.value)}
              className={fieldErrors.name ? "border-destructive" : ""}
            />
            {fieldErrors.name && (
              <p className="text-sm text-destructive">{fieldErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="+91 XXXXXXXXXX"
                className={`pl-10 ${fieldErrors.phone ? "border-destructive" : ""}`}
                maxLength={15}
                value={customerDetails.phone}
                onChange={(e) => onCustomerDetailsChange("phone", e.target.value)}
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-sm text-destructive">{fieldErrors.phone}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="address"
                placeholder="Enter complete address"
                className={`pl-10 min-h-[80px] ${fieldErrors.address ? "border-destructive" : ""}`}
                maxLength={500}
                value={customerDetails.address}
                onChange={(e) => onCustomerDetailsChange("address", e.target.value)}
              />
            </div>
            {fieldErrors.address && (
              <p className="text-sm text-destructive">{fieldErrors.address}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions..."
              maxLength={1000}
              value={customerDetails.notes}
              onChange={(e) => onCustomerDetailsChange("notes", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        {user ? (
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={onPlaceOrder}
            disabled={isSubmitting || !isMinOrderMet}
          >
            {isSubmitting ? "Submitting Estimate..." : "Submit Order Estimate"}
          </Button>
        ) : (
          <Link to="/auth" className="block">
            <Button variant="hero" size="lg" className="w-full">
              Login to Submit Estimate
            </Button>
          </Link>
        )}

        <Button
          variant="whatsapp"
          size="lg"
          className="w-full gap-2"
          onClick={onSendToWhatsApp}
          disabled={!isMinOrderMet}
        >
          <Send className="h-5 w-5" />
          Send via WhatsApp
        </Button>
      </div>
    </>
  );
}
