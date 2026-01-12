import { Link } from "react-router-dom";
import { User, Building2, ArrowRight, BadgePercent, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginOptions() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Choose Your <span className="text-gradient-hero">Account Type</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Login or register to access special pricing and features. Dealers get exclusive wholesale rates!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Retail Customer Card */}
          <Card className="relative overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-festive group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Retail Customer</CardTitle>
              <CardDescription className="text-base">
                For individual customers and small quantity orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <BadgePercent className="h-5 w-5 text-primary" />
                  Regular retail pricing
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Gift className="h-5 w-5 text-primary" />
                  Festival discounts & offers
                </li>
              </ul>
              <Link to="/auth?type=retail">
                <Button variant="retail" size="lg" className="w-full gap-2">
                  Continue as Retail
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Dealer Card */}
          <Card className="relative overflow-hidden border-2 border-dealer/20 hover:border-dealer/50 transition-all duration-300 hover:shadow-lg group bg-gradient-to-br from-card to-dealer/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-dealer/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-dealer text-dealer-foreground text-xs font-bold">
              WHOLESALE
            </div>
            <CardHeader className="relative">
              <div className="w-16 h-16 rounded-2xl gradient-dealer flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Dealer / Wholesaler</CardTitle>
              <CardDescription className="text-base">
                For bulk orders and business customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <BadgePercent className="h-5 w-5 text-dealer" />
                  Special wholesale pricing
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Gift className="h-5 w-5 text-dealer" />
                  Bulk order discounts
                </li>
              </ul>
              <Link to="/auth?type=dealer">
                <Button variant="dealer" size="lg" className="w-full gap-2">
                  Continue as Dealer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Legal Notice */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto bg-muted/80 rounded-xl p-4 border border-border">
            ⚠️ <strong>Important Notice:</strong> This website is for estimation purposes only. 
            No online payment or sale is conducted as per Indian regulations. 
            Final orders will be confirmed via WhatsApp.
          </p>
        </div>
      </div>
    </section>
  );
}
