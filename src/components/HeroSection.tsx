import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Truck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";

const trustBadges = [
  { icon: ShieldCheck, text: "100% Original", subtext: "Sivakasi Products" },
  { icon: Truck, text: "Pan India", subtext: "Delivery Available" },
  { icon: Star, text: "25+ Years", subtext: "Trusted Business" },
  { icon: Sparkles, text: "Best Prices", subtext: "Wholesale Rates" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Diwali Celebration"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-12 sm:py-20 lg:py-32">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 animate-fade-in">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
            <span className="text-xs sm:text-sm font-medium text-secondary">Sivakasi's Trusted Wholesaler</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-card mb-4 sm:mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Premium Quality{" "}
            <span className="text-gradient-gold">Crackers</span>{" "}
            at Wholesale Prices
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-card/80 mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Get the best quality firecrackers from Sivakasi with special wholesale pricing for dealers and retail customers. 
            Estimate your order and we'll deliver joy to your doorstep!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/products" className="w-full sm:w-auto">
              <Button variant="hero" size="lg" className="gap-2 w-full sm:w-auto">
                Browse Products
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link to="/auth" className="w-full sm:w-auto">
              <Button variant="gold" size="lg" className="w-full sm:w-auto">
                Dealer Login
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {trustBadges.map((badge, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 sm:gap-3 bg-card/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-card/20"
              >
                <div className="p-1.5 sm:p-2 rounded-lg gradient-gold shrink-0">
                  <badge.icon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-card text-xs sm:text-sm truncate">{badge.text}</p>
                  <p className="text-[10px] sm:text-xs text-card/70 truncate">{badge.subtext}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-20 h-20 rounded-full bg-secondary/30 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-40 w-32 h-32 rounded-full bg-accent/20 blur-3xl animate-float" style={{ animationDelay: "1s" }} />
    </section>
  );
}
